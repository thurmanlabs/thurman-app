import { Prisma, LoanPool as PrismaLoanPool, User } from "@prisma/client";
import db from "../../utils/prismaClient";

type LoanPoolWithCreator = PrismaLoanPool & {
    creator: User;
};

type LoanPoolWithCreatorAndApprover = PrismaLoanPool & {
    creator: User;
    approver: User | null;
};

type CreateLoanPoolParams = {
    formData: {
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
    };
    loanData: {
        borrower_address: string;
        originator_address: string;
        retention_rate: number;
        principal: number;
        term_months: number;
        interest_rate: number;
        business_name?: string;
        loan_purpose?: string;
        risk_grade?: string;
    }[];
    userId: number;
}

type UpdateDeploymentStatusParams = {
    poolId: number;
    status: string;
    txData: {
        pool_creation_tx_id?: string;
        pool_creation_tx_hash?: string;
        pool_config_tx_id?: string;
        pool_config_tx_hash?: string;
        loans_creation_tx_id?: string;
        loans_creation_tx_hash?: string;
        pool_id?: number;
        vault_address?: string;
    };
}

type LoanPoolWithRelations = {
    id: number;
    name: string | null;
    description: string | null;
    target_amount: Prisma.Decimal | null;
    minimum_investment: Prisma.Decimal | null;
    expected_return: Prisma.Decimal | null;
    maturity_date: Date | null;
    purpose: string | null;
    geographic_focus: string | null;
    borrower_profile: string | null;
    collateral_type: string | null;
    loan_term_range: string | null;
    interest_rate_range: string | null;
    loan_data: string;
    total_loans: number;
    total_principal: Prisma.Decimal;
    avg_interest_rate: Prisma.Decimal;
    avg_term_months: number;
    original_filename: string;
    status: string;
    created_by: number;
    approved_by: number | null;
    rejection_reason: string | null;
    approved_at: Date | null;
    pool_creation_tx_id: string | null;
    pool_config_tx_id: string | null;
    loans_creation_tx_id: string | null;
    pool_creation_tx_hash: string | null;
    pool_config_tx_hash: string | null;
    loans_creation_tx_hash: string | null;
    deployed_by_wallet_id: string | null;
    pool_id: number | null;
    vault_address: string | null;
    created_at: Date;
    updated_at: Date;
    creator: {
        id: number;
        email: string | null;
        role: string;
        status: string;
    };
    approver?: {
        id: number;
        email: string | null;
        role: string;
        status: string;
    } | null;
}

type LoanPoolDetails = LoanPoolWithRelations & {
    loans?: {
        borrower_address: string;
        originator_address: string;
        retention_rate: number;
        principal: number;
        term_months: number;
        interest_rate: number;
        business_name?: string;
        loan_purpose?: string;
        risk_grade?: string;
    }[];
}

// Helper to calculate metrics
function calculateMetrics(loanData: any[]): {
    total_loans: number;
    total_principal: number;
    avg_interest_rate: number;
    avg_term_months: number;
} {
    const total_loans = loanData.length;
    const total_principal = loanData.reduce((sum, l) => sum + Number(l.principal), 0);
    const avg_interest_rate = total_loans > 0 
        ? loanData.reduce((sum, l) => sum + Number(l.interest_rate), 0) / total_loans 
        : 0;
    const avg_term_months = total_loans > 0 
        ? Math.round(loanData.reduce((sum, l) => sum + Number(l.term_months), 0) / total_loans) 
        : 0;
    
    return {
        total_loans,
        total_principal,
        avg_interest_rate,
        avg_term_months,
    };
}

export async function createLoanPool({
    formData,
    loanData,
    userId
}: CreateLoanPoolParams): Promise<LoanPoolWithRelations> {
    try {
        const metrics = calculateMetrics(loanData);
        const created = await db.loanPool.create({
            data: {
                ...formData,
                loan_data: JSON.stringify(loanData),
                total_loans: metrics.total_loans,
                total_principal: metrics.total_principal,
                avg_interest_rate: metrics.avg_interest_rate,
                avg_term_months: metrics.avg_term_months,
                created_by: userId,
                status: 'PENDING',
            },
            include: {
                creator: true,
            },
        });
        return created as unknown as LoanPoolWithRelations;
    } catch (err) {
        console.error("Error creating loan pool:", err);
        throw new Error(err instanceof Error ? `Failed to create loan pool: ${err.message}` : "Failed to create loan pool");
    }
}

export async function findUserPools(userId: number): Promise<LoanPoolWithRelations[]> {
    try {
        return db.loanPool.findMany({
            where: { created_by: userId },
            include: { creator: true },
            orderBy: { created_at: 'desc' },
        }) as unknown as Promise<LoanPoolWithRelations[]>;
    } catch (err) {
        console.error("Error finding user pools:", err);
        throw new Error(err instanceof Error ? `Failed to find user pools: ${err.message}` : "Failed to find user pools");
    }
}

export async function findPendingPools(): Promise<LoanPoolWithRelations[]> {
    try {
        return db.loanPool.findMany({
            where: { 
                status: { 
                    in: [
                        'PENDING',           // Need approval
                        'APPROVED',          // Approved but not deployed
                        'DEPLOYING_POOL',    // In deployment process
                        'POOL_CREATED',      // Pool created, needs next step
                        'CONFIGURING_POOL',  // Configuring pool
                        'POOL_CONFIGURED',   // Pool configured, needs loans
                        'DEPLOYING_LOANS',   // Deploying loans
                        'FAILED'             // Failed deployments need attention
                    ] as any
                } 
            },
            include: { creator: true },
            orderBy: { created_at: 'desc' },
        }) as unknown as Promise<LoanPoolWithRelations[]>;
    } catch (err) {
        console.error("Error finding pending pools:", err);
        throw new Error(err instanceof Error ? `Failed to find pending pools: ${err.message}` : "Failed to find pending pools");
    }
}

export async function findActivePools(): Promise<LoanPoolWithRelations[]> {
    try {
        return db.loanPool.findMany({
            where: { 
                status: { 
                    in: ['DEPLOYED', 'POOL_CREATED', 'DEPLOYING_LOANS'] 
                } 
            },
            include: { 
                creator: true,
                approver: true 
            },
            orderBy: { created_at: 'desc' },
        }) as unknown as Promise<LoanPoolWithRelations[]>;
    } catch (err) {
        console.error("Error finding active pools:", err);
        throw new Error(err instanceof Error ? `Failed to find active pools: ${err.message}` : "Failed to find active pools");
    }
}

export async function approveLoanPool(poolId: number, adminId: number, walletId: string): Promise<LoanPoolWithRelations | null> {
    try {
        return db.loanPool.update({
            where: { id: poolId },
            data: {
                status: 'APPROVED',
                approved_by: adminId,
                approved_at: new Date(),
                deployed_by_wallet_id: walletId,
                rejection_reason: null,
            },
            include: {
                creator: true,
                approver: true,
            },
        }) as Promise<LoanPoolWithRelations | null>;
    } catch (err) {
        console.error("Error approving loan pool:", err);
        throw new Error(err instanceof Error ? `Failed to approve loan pool: ${err.message}` : "Failed to approve loan pool");
    }
}

export async function rejectLoanPool(poolId: number, adminId: number, reason: string): Promise<LoanPoolWithRelations | null> {
    try {
        return db.loanPool.update({
            where: { id: poolId },
            data: {
                status: 'REJECTED',
                approved_by: adminId,
                approved_at: new Date(),
                rejection_reason: reason,
            },
            include: {
                creator: true,
                approver: true,
            },
        }) as Promise<LoanPoolWithRelations | null>;
    } catch (err) {
        console.error("Error rejecting loan pool:", err);
        throw new Error(err instanceof Error ? `Failed to reject loan pool: ${err.message}` : "Failed to reject loan pool");
    }
}

export async function updateDeploymentStatus({
    poolId,
    status,
    txData
}: UpdateDeploymentStatusParams): Promise<LoanPoolWithRelations | null> {
    try {
        return db.loanPool.update({
            where: { id: poolId },
            data: {
                status: status as any,
                ...txData,
            },
            include: {
                creator: true,
                approver: true,
            },
        }) as Promise<LoanPoolWithRelations | null>;
    } catch (err) {
        console.error("Error updating deployment status:", err);
        throw new Error(err instanceof Error ? `Failed to update deployment status: ${err.message}` : "Failed to update deployment status");
    }
}

export async function findByTransactionId(txId: string): Promise<LoanPoolWithRelations | null> {
    try {
        return db.loanPool.findFirst({
            where: {
                OR: [
                    { pool_creation_tx_id: txId },
                    { pool_config_tx_id: txId },
                    { loans_creation_tx_id: txId },
                ],
            },
            include: {
                creator: true,
                approver: true,
            },
        }) as Promise<LoanPoolWithRelations | null>;
    } catch (err) {
        console.error("Error finding pool by transaction ID:", err);
        throw new Error(err instanceof Error ? `Failed to find pool by transaction ID: ${err.message}` : "Failed to find pool by transaction ID");
    }
}

export async function getLoanPoolDetails(poolId: number, includeLoans = false): Promise<LoanPoolDetails | null> {
    try {
        const pool = await db.loanPool.findUnique({
            where: { id: poolId },
            include: {
                creator: true,
                approver: true,
            },
        });
        if (!pool) return null;
        let parsedLoans = undefined;
        if (includeLoans) {
            try {
                parsedLoans = JSON.parse(pool.loan_data);
            } catch {
                parsedLoans = [];
            }
        }
        return {
            ...pool,
            loans: includeLoans ? parsedLoans : undefined,
            creator: pool.creator,
            approver: pool.approver,
        } as LoanPoolDetails;
    } catch (err) {
        console.error("Error getting loan pool details:", err);
        throw new Error(err instanceof Error ? `Failed to get loan pool details: ${err.message}` : "Failed to get loan pool details");
    }
}

export const LoanPool = {
    createLoanPool,
    findUserPools,
    findPendingPools,
    findActivePools,
    approveLoanPool,
    rejectLoanPool,
    updateDeploymentStatus,
    findByTransactionId,
    getLoanPoolDetails,
}; 