import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import circleContractClient from "../utils/circleContractClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import { parseUnits, formatUnits } from "ethers";
import db from "../utils/prismaClient";

// ============================================================================
// CIRCLE SDK CONTRACT TRANSACTION FOUNDATION
// ============================================================================

// Thurman Protocol ABI Function Signatures
export const THURMAN_ABI = {
    // USDC Token Contract
    USDC_APPROVE: "approve(address,uint256)",
    
    // Pool Manager Contract - Deposit Functions
    POOL_MANAGER_REQUEST_DEPOSIT: "requestDeposit(uint16,uint256,address)",
    POOL_MANAGER_FULFILL_DEPOSIT: "fulfillDeposit(uint16,uint256,address)",
    POOL_MANAGER_DEPOSIT: "deposit(uint16,uint256,address)",
    
    // Pool Manager Contract - Pool Management (existing)
    POOL_MANAGER_ADD_POOL: "addPool(address,address,uint256)",
    POOL_MANAGER_SET_POOL_SETTINGS: "setPoolOperationalSettings(uint16,bool,bool,bool,bool,uint256,uint256,uint256)",
    POOL_MANAGER_BATCH_INIT_LOAN: "batchInitLoan(uint16,(address,uint256,uint256,uint16,uint256)[],address)"
};

// TypeScript Interfaces
export interface TransactionRequest {
    contractAddress: string;
    functionSignature: string;
    parameters: any[];
    walletId: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export interface TransactionResponse {
    transactionId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    error?: string;
}

export interface DepositRequest {
    poolId: number;
    amount: string; // USDC amount in human readable format (e.g., "100.50")
    userAddress: string;
    walletId: string;
}

export interface DepositFulfillment {
    poolId: number;
    amount: string;
    userAddress: string;
    adminWalletId: string;
}

// ============================================================================
// PARAMETER FORMATTING UTILITIES
// ============================================================================

/**
 * Convert USDC amount to 6-decimal wei format
 * @param amount - Human readable USDC amount (e.g., "100.50")
 * @returns Formatted amount as string for contract calls
 */
export const parseUSDCAmount = (amount: string): string => {
    try {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid USDC amount: ${amount}`);
        }
        return parseUnits(amount, 6).toString();
    } catch (error) {
        throw new Error(`Failed to parse USDC amount ${amount}: ${error}`);
    }
};

/**
 * Format pool ID as uint16 string
 * @param poolId - Pool ID number
 * @returns Formatted pool ID as string
 */
export const formatPoolId = (poolId: number): string => {
    if (!Number.isInteger(poolId) || poolId < 0 || poolId > 65535) {
        throw new Error(`Invalid pool ID: ${poolId}. Must be uint16 (0-65535)`);
    }
    return poolId.toString();
};

/**
 * Validate and format Ethereum address
 * @param address - Ethereum address
 * @returns Formatted address (checksummed if possible)
 */
export const formatAddress = (address: string): string => {
    if (!address || typeof address !== 'string') {
        throw new Error(`Invalid address: ${address}`);
    }
    
    // Basic Ethereum address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
        throw new Error(`Invalid Ethereum address format: ${address}`);
    }
    
    return address.toLowerCase();
};

/**
 * Validate all transaction parameters before execution
 * @param request - Transaction request object
 * @returns Validated and formatted parameters
 */
export const validateTransactionParams = (request: TransactionRequest): any[] => {
    const { contractAddress, functionSignature, parameters, walletId } = request;
    
    // Validate contract address
    if (!contractAddress || !formatAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
    }
    
    // Validate function signature
    if (!functionSignature || typeof functionSignature !== 'string') {
        throw new Error(`Invalid function signature: ${functionSignature}`);
    }
    
    // Validate wallet ID
    if (!walletId || typeof walletId !== 'string') {
        throw new Error(`Invalid wallet ID: ${walletId}`);
    }
    
    // Validate parameters array
    if (!Array.isArray(parameters)) {
        throw new Error(`Parameters must be an array`);
    }
    
    return parameters;
};

// ============================================================================
// CORE TRANSACTION EXECUTION FUNCTION
// ============================================================================

/**
 * Execute contract transaction using Circle SDK
 * @param request - Transaction request with all parameters
 * @returns Transaction response with ID and status
 */
export const executeContractTransaction = async (
    request: TransactionRequest
): Promise<TransactionResponse> => {
    const { contractAddress, functionSignature, parameters, walletId, feeLevel = "MEDIUM" } = request;
    
    // Generate idempotency key
    const idempotencyKey = uuidv4();
    
    try {
        // Validate and format parameters
        const validatedParams = validateTransactionParams(request);
        
        console.log(`🔄 Executing contract transaction:`, {
            contractAddress,
            functionSignature,
            parameters: validatedParams,
            walletId,
            idempotencyKey
        });
        
        // Execute transaction via Circle SDK
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress,
            abiFunctionSignature: functionSignature,
            abiParameters: validatedParams,
            walletId,
            fee: {
                type: "level",
                config: {
                    feeLevel
                }
            }
        });
        
        const transactionId = contractExecution.data?.id;
        
        if (!transactionId) {
            throw new Error("No transaction ID returned from Circle SDK");
        }
        
        console.log(`✅ Contract transaction executed successfully:`, {
            transactionId,
            contractAddress,
            functionSignature
        });
        
        return {
            transactionId,
            status: "PENDING"
        };
        
    } catch (error: any) {
        console.error(`❌ Contract transaction failed:`, {
            error: error.message,
            contractAddress,
            functionSignature,
            parameters,
            walletId,
            idempotencyKey
        });
        
        return {
            transactionId: idempotencyKey, // Use idempotency key as fallback ID
            status: "FAILED",
            error: error.message || "Unknown transaction error"
        };
    }
};

// ============================================================================
// DEPOSIT-SPECIFIC TRANSACTION FUNCTIONS
// ============================================================================

// ============================================================================
// ENHANCED DEPOSIT TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Create USDC approval transaction
 * @param amount - USDC amount to approve (human readable format)
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createUSDCApproval = async (
    amount: string, 
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating USDC approval for ${amount} USDC, wallet: ${userWalletId}`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "approve");
        
        // Get pool manager address from environment
        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
        if (!poolManagerAddress) {
            throw new Error("Pool manager address not configured");
        }
        
        // Format parameters for approve(address,uint256)
        const parameters = [
            formatAddress(poolManagerAddress), // spender address
            parseUSDCAmount(amount) // amount to approve
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.USDC_ADDRESS || "",
            functionSignature: THURMAN_ABI.USDC_APPROVE,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ USDC approval transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ USDC approval failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create USDC approval:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create deposit request transaction
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createDepositRequest = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating deposit request for pool ${poolId}, amount: ${amount} USDC`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "deposit");
        
        // TODO: Validate pool exists and deposits are enabled
        // This would typically query the pool manager contract
        // await validatePoolDepositsEnabled(poolId);
        
        // Format parameters for requestDeposit(uint16,uint256,address)
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_REQUEST_DEPOSIT,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Deposit request transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Deposit request failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create deposit request:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create deposit fulfillment transaction (admin only)
 * @param poolId - Pool ID to fulfill deposit for
 * @param amount - USDC amount to fulfill (human readable format)
 * @param userAddress - User's Ethereum address
 * @param adminWalletId - Admin's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createDepositFulfillment = async (
    poolId: number,
    amount: string,
    userAddress: string,
    adminWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating deposit fulfillment for pool ${poolId}, user: ${userAddress}, amount: ${amount} USDC`);
        
        // Validate admin wallet exists and has admin permissions
        await validateWalletPermissions(adminWalletId, "admin");
        
        // Format parameters for fulfillDeposit(uint16,uint256,address)
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_FULFILL_DEPOSIT,
            parameters,
            walletId: adminWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Deposit fulfillment transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Deposit fulfillment failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create deposit fulfillment:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create share claiming transaction
 * @param poolId - Pool ID to claim shares from
 * @param amount - USDC amount to claim (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createShareClaim = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating share claim for pool ${poolId}, user: ${userAddress}, amount: ${amount} USDC`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "claim");
        
        // TODO: Validate user has claimable amount
        // This would typically query the pool manager contract
        // await validateClaimableAmount(poolId, userAddress, amount);
        
        // Format parameters for deposit(uint16,uint256,address) - same as direct deposit
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_DEPOSIT,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Share claim transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Share claim failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create share claim:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

// ============================================================================
// WALLET MANAGEMENT HELPERS
// ============================================================================

/**
 * Get user's Circle wallet ID from database
 * @param userId - User ID from database
 * @returns Circle wallet ID
 */
export const getUserWalletId = async (userId: number): Promise<string> => {
    try {
        const wallet = await db.wallet.findFirst({
            where: {
                userId: userId,
                accountType: "SCA" // Smart Contract Account
            }
        });
        
        if (!wallet || !wallet.id) {
            throw new Error(`No Circle wallet found for user ${userId}`);
        }
        
        return wallet.id;
    } catch (error: any) {
        console.error(`Failed to get user wallet ID for user ${userId}:`, error);
        throw new Error(`Wallet not found for user ${userId}`);
    }
};

/**
 * Get admin wallet ID for fulfillments
 * @returns Admin Circle wallet ID
 */
export const getAdminWalletId = async (): Promise<string> => {
    try {
        // Look for admin wallet in database
        const adminWallet = await db.wallet.findFirst({
            where: {
                name: { contains: "admin" },
                accountType: "SCA"
            }
        });
        
        if (adminWallet?.id) {
            return adminWallet.id;
        }
        
        // Fallback to environment variable
        const envAdminWalletId = process.env.ADMIN_WALLET_ID;
        if (envAdminWalletId) {
            return envAdminWalletId;
        }
        
        throw new Error("No admin wallet configured");
    } catch (error: any) {
        console.error("Failed to get admin wallet ID:", error);
        throw new Error("Admin wallet not found");
    }
};

/**
 * Validate wallet permissions for specific action
 * @param walletId - Circle wallet ID
 * @param action - Action to validate ("approve", "deposit", "claim", "admin")
 * @returns Promise that resolves if wallet has permissions
 */
export const validateWalletPermissions = async (
    walletId: string, 
    action: "approve" | "deposit" | "claim" | "admin"
): Promise<void> => {
    try {
        // Check if wallet exists in database
        const wallet = await db.wallet.findUnique({
            where: { id: walletId }
        });
        
        if (!wallet) {
            throw new Error(`Wallet ${walletId} not found in database`);
        }
        
        // For admin actions, check if wallet has admin privileges
        if (action === "admin") {
            const isAdmin = wallet.name?.toLowerCase().includes("admin") || 
                           wallet.userId === parseInt(process.env.ADMIN_USER_ID || "0");
            
            if (!isAdmin) {
                throw new Error(`Wallet ${walletId} does not have admin permissions`);
            }
        }
        
        // Additional validation could be added here:
        // - Check wallet status
        // - Check user permissions
        // - Check wallet balance for certain actions
        
        console.log(`✅ Wallet ${walletId} validated for ${action} action`);
        
    } catch (error: any) {
        console.error(`❌ Wallet permission validation failed for ${action}:`, error);
        throw error;
    }
};

// ============================================================================
// COMPLETE TWO-STEP DEPOSIT FLOW
// ============================================================================

/**
 * Complete two-step deposit flow: USDC approval + deposit request
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Object with both transaction IDs and status
 */
export const executeFullDepositRequest = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<{
    approvalTransaction: TransactionResponse;
    depositTransaction: TransactionResponse;
    success: boolean;
    error?: string;
}> => {
    try {
        console.log(`🔄 Starting full deposit request flow for pool ${poolId}, amount: ${amount} USDC`);
        
        // Step 1: Create USDC approval transaction
        console.log("Step 1: Creating USDC approval transaction...");
        const approvalResult = await createUSDCApproval(amount, userWalletId);
        
        if (approvalResult.status === "FAILED") {
            console.error("❌ USDC approval failed, aborting deposit request");
            return {
                approvalTransaction: approvalResult,
                depositTransaction: {
                    transactionId: "",
                    status: "FAILED",
                    error: "Approval failed"
                },
                success: false,
                error: `USDC approval failed: ${approvalResult.error}`
            };
        }
        
        // Step 2: Create deposit request transaction
        console.log("Step 2: Creating deposit request transaction...");
        const depositResult = await createDepositRequest(poolId, amount, userAddress, userWalletId);
        
        if (depositResult.status === "FAILED") {
            console.error("❌ Deposit request failed after successful approval");
            return {
                approvalTransaction: approvalResult,
                depositTransaction: depositResult,
                success: false,
                error: `Deposit request failed: ${depositResult.error}`
            };
        }
        
        console.log("✅ Full deposit request flow completed successfully");
        return {
            approvalTransaction: approvalResult,
            depositTransaction: depositResult,
            success: true
        };
        
    } catch (error: any) {
        console.error("❌ Full deposit request flow failed:", error);
        return {
            approvalTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "Flow failed"
            },
            depositTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "Flow failed"
            },
            success: false,
            error: error.message
        };
    }
};

/**
 * Alternative: Execute full deposit request with user ID instead of wallet ID
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userId - User ID from database
 * @returns Object with both transaction IDs and status
 */
export const executeFullDepositRequestByUserId = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userId: number
): Promise<{
    approvalTransaction: TransactionResponse;
    depositTransaction: TransactionResponse;
    success: boolean;
    error?: string;
}> => {
    try {
        // Get user's wallet ID
        const userWalletId = await getUserWalletId(userId);
        
        // Execute the full deposit request flow
        return await executeFullDepositRequest(poolId, amount, userAddress, userWalletId);
        
    } catch (error: any) {
        console.error("❌ Full deposit request by user ID failed:", error);
        return {
            approvalTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "User wallet not found"
            },
            depositTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "User wallet not found"
            },
            success: false,
            error: error.message
        };
    }
};

// ============================================================================
// EXISTING CODE (KEPT FOR BACKWARD COMPATIBILITY)
// ============================================================================

// Smart Contract ABI Definitions
const POOL_MANAGER_ABI = {
    addPool: "addPool(address,address,uint256)",
    setPoolOperationalSettings: "setPoolOperationalSettings(uint16,bool,bool,bool,bool,uint256,uint256,uint256)",
    batchInitLoan: "batchInitLoan(uint16,(address,uint256,uint256,uint16,uint256)[],address)"
};

// Loan Data Interface
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

type CreateWalletParams = {
    accountType: AccountType | undefined;
    blockchains: Blockchain[];
    name: string;
    refId: string;
    walletSetId: string;
}

type CreateWalletReturnParams = {
    walletId: string | null | undefined;
    address: string | undefined;
}

const formatBlockchainData = (walletId: string | undefined, blockchains: Blockchain[]): { chainId: string, name: string }[] => {
    return blockchains.map(blockchain => ({
        chainId: blockchain.toString() === "MATIC" ? "137" : 
                blockchain.toString() === "MATIC-AMOY" ? "80002" : 
                blockchain.toString() === "ETH-SEPOLIA" ? "11155111" : 
                blockchain.toString() === "ETH" ? "1" : 
                blockchain.toString() === "AVAX" ? "43114" : 
                blockchain.toString() === "AVAX-FUJI" ? "43113" : 
                blockchain.toString() === "ARB" ? "42161" : 
                blockchain.toString() === "ARB-SEPOLIA" ? "421614" : 
                blockchain.toString() === "BASE" ? "8453" : 
                blockchain.toString() === "BASE-SEPOLIA" ? "84532" : "",
        name: blockchain.toString()
    }));
};

export const createDeveloperWallet = async ({
    accountType,
    blockchains,
    name,
    refId,
    walletSetId
}: CreateWalletParams): Promise<Wallet | null> => {
    const idempotencyKey = uuidv4();

    try {
        let wallet = await circleClient.createWallets({
            idempotencyKey: idempotencyKey,
            accountType: accountType,
            blockchains: blockchains,
            metadata: [{ name: name, refId: refId }],
            count: 1,
            walletSetId: walletSetId,
        })

        let walletId = wallet.data?.wallets[0].id;

        const walletRecord = await createWallet({
            id: walletId,
            address: wallet.data?.wallets[0].address ? wallet.data?.wallets[0].address : "",
            custodyType: wallet.data?.wallets[0].custodyType ? wallet.data?.wallets[0].custodyType : "EOA",
            accountType: "SCA",
            name: wallet.data?.wallets[0].name,
            userId: wallet.data?.wallets[0].refId ? parseInt(wallet.data?.wallets[0].refId) : undefined,
            blockchains: formatBlockchainData(walletId, blockchains)
        });

        return walletRecord;
    } catch (e: any) {
        console.error(e);
        return null;
    }
}

// Loan Pool Deployment Types
type DeployPoolParams = {
    adminWalletId: string;
    vaultAddress: string;
    originatorRegistryAddress: string;
    poolManagerAddress: string;
}

type DeployPoolAndLoansResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type ConfigurePoolResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type DeployLoansResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type LoanParameter = {
    borrower: string;
    originator: string;
    retentionRate: string;
    principal: string;
    termMonths: number;
    interestRate: string;
}

// Helper Functions for Smart Contract Integration
const formatPoolParameters = (params: {
    vaultAddress: string;
    originatorRegistryAddress: string;
    marginFee: number;
}) => {
    return [
        params.vaultAddress,
        params.originatorRegistryAddress,
        parseUnits(params.marginFee.toString(), 18).toString() // Convert BigInt to string
    ];
};

const formatLoanParameters = (loans: LoanData[]): any[] => {
    return loans.map(loan => [
        loan.borrower_address,
        parseUnits(loan.retention_rate.toString(), 18).toString(), // retention rate as decimal (0.05 = 5%)
        parseUnits(loan.principal.toString(), 6).toString(), // principal in USDC (6 decimals)
        loan.term_months, // term in months (uint16)
        parseUnits(loan.interest_rate.toString(), 18).toString() // interest rate as decimal (0.085 = 8.5%)
    ]);
};

const parsePoolCreatedEvent = async (txHash: string): Promise<number | null> => {
    try {
        console.log(`Parsing PoolCreated event from transaction: ${txHash}`);
        
        // TODO: IMPLEMENT ACTUAL BLOCKCHAIN EVENT PARSING
        // This is where we would:
        // 1. Use Circle's API to get transaction details
        // 2. Parse the transaction logs for PoolCreated event
        // 3. Extract the actual pool ID from the event data
        
        // For now, we'll use a temporary workaround
        // WARNING: This may not match the actual blockchain pool ID!
        
        // Get the next available pool ID by finding the maximum existing SUCCESSFUL pool ID and adding 1
        // This accounts for non-sequential pool IDs (like 0, 1, 2, 5) and excludes failed pools
        const successfulPools = await db.loanPool.findMany({
            where: {
                pool_id: { not: null },
                status: { 
                    in: ['POOL_CREATED', 'POOL_CONFIGURED', 'DEPLOYING_LOANS', 'DEPLOYED'] as any
                }
            },
            select: {
                pool_id: true
            }
        });
        
        const maxPoolId = successfulPools.length > 0 ? Math.max(...successfulPools.map(p => p.pool_id!)) : -1;
        const nextPoolId = maxPoolId + 1; // Next pool ID after the maximum successful pool
        
        console.log(`⚠️  TEMPORARY: Using sequential pool ID: ${nextPoolId} for transaction: ${txHash}`);
        console.log(`⚠️  WARNING: This may not match the actual blockchain pool ID!`);
        console.log(`⚠️  TODO: Implement proper event parsing to get real blockchain pool ID`);
        
        return nextPoolId;
    } catch (error: any) {
        console.error("Error parsing PoolCreated event:", error);
        return null;
    }
};

// Loan Pool Deployment Functions
export const deployPoolAndLoans = async ({
    adminWalletId,
    vaultAddress,
    originatorRegistryAddress,
    poolManagerAddress
}: DeployPoolParams): Promise<DeployPoolAndLoansResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Format parameters for smart contract call
        const poolParameters = formatPoolParameters({
            vaultAddress,
            originatorRegistryAddress,
            marginFee: 0.005 // 0.5%
        });

        // Execute smart contract call via Circle
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.addPool,
            abiParameters: poolParameters,
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Pool creation transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error deploying pool:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy pool"
        };
    }
};

export const configurePoolSettings = async ({
    poolId,
    adminWalletId,
    poolManagerAddress
}: {
    poolId: number;
    adminWalletId: string;
    poolManagerAddress: string;
}): Promise<ConfigurePoolResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Configure pool to enable borrowing and other operations
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.setPoolOperationalSettings,
            abiParameters: [
                poolId.toString(), // poolId
                true, // depositsEnabled
                true, // withdrawalsEnabled
                true, // borrowingEnabled (required for batchInitLoan)
                false, // isPaused
                "0", // maxDepositAmount (0 = no limit)
                "0", // minDepositAmount (0 = no minimum)
                "0"  // depositCap (0 = no cap)
            ],
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Pool configuration transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error configuring pool settings:", error);
        return {
            success: false,
            error: error.message || "Failed to configure pool settings"
        };
    }
};

export const deployLoans = async ({
    loanData,
    poolId,
    adminWalletId,
    poolManagerAddress,
    originatorAddress
}: {
    loanData: any[];
    poolId: number;
    adminWalletId: string;
    poolManagerAddress: string;
    originatorAddress: string;
}): Promise<DeployLoansResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Format loan parameters for batch initialization
        const loanParameters = formatLoanParameters(loanData);

        // Execute batch loan initialization via Circle
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.batchInitLoan,
            abiParameters: [poolId.toString(), loanParameters, originatorAddress], // Convert poolId to string
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Loan batch initialization transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error deploying loans:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy loans"
        };
    }
};

export const getPoolIdFromTransaction = async (txHash: string): Promise<number | null> => {
    try {
        // Parse the transaction logs to extract pool ID
        return await parsePoolCreatedEvent(txHash);
    } catch (error: any) {
        console.error("Error getting pool ID from transaction:", error);
        return null;
    }
};

// Helper function to clean up failed pool IDs (reset them to null so they don't interfere with future assignments)
export const cleanupFailedPoolIds = async (): Promise<void> => {
    try {
        const failedPools = await db.loanPool.findMany({
            where: {
                status: 'FAILED',
                pool_id: { not: null }
            },
            select: {
                id: true,
                pool_id: true
            }
        });

        if (failedPools.length > 0) {
            console.log(`Found ${failedPools.length} failed pools with pool_id that need cleanup`);
            
            for (const pool of failedPools) {
                await db.loanPool.update({
                    where: { id: pool.id },
                    data: { pool_id: null }
                });
                console.log(`✅ Reset pool_id to null for failed pool ${pool.id} (was ${pool.pool_id})`);
            }
        }
    } catch (error: any) {
        console.error("Error cleaning up failed pool IDs:", error);
    }
};