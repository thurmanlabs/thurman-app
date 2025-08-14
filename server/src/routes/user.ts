import express, { Router } from "express";
import { getAuthenticatedUser } from "../services/auth";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getUserPortfolio, isValidUserAddress } from "../services/portfolioService";
import { getUserWalletId, getUSDCBalance } from "../services/walletService";

var userRouter: Router = express.Router();

// GET /api/user/me - Get current authenticated user data
userRouter.get("/me", requireAuth, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
        // req.user is set by the requireAuth middleware
        const userEmail = req.user?.email;
        
        if (!userEmail) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "User email not found in token"
            });
        }

        const user = await getAuthenticatedUser(userEmail);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User not found in database"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User data retrieved successfully",
            user
        });

    } catch (err: any) {
        console.error("Get user error:", err);
        next(err); // Pass to error handler middleware
    }
});

/**
 * GET /api/user/portfolio/:userAddress
 * Get user's complete portfolio data
 * Requires authentication - user can only access own portfolio
 */
userRouter.get("/portfolio/:userAddress", requireAuth, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
        const { userAddress } = req.params;
        const authenticatedUser = req.user;

        // Validate user address format
        if (!isValidUserAddress(userAddress)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user address format"
            });
        }

        // Ensure user can only access their own portfolio
        // Get the first wallet address from user's wallets
        const userWalletAddress = authenticatedUser?.wallets?.[0]?.address;
        
        if (!userWalletAddress || userWalletAddress.toLowerCase() !== userAddress.toLowerCase()) {
            console.warn(`Unauthorized portfolio access attempt: ${userWalletAddress || 'unknown'} tried to access ${userAddress}`);
            return res.status(403).json({
                success: false,
                message: "You can only access your own portfolio"
            });
        }

        console.info(`Portfolio request for user: ${userAddress}`);

        // Get portfolio data
        const portfolio = await getUserPortfolio(userAddress);

        res.json({
            success: true,
            data: portfolio,
            message: "Portfolio data retrieved successfully"
        });

    } catch (error: any) {
        console.error("Error getting portfolio:", error);
        
        res.status(500).json({
            success: false,
            message: "Failed to get portfolio data",
            error: error.message
        });
    }
});

/**
 * GET /api/user/balance
 * Get current user's USDC balance
 * Requires authentication
 */
userRouter.get("/balance", requireAuth, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "User ID not found in token"
            });
        }

        // Get user's wallet ID
        const userWalletId = await getUserWalletId(userId);
        
        // Get USDC balance
        const balance = await getUSDCBalance(userWalletId);
        
        return res.status(200).json({
            success: true,
            data: {
                balance: parseFloat(balance),
                currency: "USDC",
                lastUpdated: new Date().toISOString()
            },
            message: "Balance retrieved successfully"
        });

    } catch (error: any) {
        console.error("Get balance error:", error);
        
        return res.status(500).json({
            success: false,
            error: "Failed to get balance",
            message: error.message
        });
    }
});

export default userRouter;