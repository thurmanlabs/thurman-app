import express, { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import { 
    executeFullDepositRequest,
    createShareClaim,
    createDepositFulfillment
} from "../services/circleDeposit";
import { 
    getUserWalletId,
    getAdminWalletId
} from "../services/walletService";
import { 
    parseUSDCAmount,
    validateUSDCAmount,
    formatAddress
} from "../services/utils";
import { 
    getUserDepositStatus,
    getAllPendingDeposits
} from "../services/depositStateManager";
import db from "../utils/prismaClient";

// Import the AuthRequest interface from middleware
import { AuthRequest } from "../middleware/auth";

// Use AuthRequest type for authenticated routes
type AuthenticatedRequest = AuthRequest;

var depositsRouter: Router = express.Router();

// ============================================================================
// REQUEST VALIDATION HELPERS
// ============================================================================

/**
 * Validate deposit amount against pool limits
 * @param amount - USDC amount in human readable format
 * @param poolId - Pool ID to validate against
 * @returns Validation result with error message if invalid
 */
const validateDepositAmount = async (amount: string, poolId: number): Promise<{ valid: boolean; error?: string }> => {
    try {
        // Basic amount validation
        if (!validateUSDCAmount(amount)) {
            return { valid: false, error: "Invalid deposit amount" };
        }

        // TODO: Query pool manager contract for actual limits
        // For now, use reasonable defaults
        const minAmount = 0.01; // $0.01 minimum
        const maxAmount = 1000000; // $1M maximum

        const parsedAmount = parseFloat(amount);
        if (parsedAmount < minAmount) {
            return { valid: false, error: `Minimum deposit amount is $${minAmount}` };
        }
        if (parsedAmount > maxAmount) {
            return { valid: false, error: `Maximum deposit amount is $${maxAmount}` };
        }

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: "Failed to validate deposit amount" };
    }
};

/**
 * Validate user has sufficient USDC balance
 * @param userId - User ID from database
 * @param amount - USDC amount to validate
 * @returns Validation result with error message if insufficient
 */
const validateUserBalance = async (userId: number, amount: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        // TODO: Query Circle API for actual USDC balance
        // For now, assume sufficient balance (implement actual balance checking)
        console.log(`Validating balance for user ${userId}, amount: ${amount} USDC`);
        
        // Placeholder for actual balance validation
        // const balance = await getUSDCBalance(userId);
        // if (balance < parseFloat(amount)) {
        //     return { valid: false, error: "Insufficient USDC balance" };
        // }

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: "Failed to validate user balance" };
    }
};

/**
 * Validate pool status allows deposits
 * @param poolId - Pool ID to validate
 * @returns Validation result with error message if deposits disabled
 */
const validatePoolStatus = async (poolId: number): Promise<{ valid: boolean; error?: string }> => {
    try {
        // Check pool exists and is active
        const pool = await db.loanPool.findFirst({
            where: {
                pool_id: poolId,
                status: { in: ["POOL_CREATED", "POOL_CONFIGURED", "DEPLOYING_LOANS", "DEPLOYED"] }
            }
        });

        if (!pool) {
            return { valid: false, error: "Pool not found or not active" };
        }

        // TODO: Query pool manager contract for actual deposit settings
        // For now, assume deposits are enabled for active pools

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: "Failed to validate pool status" };
    }
};

/**
 * Validate user has sufficient claimable amount
 * @param userId - User ID from database
 * @param poolId - Pool ID
 * @param amount - Amount to claim
 * @returns Validation result with error message if insufficient
 */
const validateClaimableAmount = async (userId: number, poolId: number, amount: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        // TODO: Query pool manager contract for actual claimable amount
        // For now, assume user has sufficient claimable amount
        console.log(`Validating claimable amount for user ${userId}, pool ${poolId}, amount: ${amount} USDC`);
        
        // Placeholder for actual claimable amount validation
        // const claimableAmount = await getClaimableAmount(userId, poolId);
        // if (claimableAmount < parseFloat(amount)) {
        //     return { valid: false, error: "Insufficient claimable amount" };
        // }

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: "Failed to validate claimable amount" };
    }
};

// ============================================================================
// DEPOSIT REQUEST ENDPOINT
// ============================================================================

/**
 * POST /api/deposits/request
 * Request a deposit to a lending pool (two-step: USDC approval + deposit request)
 */
depositsRouter.post("/request", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { poolId, amount } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User authentication required"
            });
        }

        // Validate required fields
        if (!poolId || !amount) {
            return res.status(400).json({
                success: false,
                error: "Pool ID and amount are required"
            });
        }

        // Validate pool ID
        if (!Number.isInteger(poolId) || poolId < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid pool ID"
            });
        }

        // Validate amount
        const amountValidation = await validateDepositAmount(amount, poolId);
        if (!amountValidation.valid) {
            return res.status(400).json({
                success: false,
                error: amountValidation.error
            });
        }

        // Validate pool status
        const poolValidation = await validatePoolStatus(poolId);
        if (!poolValidation.valid) {
            return res.status(400).json({
                success: false,
                error: poolValidation.error
            });
        }

        // Validate user balance
        const balanceValidation = await validateUserBalance(userId, amount);
        if (!balanceValidation.valid) {
            return res.status(400).json({
                success: false,
                error: balanceValidation.error
            });
        }

        // Get user's wallet ID
        let userWalletId: string;
        try {
            userWalletId = await getUserWalletId(userId);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: "User wallet not found. Please contact support."
            });
        }

        // Get user's address from wallet
        const userWallet = await db.wallet.findUnique({
            where: { id: userWalletId }
        });

        if (!userWallet?.address) {
            return res.status(400).json({
                success: false,
                error: "User wallet address not found"
            });
        }

        // Execute full deposit request (USDC approval + deposit request)
        const result = await executeFullDepositRequest(
            poolId,
            amount,
            userWallet.address,
            userWalletId
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || "Failed to process deposit request"
            });
        }

        // Return success response with transaction IDs
        return res.status(200).json({
            success: true,
            data: {
                approvalTransactionId: result.approvalTransaction.transactionId,
                depositTransactionId: result.depositTransaction.transactionId,
                poolId,
                amount,
                userAddress: userWallet.address,
                estimatedProcessingTime: "5-10 minutes",
                status: "pending"
            }
        });

    } catch (error: any) {
        console.error("Deposit request error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ============================================================================
// SHARE CLAIM ENDPOINT
// ============================================================================

/**
 * POST /api/deposits/claim
 * Claim shares from a fulfilled deposit
 */
depositsRouter.post("/claim", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { poolId, amount } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User authentication required"
            });
        }

        // Validate required fields
        if (!poolId || !amount) {
            return res.status(400).json({
                success: false,
                error: "Pool ID and amount are required"
            });
        }

        // Validate pool ID
        if (!Number.isInteger(poolId) || poolId < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid pool ID"
            });
        }

        // Validate amount
        if (!validateUSDCAmount(amount)) {
            return res.status(400).json({
                success: false,
                error: "Invalid claim amount"
            });
        }

        // Validate claimable amount
        const claimableValidation = await validateClaimableAmount(userId, poolId, amount);
        if (!claimableValidation.valid) {
            return res.status(400).json({
                success: false,
                error: claimableValidation.error
            });
        }

        // Get user's wallet ID
        let userWalletId: string;
        try {
            userWalletId = await getUserWalletId(userId);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: "User wallet not found. Please contact support."
            });
        }

        // Get user's address from wallet
        const userWallet = await db.wallet.findUnique({
            where: { id: userWalletId }
        });

        if (!userWallet?.address) {
            return res.status(400).json({
                success: false,
                error: "User wallet address not found"
            });
        }

        // Create share claim transaction
        const result = await createShareClaim(
            poolId,
            amount,
            userWallet.address,
            userWalletId
        );

        if (result.status === "FAILED") {
            return res.status(500).json({
                success: false,
                error: result.error || "Failed to create share claim"
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            data: {
                transactionId: result.transactionId,
                poolId,
                amount,
                userAddress: userWallet.address,
                estimatedProcessingTime: "3-5 minutes",
                status: "pending"
            }
        });

    } catch (error: any) {
        console.error("Share claim error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ============================================================================
// ADMIN DEPOSIT FULFILLMENT ENDPOINT
// ============================================================================

/**
 * POST /api/admin/deposits/fulfill
 * Admin endpoint to fulfill pending deposits
 */
depositsRouter.post("/admin/fulfill", requireAuth, requireRole(["ADMIN"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { poolId, userAddress, amount } = req.body;
        const adminUserId = req.user?.id;

        if (!adminUserId) {
            return res.status(401).json({
                success: false,
                error: "Admin authentication required"
            });
        }

        // Validate required fields
        if (!poolId || !userAddress || !amount) {
            return res.status(400).json({
                success: false,
                error: "Pool ID, user address, and amount are required"
            });
        }

        // Validate pool ID
        if (!Number.isInteger(poolId) || poolId < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid pool ID"
            });
        }

        // Validate user address
        try {
            formatAddress(userAddress);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address"
            });
        }

        // Validate amount
        if (!validateUSDCAmount(amount)) {
            return res.status(400).json({
                success: false,
                error: "Invalid fulfillment amount"
            });
        }

        // Validate pool status
        const poolValidation = await validatePoolStatus(poolId);
        if (!poolValidation.valid) {
            return res.status(400).json({
                success: false,
                error: poolValidation.error
            });
        }

        // Get admin wallet ID
        let adminWalletId: string;
        try {
            adminWalletId = await getAdminWalletId();
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: "Admin wallet not configured"
            });
        }

        // Create deposit fulfillment transaction
        const result = await createDepositFulfillment(
            poolId,
            amount,
            userAddress,
            adminWalletId
        );

        if (result.status === "FAILED") {
            return res.status(500).json({
                success: false,
                error: result.error || "Failed to fulfill deposit"
            });
        }

        // Audit logging
        console.log(`ADMIN ACTION: Deposit fulfillment by admin ${adminUserId}`, {
            poolId,
            userAddress,
            amount,
            transactionId: result.transactionId,
            timestamp: new Date().toISOString()
        });

        // Return success response
        return res.status(200).json({
            success: true,
            data: {
                transactionId: result.transactionId,
                poolId,
                userAddress,
                amount,
                fulfilledBy: adminUserId,
                estimatedProcessingTime: "2-3 minutes",
                status: "pending"
            }
        });

    } catch (error: any) {
        console.error("Admin deposit fulfillment error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ============================================================================
// POLLING ENDPOINTS
// ============================================================================

/**
 * GET /api/deposits/status/:poolId/:userAddress
 * Get current deposit status for a user in a specific pool
 * No authentication required (public blockchain data)
 */
depositsRouter.get("/status/:poolId/:userAddress", async (req: Request, res: Response) => {
    try {
        const { poolId, userAddress } = req.params;

        // Validate pool ID
        const poolIdNum = parseInt(poolId, 10);
        if (isNaN(poolIdNum) || poolIdNum < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid pool ID format"
            });
        }

        // Validate user address format
        try {
            formatAddress(userAddress);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address format"
            });
        }

        // Get deposit status from in-memory state
        const depositStatus = getUserDepositStatus(poolIdNum, userAddress);

        // Generate ETag for caching
        const etag = `"${poolIdNum}-${userAddress.toLowerCase()}-${depositStatus.lastUpdated.getTime()}"`;
        
        // Check if client has cached version
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        // Set cache headers for polling optimization
        res.set({
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            'ETag': etag,
            'Last-Modified': depositStatus.lastUpdated.toUTCString()
        });

        // Return deposit status
        return res.status(200).json({
            success: true,
            data: {
                poolId: poolIdNum,
                userAddress: userAddress.toLowerCase(),
                pending: depositStatus.pending,
                claimable: depositStatus.claimable,
                claimed: depositStatus.claimed,
                lastUpdated: depositStatus.lastUpdated.toISOString(),
                hasActivity: depositStatus.pending > 0 || depositStatus.claimable > 0 || depositStatus.claimed > 0
            }
        });

    } catch (error: any) {
        console.error("Deposit status polling error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve deposit status"
        });
    }
});

/**
 * GET /api/admin/deposits/pending
 * Get all pending deposits for admin interface
 * Requires admin authentication
 */
depositsRouter.get("/admin/pending", requireAuth, requireRole(["ADMIN"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 items per page
        const offset = (page - 1) * limit;

        // Get all pending deposits from in-memory state
        const allPendingDeposits = getAllPendingDeposits();

        // Apply pagination
        const paginatedDeposits = allPendingDeposits.slice(offset, offset + limit);

        // Generate ETag for caching
        const etag = `"pending-${allPendingDeposits.length}-${allPendingDeposits[0]?.timestamp?.getTime() || 0}"`;
        
        // Check if client has cached version
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        // Set cache headers for polling optimization
        res.set({
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            'ETag': etag,
            'Last-Modified': new Date().toUTCString()
        });

        // Return paginated pending deposits
        return res.status(200).json({
            success: true,
            data: {
                deposits: paginatedDeposits.map(deposit => ({
                    id: `${deposit.poolId}-${deposit.userAddress}`,
                    poolId: deposit.poolId,
                    userAddress: deposit.userAddress,
                    amount: deposit.amount,
                    requestedAt: deposit.timestamp.toISOString(),
                    // Note: txHash is not available in current state manager
                    // Would need to be enhanced to track individual transactions
                })),
                pagination: {
                    page,
                    limit,
                    total: allPendingDeposits.length,
                    totalPages: Math.ceil(allPendingDeposits.length / limit),
                    hasNext: offset + limit < allPendingDeposits.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error: any) {
        console.error("Admin pending deposits polling error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve pending deposits"
        });
    }
});

/**
 * GET /api/deposits/user/:userAddress
 * Get all deposit activity for a specific user across all pools
 * No authentication required (public blockchain data)
 */
depositsRouter.get("/user/:userAddress", async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;

        // Validate user address format
        try {
            formatAddress(userAddress);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address format"
            });
        }

        // Get all pools from database
        const pools = await db.loanPool.findMany({
            where: {
                status: { in: ["POOL_CREATED", "POOL_CONFIGURED", "DEPLOYING_LOANS", "DEPLOYED"] }
            },
            select: {
                id: true,
                pool_id: true,
                name: true,
                status: true
            }
        });

        // Get deposit status for each pool
        const userDeposits = pools
            .filter(pool => pool.pool_id !== null) // Filter out pools without pool_id
            .map(pool => {
                const depositStatus = getUserDepositStatus(pool.pool_id!, userAddress);
                return {
                    poolId: pool.pool_id!,
                    poolName: pool.name,
                    poolStatus: pool.status,
                    pending: depositStatus.pending,
                    claimable: depositStatus.claimable,
                    claimed: depositStatus.claimed,
                    lastUpdated: depositStatus.lastUpdated.toISOString(),
                    hasActivity: depositStatus.pending > 0 || depositStatus.claimable > 0 || depositStatus.claimed > 0
                };
            }).filter(deposit => deposit.hasActivity); // Only return pools with activity

        // Generate ETag for caching
        const etag = `"user-${userAddress.toLowerCase()}-${userDeposits.length}-${userDeposits[0]?.lastUpdated || 0}"`;
        
        // Check if client has cached version
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        // Set cache headers for polling optimization
        res.set({
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            'ETag': etag,
            'Last-Modified': new Date().toUTCString()
        });

        // Calculate totals
        const totals = userDeposits.reduce((acc, deposit) => ({
            pending: acc.pending + deposit.pending,
            claimable: acc.claimable + deposit.claimable,
            claimed: acc.claimed + deposit.claimed
        }), { pending: 0, claimable: 0, claimed: 0 });

        // Return user's deposit activity
        return res.status(200).json({
            success: true,
            data: {
                userAddress: userAddress.toLowerCase(),
                deposits: userDeposits,
                totals,
                poolCount: userDeposits.length,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("User deposits polling error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve user deposits"
        });
    }
});

/**
 * GET /api/deposits/pool/:poolId
 * Get deposit statistics for a specific pool
 * No authentication required (public blockchain data)
 */
depositsRouter.get("/pool/:poolId", async (req: Request, res: Response) => {
    try {
        const { poolId } = req.params;

        // Validate pool ID
        const poolIdNum = parseInt(poolId, 10);
        if (isNaN(poolIdNum) || poolIdNum < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid pool ID format"
            });
        }

        // Check if pool exists
        const pool = await db.loanPool.findFirst({
            where: { pool_id: poolIdNum },
            select: {
                id: true,
                pool_id: true,
                name: true,
                status: true
            }
        });

        if (!pool) {
            return res.status(404).json({
                success: false,
                error: "Pool not found"
            });
        }

        // Get all deposits for this pool from in-memory state
        const allPendingDeposits = getAllPendingDeposits();
        const poolDeposits = allPendingDeposits.filter(deposit => deposit.poolId === poolIdNum);

        // Calculate pool statistics
        const totalPending = poolDeposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        const uniqueDepositors = new Set(poolDeposits.map(deposit => deposit.userAddress)).size;

        // Generate ETag for caching
        const etag = `"pool-${poolIdNum}-${poolDeposits.length}-${poolDeposits[0]?.timestamp?.getTime() || 0}"`;
        
        // Check if client has cached version
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        // Set cache headers for polling optimization
        res.set({
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            'ETag': etag,
            'Last-Modified': new Date().toUTCString()
        });

        // Return pool deposit statistics
        return res.status(200).json({
            success: true,
            data: {
                poolId: poolIdNum,
                poolName: pool.name,
                poolStatus: pool.status,
                totalPending: totalPending.toString(),
                uniqueDepositors,
                pendingDeposits: poolDeposits.length,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("Pool deposits polling error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve pool deposit statistics"
        });
    }
});

export default depositsRouter; 