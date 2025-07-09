import express, { Router, NextFunction } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { 
    createPoolFromCSV, 
    approveAndDeploy 
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

// GET /api/loan-pools - List active pools (public endpoint)
loanPoolsRouter.get("/", async (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        const activePools = await findActivePools();
        
        return res.status(200).json({
            success: true,
            message: "Active pools retrieved successfully",
            data: activePools
        });

    } catch (err: any) {
        console.error("Get active pools error:", err);
        next(err);
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

            const { walletId } = req.body;
            if (!walletId) {
                return res.status(400).json({
                    success: false,
                    error: "Missing wallet ID",
                    message: "Wallet ID is required for approval"
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

            // Calculate preview statistics
            const totalLoans = previewResult.rowCount;
            const previewRows = previewResult.previewRows;
            
            // Calculate totals from preview data (first 5 rows)
            let totalAmount = 0;
            let totalInterestRate = 0;
            let totalTerm = 0;
            let validRows = 0;

            previewRows.forEach((row: any) => {
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

export default loanPoolsRouter; 