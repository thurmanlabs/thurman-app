import express, { Router, NextFunction } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import db from "../utils/prismaClient";
import { 
    createPoolFromCSV, 
    approveAndDeploy,
    retryPoolCreation,
    retryPoolConfiguration,
    retryLoanDeployment
} from "../services/loanPool";
import { generateFilePreview } from "../services/csvProcessor";
import { 
    findUserPools, 
    findPendingPools, 
    findActivePools,
    rejectLoanPool 
} from "../prisma/models";
import { 
    createUploadMiddleware, 
    extractFormData 
} from "../services/upload";
import { 
    handleMulterError, 
    validateUploadedFile 
} from "../middleware/upload";
import { 
    getDeployedPools, 
    getPoolById, 
    getCacheStatus,
    PoolData,
    PoolDataResponse 
} from "../services/poolData";

var loanPoolsRouter: Router = express.Router();

// Create upload middleware for loan data files
const uploadLoanDataFile = createUploadMiddleware('loanDataFile');

// POST /api/loan-pools - Create pool with CSV upload
loanPoolsRouter.post("/", 
    requireAuth, 
    uploadLoanDataFile,
    handleMulterError,
    async (req: AuthRequest, res: express.Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "User not authenticated"
                });
            }

            const file = req.file;
            
            // Validate uploaded file using service
            const fileValidation = validateUploadedFile(file);
            if (!fileValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: "File validation failed",
                    message: fileValidation.error
                });
            }

            // At this point, file is guaranteed to be defined due to validation
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: "File validation failed",
                    message: "No file provided"
                });
            }

            // Extract form data using service
            const formData = extractFormData(req.body, file);

            // Use service for complete workflow
            const result = await createPoolFromCSV(formData, file, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: "Pool creation failed",
                    message: result.error
                });
            }

            return res.status(201).json({
                success: true,
                message: "Loan pool created successfully",
                data: {
                    poolId: result.poolId,
                    metrics: result.metrics
                }
            });

        } catch (err: any) {
            console.error("Create loan pool error:", err);
            next(err);
        }
    }
);

// GET /api/loan-pools - Get deployed pools (refactored to use Circle SDK)
loanPoolsRouter.get("/", async (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        console.log("GET /api/loan-pools - Fetching deployed pools via Circle SDK");

        // Get pool data from Circle SDK (with caching)
        const poolData: PoolDataResponse = await getDeployedPools();
        
        // Get cache status for metadata
        const cacheStatus = getCacheStatus();

        // Set caching headers (5 minutes)
        res.set({
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
            "Last-Modified": poolData.lastUpdated.toUTCString(),
            "ETag": `"pools-${poolData.pools.length}-${poolData.lastUpdated.getTime()}"`
        });

        // Return successful response with Circle SDK data
        return res.status(200).json({
            success: true,
            message: "Deployed pools retrieved successfully",
            data: {
                pools: poolData.pools,
                metadata: {
                    totalPools: poolData.totalPools,
                    successfullyLoaded: poolData.successfullyLoaded,
                    failedToLoad: poolData.failedToLoad,
                    lastUpdated: poolData.lastUpdated,
                    cached: poolData.cached,
                    cacheAge: cacheStatus.age,
                    timestamp: new Date().toISOString()
                }
            }
        });

    } catch (error: any) {
        console.error("Error fetching deployed pools:", error);

        // Fallback to database pools if Circle SDK fails
        try {
            console.log("Circle SDK failed, falling back to database pools");
            const activePools = await findActivePools();
            
            return res.status(200).json({
                success: true,
                message: "Active pools retrieved successfully (fallback)",
                data: {
                    pools: activePools,
                    metadata: {
                        source: "database",
                        fallback: true,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (fallbackError: any) {
            console.error("Database fallback also failed:", fallbackError);
            next(fallbackError);
        }
    }
});

// GET /api/loan-pools/drafts - User's pending pools
loanPoolsRouter.get("/drafts", requireAuth, async (req: AuthRequest, res: express.Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "User not authenticated"
            });
        }

        const userPools = await findUserPools(userId);

        return res.status(200).json({
            success: true,
            message: "User pools retrieved successfully",
            data: userPools
        });

    } catch (err: any) {
        console.error("Get user pools error:", err);
        next(err);
    }
});

// PATCH /api/loan-pools/:id/approve - Admin approval
loanPoolsRouter.patch("/:id/approve", 
    requireAuth, 
    requireRole([UserRole.ADMIN]),
    async (req: AuthRequest, res: express.Response, next: NextFunction) => {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "Admin not authenticated"
                });
            }

            const poolId = parseInt(req.params.id);
            if (isNaN(poolId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid pool ID",
                    message: "Pool ID must be a valid number"
                });
            }

            // Get the user's wallet from the database
            const userWithWallet = await db.user.findUnique({
                where: { id: adminId },
                include: { wallets: true }
            });

            if (!userWithWallet || userWithWallet.wallets.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "No wallet found",
                    message: "Admin must have a Circle wallet configured to approve pools"
                });
            }

            // Use the first wallet (assuming one wallet per user for now)
            const walletId = userWithWallet.wallets[0].id;
            if (!walletId) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid wallet",
                    message: "Admin wallet is not properly configured"
                });
            }

            // Use service for approval and deployment workflow
            const result = await approveAndDeploy(poolId, adminId, walletId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: "Approval failed",
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                message: "Loan pool approved and deployment initiated",
                data: {
                    transactionId: result.transactionId,
                    status: result.status
                }
            });

        } catch (err: any) {
            console.error("Approve loan pool error:", err);
            next(err);
        }
    }
);

// PATCH /api/loan-pools/:id/reject - Admin rejection
loanPoolsRouter.patch("/:id/reject", 
    requireAuth, 
    requireRole([UserRole.ADMIN]),
    async (req: AuthRequest, res: express.Response, next: NextFunction) => {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "Admin not authenticated"
                });
            }

            const poolId = parseInt(req.params.id);
            if (isNaN(poolId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid pool ID",
                    message: "Pool ID must be a valid number"
                });
            }

            const { reason } = req.body;
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Missing rejection reason",
                    message: "Rejection reason is required"
                });
            }

            // Use model function for simple rejection
            const rejectedPool = await rejectLoanPool(poolId, adminId, reason);

            if (!rejectedPool) {
                return res.status(404).json({
                    success: false,
                    error: "Pool not found",
                    message: "Loan pool not found or could not be rejected"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Loan pool rejected successfully",
                data: rejectedPool
            });

        } catch (err: any) {
            console.error("Reject loan pool error:", err);
            next(err);
        }
    }
);

// GET /api/admin/pending-approvals - Admin dashboard data
loanPoolsRouter.get("/admin/pending-approvals", 
    requireAuth, 
    requireRole([UserRole.ADMIN]),
    async (req: AuthRequest, res: express.Response, next: NextFunction) => {
        try {
            const pendingPools = await findPendingPools();

            return res.status(200).json({
                success: true,
                message: "Pending approvals retrieved successfully",
                data: pendingPools
            });

        } catch (err: any) {
            console.error("Get pending approvals error:", err);
            next(err);
        }
    }
);

// POST /api/loan-pools/preview - File preview endpoint
loanPoolsRouter.post("/preview", 
    uploadLoanDataFile,
    handleMulterError,
    async (req: express.Request, res: express.Response, next: NextFunction) => {
        try {
            const file = req.file;
            
            // Validate uploaded file using service
            const fileValidation = validateUploadedFile(file);
            if (!fileValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: "File validation failed",
                    message: fileValidation.error
                });
            }

            // At this point, file is guaranteed to be defined due to validation
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: "File validation failed",
                    message: "No file provided"
                });
            }

            // Generate file preview using CSV processor
            const previewResult = await generateFilePreview(file.buffer, file.originalname);

            // Validate required columns
            const requiredColumns = [
                'borrower_address',
                'originator_address',
                'retention_rate',
                'principal',
                'term_months',
                'interest_rate'
            ];
            
            const missingColumns = requiredColumns.filter(col => !previewResult.headers.includes(col));
            if (missingColumns.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required columns",
                    message: `Missing required columns: ${missingColumns.join(', ')}`
                });
            }

            // Calculate preview statistics
            const totalLoans = previewResult.rowCount;
            const previewRows = previewResult.previewRows;
            
            // Calculate totals from preview data (first 5 rows)
            let totalAmount = 0;
            let totalInterestRate = 0;
            let totalTerm = 0;
            let validRows = 0;

            previewRows.forEach((row: any, index: number) => {
                if (row.principal && !isNaN(Number(row.principal))) {
                    totalAmount += Number(row.principal);
                    validRows++;
                }
                if (row.interest_rate && !isNaN(Number(row.interest_rate))) {
                    totalInterestRate += Number(row.interest_rate);
                }
                if (row.term_months && !isNaN(Number(row.term_months))) {
                    totalTerm += Number(row.term_months);
                }
            });

            const avgLoanSize = validRows > 0 ? totalAmount / validRows : 0;
            const avgInterestRate = validRows > 0 ? totalInterestRate / validRows : 0;
            const avgTerm = validRows > 0 ? totalTerm / validRows : 0;

            return res.status(200).json({
                success: true,
                message: "File preview generated successfully",
                data: {
                    totalLoans,
                    totalAmount,
                    avgLoanSize,
                    avgInterestRate,
                    avgTerm,
                    detectedColumns: previewResult.headers
                }
            });

        } catch (err: any) {
            console.error("File preview error:", err);
            
            // Return specific error message
            return res.status(400).json({
                success: false,
                error: "File preview failed",
                message: err.message || "Failed to process file preview"
            });
        }
    }
);

// POST /api/loan-pools/:id/retry-step - Retry specific deployment step
loanPoolsRouter.post("/:id/retry-step", 
    requireAuth, 
    requireRole([UserRole.ADMIN]),
    async (req: AuthRequest, res: express.Response, next: NextFunction) => {
        try {
            const adminId = req.user?.id;
            const poolId = parseInt(req.params.id);
            const { step } = req.body;

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "User not authenticated"
                });
            }

            if (!poolId || isNaN(poolId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid pool ID",
                    message: "Pool ID must be a valid number"
                });
            }

            if (!step) {
                return res.status(400).json({
                    success: false,
                    error: "Missing step parameter",
                    message: "Step parameter is required"
                });
            }

            // Get user's wallet
            const userWithWallet = await db.user.findUnique({
                where: { id: adminId },
                include: { wallets: true }
            });

            if (!userWithWallet || userWithWallet.wallets.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "No wallet found",
                    message: "Admin must have a Circle wallet configured to retry deployment"
                });
            }

            const walletId = userWithWallet.wallets[0].id;
            if (!walletId) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid wallet",
                    message: "Admin wallet is not properly configured"
                });
            }

            let result;
            switch (step) {
                case 'pool_creation':
                    result = await retryPoolCreation(poolId, adminId, walletId);
                    break;
                case 'pool_config':
                    result = await retryPoolConfiguration(poolId, adminId, walletId);
                    break;
                case 'loan_deployment':
                    result = await retryLoanDeployment(poolId, adminId, walletId);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: "Invalid step",
                        message: "Step must be one of: pool_creation, pool_config, loan_deployment"
                    });
            }

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: `Successfully retried ${step}`,
                    data: {
                        transactionId: result.transactionId,
                        status: result.status
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: "Retry failed",
                    message: result.error
                });
            }

        } catch (err: any) {
            console.error("Retry step error:", err);
            next(err);
        }
    }
);

// ============================================================================
// POOL DATA API ENDPOINTS (Circle SDK Integration)
// ============================================================================

/**
 * GET /api/loan-pools/pools - Alias for main pools endpoint
 * Redirects to main route for backward compatibility
 */
loanPoolsRouter.get("/pools", async (req: express.Request, res: express.Response) => {
    // Redirect to main endpoint to avoid duplication
    return res.redirect(301, "/api/loan-pools");
});

/**
 * GET /api/loan-pools/pools/:id - Get specific pool by ID  
 * Returns single pool data with validation
 */
loanPoolsRouter.get("/pools/:id", async (req: express.Request, res: express.Response) => {
    try {
        const poolIdParam = req.params.id;
        
        console.log(`GET /pools/${poolIdParam} - Fetching pool data`);

        // Validate pool ID parameter
        if (!poolIdParam) {
            return res.status(400).json({
                success: false,
                error: "Missing Pool ID",
                message: "Pool ID parameter is required"
            });
        }

        // Parse and validate pool ID
        const poolId = parseInt(poolIdParam, 10);
        
        if (isNaN(poolId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid Pool ID Format",
                message: "Pool ID must be a valid integer"
            });
        }

        if (poolId < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid Pool ID",
                message: "Pool ID must be non-negative"
            });
        }

        // Get pool data from Circle SDK
        const poolData: PoolData | null = await getPoolById(poolId);

        if (!poolData) {
            return res.status(404).json({
                success: false,
                error: "Pool Not Found",
                message: `Pool with ID ${poolId} does not exist or failed to load`
            });
        }

        // Get cache status for metadata
        const cacheStatus = getCacheStatus();

        // Set caching headers (5 minutes)
        res.set({
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
            "Last-Modified": poolData.lastUpdated.toUTCString(),
            "ETag": `"pool-${poolId}-${poolData.lastUpdated.getTime()}"`
        });

        // Return successful response
        return res.status(200).json({
            success: true,
            data: {
                pool: poolData,
                metadata: {
                    poolId,
                    lastUpdated: poolData.lastUpdated,
                    cached: cacheStatus.cached,
                    cacheAge: cacheStatus.age,
                    timestamp: new Date().toISOString()
                }
            }
        });

    } catch (error: any) {
        console.error(`Error fetching pool ${req.params.id}:`, error);

        // Handle specific Circle SDK errors
        if (error.message?.includes("POOL_MANAGER_CONTRACT_ADDRESS")) {
            return res.status(500).json({
                success: false,
                error: "Configuration Error",
                message: "Pool manager contract not configured"
            });
        }

        // Generic error handling
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Failed to fetch pool data",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

/**
 * GET /api/loan-pools/pools/cache/status - Get cache status information
 * Returns cache metadata for debugging/monitoring
 */
loanPoolsRouter.get("/pools/cache/status", (req: express.Request, res: express.Response) => {
    try {
        const cacheStatus = getCacheStatus();
        
        return res.status(200).json({
            success: true,
            data: {
                cache: {
                    cached: cacheStatus.cached,
                    ageMs: cacheStatus.age,
                    ageHuman: `${Math.round(cacheStatus.age / 1000)}s`,
                    poolCount: cacheStatus.poolCount,
                    lastUpdated: cacheStatus.lastUpdated,
                    maxAge: "300s (5 minutes)"
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("Error getting cache status:", error);
        
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Failed to get cache status"
        });
    }
});

export default loanPoolsRouter; 