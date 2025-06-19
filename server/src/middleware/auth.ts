import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { getUser } from "../prisma/models";
import { UserRole } from "@prisma/client";

// Extend Express Request interface to include user property
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string | null;
        role: UserRole;
        status: string;
        wallets: {
            id: string | null;
            custodyType: string;
            address: string;
            name: string | null;
            blockchains: {
                chainId: string;
            }[];
        }[];
    };
}

// JWT payload interface
interface JWTPayload {
    email: string;
    iat: number;
    exp: number;
}

/**
 * Middleware to require authentication
 * Extracts JWT from cookies or Authorization header
 * Verifies token and attaches user to req.user
 */
export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Extract token from cookie or Authorization header
        let token: string | undefined;
        
        // Check for token in cookie first
        if (req.cookies && req.cookies.thurmanlabs) {
            token = req.cookies.thurmanlabs;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.substring(7);
        }

        if (!token) {
            res.status(401).json({ 
                error: "Authentication required",
                message: "No authentication token provided"
            });
            return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecretKey) as JWTPayload;
        
        if (!decoded.email) {
            res.status(401).json({ 
                error: "Invalid token",
                message: "Token payload is missing email"
            });
            return;
        }

        // Get user from database
        const user = await getUser(decoded.email);
        
        if (!user) {
            res.status(401).json({ 
                error: "User not found",
                message: "User associated with token no longer exists"
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ 
                error: "Invalid token",
                message: "Token verification failed"
            });
            return;
        }
        
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ 
                error: "Token expired",
                message: "Authentication token has expired"
            });
            return;
        }

        console.error("Authentication middleware error:", error);
        res.status(500).json({ 
            error: "Internal server error",
            message: "Authentication processing failed"
        });
    }
};

/**
 * Middleware to require specific roles
 * Takes array of allowed roles and checks if user has sufficient permissions
 */
export const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            // Ensure user is authenticated first
            if (!req.user) {
                res.status(401).json({ 
                    error: "Authentication required",
                    message: "User must be authenticated to check role permissions"
                });
                return;
            }

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({ 
                    error: "Insufficient permissions",
                    message: `Access denied. Required roles: ${allowedRoles.join(", ")}. User role: ${req.user.role}`
                });
                return;
            }

            next();
            
        } catch (error) {
            console.error("Role verification middleware error:", error);
            res.status(500).json({ 
                error: "Internal server error",
                message: "Role verification processing failed"
            });
        }
    };
};

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Convenience middleware for any authenticated user
 */
export const requireUser = requireRole([UserRole.USER, UserRole.ADMIN]); 