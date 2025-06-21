import express, { Router } from "express";
import { getAuthenticatedUser } from "../services/auth";
import { requireAuth, AuthRequest } from "../middleware/auth";

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
            data: {
                user
            }
        });

    } catch (err: any) {
        console.error("Get user error:", err);
        next(err); // Pass to error handler middleware
    }
});

export default userRouter;