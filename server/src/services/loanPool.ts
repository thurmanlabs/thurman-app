import { 
    createLoanPool,
    getLoanPoolDetails,
    approveLoanPool,
    findByTransactionId,
    updateDeploymentStatus
} from "../prisma/models";
import { parseLoanCSV, validateLoanData } from "./csvProcessor";
import { deployPoolAndLoans, deployLoans, getPoolIdFromTransaction } from "./circle";

// Custom Error Classes
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class DeploymentError extends Error {
    constructor(message: string, public transactionId?: string) {
        super(message);
        this.name = "DeploymentError";
    }
}

export class BusinessRuleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BusinessRuleError";
    }
}

// Type Definitions
interface FormData {
    name?: string;
    description?: string;
    target_amount?: number;
    minimum_investment?: number;
    expected_return?: number;
    maturity_date?: Date;
    purpose?: string;
    geographic_focus?: string;
    borrower_profile?: string;
    collateral_type?: string;
    loan_term_range?: string;
    interest_rate_range?: string;
    original_filename: string;
}

interface LoanData {
    borrower_address: string;
    originator_address: string;
    retention_rate: number;
    principal: number;
    term_months: number;
    interest_rate: number;
    business_name?: string;
    loan_purpose?: string;
    risk_grade?: string;
}

interface PoolMetrics {
    total_loans: number;
    total_principal: number;
    avg_interest_rate: number;
    avg_term_months: number;
    min_principal: number;
    max_principal: number;
    avg_retention_rate: number;
}

interface CreatePoolResult {
    success: boolean;
    poolId?: number;
    metrics?: PoolMetrics;
    error?: string;
}

interface DeploymentResult {
    success: boolean;
    transactionId?: string;
    status?: string;
    error?: string;
}

interface WebhookNotification {
    transactionId: string;
    status: string;
    txHash?: string;
    error?: string;
}

// Helper Functions
export const calculatePoolMetrics = (loanData: LoanData[]): PoolMetrics => {
    if (loanData.length === 0) {
        throw new ValidationError("No loan data provided for metrics calculation");
    }

    const total_loans = loanData.length;
    const total_principal = loanData.reduce((sum, loan) => sum + loan.principal, 0);
    const avg_interest_rate = loanData.reduce((sum, loan) => sum + loan.interest_rate, 0) / total_loans;
    const avg_term_months = Math.round(loanData.reduce((sum, loan) => sum + loan.term_months, 0) / total_loans);
    const min_principal = Math.min(...loanData.map(loan => loan.principal));
    const max_principal = Math.max(...loanData.map(loan => loan.principal));
    const avg_retention_rate = loanData.reduce((sum, loan) => sum + loan.retention_rate, 0) / total_loans;

    return {
        total_loans,
        total_principal,
        avg_interest_rate,
        avg_term_months,
        min_principal,
        max_principal,
        avg_retention_rate
    };
};

export const validatePoolData = (formData: FormData, loanData: LoanData[]): void => {
    // Validate form data
    if (!formData.name || formData.name.trim().length < 3) {
        throw new ValidationError("Pool name must be at least 3 characters long", "name");
    }

    if (!formData.description || formData.description.trim().length < 10) {
        throw new ValidationError("Pool description must be at least 10 characters long", "description");
    }

    if (formData.target_amount && formData.target_amount <= 0) {
        throw new ValidationError("Target amount must be greater than 0", "target_amount");
    }

    if (formData.minimum_investment && formData.minimum_investment <= 0) {
        throw new ValidationError("Minimum investment must be greater than 0", "minimum_investment");
    }

    // Validate loan data business rules
    if (loanData.length === 0) {
        throw new ValidationError("At least one loan must be provided");
    }

    if (loanData.length > 1000) {
        throw new ValidationError("Maximum 1000 loans allowed per pool");
    }

    // Check for duplicate borrower addresses
    const borrowerAddresses = loanData.map(loan => loan.borrower_address.toLowerCase());
    const uniqueAddresses = new Set(borrowerAddresses);
    if (uniqueAddresses.size !== borrowerAddresses.length) {
        throw new ValidationError("Duplicate borrower addresses found in loan data");
    }

    // Validate total principal against target amount if specified
    const totalPrincipal = loanData.reduce((sum, loan) => sum + loan.principal, 0);
    if (formData.target_amount && totalPrincipal > formData.target_amount * 1.1) {
        throw new ValidationError("Total loan principal exceeds target amount by more than 10%");
    }
};

// Main Orchestration Functions
export const createPoolFromCSV = async (
    formData: FormData,
    file: Express.Multer.File,
    userId: number
): Promise<CreatePoolResult> => {
    try {
        console.log(`Starting pool creation workflow for user ${userId}`);

        // Step 1: Parse CSV file
        const loanData = await parseLoanCSV(file.buffer, file.originalname);
        console.log(`Parsed ${loanData.length} loans from CSV`);

        // Step 2: Validate loan data
        const validationResult = validateLoanData(loanData);
        if (validationResult.errors.length > 0) {
            throw new ValidationError(`CSV validation failed: ${validationResult.errors.join(", ")}`);
        }

        // Step 3: Additional business rule validation
        validatePoolData(formData, loanData);

        // Step 4: Calculate pool metrics
        const metrics = calculatePoolMetrics(loanData);
        console.log(`Calculated pool metrics: ${metrics.total_loans} loans, $${metrics.total_principal} total principal`);

        // Step 5: Create loan pool in database
        const pool = await createLoanPool({
            formData: {
                ...formData,
                original_filename: file.originalname
            },
            loanData,
            userId
        });

        console.log(`Successfully created loan pool ${pool.id}`);

        return {
            success: true,
            poolId: pool.id,
            metrics
        };

    } catch (error: any) {
        console.error("Error in createPoolFromCSV:", error);
        
        if (error instanceof ValidationError || error instanceof BusinessRuleError) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: "Failed to create loan pool. Please try again."
        };
    }
};

export const approveAndDeploy = async (
    poolId: number,
    adminId: number,
    walletId: string
): Promise<DeploymentResult> => {
    try {
        console.log(`Starting approval and deployment for pool ${poolId}`);

        // Step 1: Get pool details
        const pool = await getLoanPoolDetails(poolId, false);
        if (!pool) {
            throw new BusinessRuleError(`Pool ${poolId} not found`);
        }

        if (pool.status !== 'PENDING') {
            throw new BusinessRuleError(`Pool ${poolId} is not in PENDING status (current: ${pool.status})`);
        }

        // Step 2: Approve the pool
        const approvedPool = await approveLoanPool(poolId, adminId, walletId);
        if (!approvedPool) {
            throw new DeploymentError("Failed to approve loan pool");
        }

        console.log(`Pool ${poolId} approved by admin ${adminId}`);

        // Step 3: Get environment variables for deployment
        const vaultAddress = process.env.VAULT_ADDRESS;
        const aavePoolAddress = process.env.AAVE_POOL_ADDRESS;
        const originatorRegistryAddress = process.env.ORIGINATOR_REGISTRY_ADDRESS;
        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;

        if (!vaultAddress || !aavePoolAddress || !originatorRegistryAddress || !poolManagerAddress) {
            throw new DeploymentError("Missing required environment variables for deployment");
        }

        // Step 4: Initiate pool deployment
        const deploymentResult = await deployPoolAndLoans({
            adminWalletId: walletId,
            vaultAddress,
            aavePoolAddress,
            originatorRegistryAddress,
            poolManagerAddress
        });

        if (!deploymentResult.success) {
            throw new DeploymentError(
                deploymentResult.error || "Failed to initiate pool deployment",
                deploymentResult.transactionId
            );
        }

        console.log(`Pool deployment initiated with transaction ${deploymentResult.transactionId}`);

        return {
            success: true,
            transactionId: deploymentResult.transactionId,
            status: 'DEPLOYING_POOL'
        };

    } catch (error: any) {
        console.error("Error in approveAndDeploy:", error);
        
        if (error instanceof BusinessRuleError || error instanceof DeploymentError) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: "Failed to approve and deploy pool. Please try again."
        };
    }
};

export const handleDeploymentWebhook = async (notification: WebhookNotification): Promise<void> => {
    try {
        console.log(`Processing deployment webhook for transaction ${notification.transactionId}`);

        // Step 1: Find pool by transaction ID
        const pool = await findByTransactionId(notification.transactionId);
        if (!pool) {
            console.warn(`No pool found for transaction ${notification.transactionId}`);
            return;
        }

        console.log(`Found pool ${pool.id} for transaction ${notification.transactionId}`);

        // Step 2: Handle different transaction statuses
        switch (notification.status) {
            case 'COMPLETED':
                await handleCompletedTransaction(pool, notification);
                break;
            case 'FAILED':
                await handleFailedTransaction(pool, notification);
                break;
            case 'PENDING':
                console.log(`Transaction ${notification.transactionId} is still pending`);
                break;
            default:
                console.log(`Unknown transaction status: ${notification.status}`);
        }

    } catch (error: any) {
        console.error("Error processing deployment webhook:", error);
        throw error;
    }
};

const handleCompletedTransaction = async (pool: any, notification: WebhookNotification): Promise<void> => {
    if (pool.status === 'DEPLOYING_POOL') {
        // Pool creation completed, extract pool ID and deploy loans
        const poolId = await getPoolIdFromTransaction(notification.txHash || '');
        
        if (poolId) {
            console.log(`Pool created with ID ${poolId}, deploying loans...`);
            
            // Update pool with pool ID
            await updateDeploymentStatus({
                poolId: pool.id,
                status: 'POOL_CREATED',
                txData: {
                    pool_id: poolId,
                    pool_creation_tx_hash: notification.txHash
                }
            });

            // Parse loan data and deploy loans
            const loanData = JSON.parse(pool.loan_data);
            const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
            
            if (!poolManagerAddress) {
                throw new DeploymentError("Missing POOL_MANAGER_ADDRESS environment variable");
            }

            const deployResult = await deployLoans({
                loanData,
                poolId,
                adminWalletId: pool.deployed_by_wallet_id || '',
                poolManagerAddress
            });

            if (deployResult.success) {
                await updateDeploymentStatus({
                    poolId: pool.id,
                    status: 'DEPLOYING_LOANS',
                    txData: {
                        loans_creation_tx_id: deployResult.transactionId
                    }
                });
            } else {
                throw new DeploymentError(deployResult.error || "Failed to deploy loans");
            }
        } else {
            throw new DeploymentError("Failed to extract pool ID from transaction");
        }
    } else if (pool.status === 'DEPLOYING_LOANS') {
        // Loans deployment completed
        await updateDeploymentStatus({
            poolId: pool.id,
            status: 'DEPLOYED',
            txData: {
                loans_creation_tx_hash: notification.txHash
            }
        });
        console.log(`Pool ${pool.id} fully deployed`);
    }
};

const handleFailedTransaction = async (pool: any, notification: WebhookNotification): Promise<void> => {
    await updateDeploymentStatus({
        poolId: pool.id,
        status: 'FAILED',
        txData: {}
    });
    console.error(`Pool ${pool.id} deployment failed: ${notification.error}`);
};

export const getPoolSummary = async (poolId: number): Promise<any> => {
    try {
        const pool = await getLoanPoolDetails(poolId, true);
        if (!pool) {
            throw new BusinessRuleError(`Pool ${poolId} not found`);
        }

        return {
            ...pool,
            metrics: calculatePoolMetrics(pool.loans || [])
        };
    } catch (error: any) {
        console.error("Error getting pool summary:", error);
        throw error;
    }
};

// Export the service
export const LoanPool = {
    createPoolFromCSV,
    approveAndDeploy,
    handleDeploymentWebhook,
    calculatePoolMetrics,
    validatePoolData,
    getPoolSummary
}; 