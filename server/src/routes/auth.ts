import express, { Router, NextFunction } from "express";
import { Secret } from "jsonwebtoken";
import {
    signup,
    SignupParams,
    AUTH_TOKEN_COOKIE,
    login
} from "../services/auth";
import { config } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";

var authRouter: Router = express.Router();

const dayMs = 24 * 60 * 60 * 1000;
const tokenLengthMs = 1 * dayMs;

function setAuthCookie(res: express.Response, token: Secret | undefined) {
    res.cookie(AUTH_TOKEN_COOKIE, token, {
        expires: new Date(Date.now() + tokenLengthMs),
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict"
    });
}

function clearAuthCookie(res: express.Response) {
    res.clearCookie(AUTH_TOKEN_COOKIE, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict"
    });
}

authRouter.post("/signup", async (req: express.Request, res: express.Response, next: NextFunction) => {
    const { email, password, accountType, blockchains } = req.body;

    if (!email || !password || !accountType || !blockchains) {
        return res.status(400).json({ 
            success: false,
            error: "Missing required fields",
            message: "Email, password, account type, and blockchains are required"
        });
    }

    try {
        const userSignup = await signup({
            email,
            password,
            accountType,
            blockchains: blockchains,
            walletSetId: "0190af6f-db3c-71c1-9ff3-824e4bab0448"
        });

        if (!userSignup) {
            return res.status(400).json({ 
                success: false,
                error: "Signup failed",
                message: "Unable to create new user. Please try again."
            });
        }

        const { token, user } = userSignup;       
        setAuthCookie(res, token);
        
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user
        });
    } catch (err) {
        console.error("Signup error:", err);
        next(err);
    }
});

authRouter.post("/login", async (req: express.Request, res: express.Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields",
            message: "Email and password are required"
        });
    }

    try {
        const loginResult = await login({ email, password });
        if (!loginResult) {
            return res.status(401).json({
                success: false,
                error: "Authentication failed",
                message: "Invalid email or password"
            });
        }
        
        const { token, user } = loginResult;
        if (token && user) {
            setAuthCookie(res, token);
            return res.status(200).json({
                success: true,
                message: "Login successful",
                user
            });
        }
        
        return res.status(500).json({
            success: false,
            error: "Login failed",
            message: "Unable to complete login process"
        });
    } catch (error) {
        console.error("Login error:", error);
        next(error);
    }
});

authRouter.post("/logout", async (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        clearAuthCookie(res);
        return res.status(200).json({
            success: true,
            message: "Successfully logged out"
        });
    } catch (error) {
        console.error("Logout error: ", error);
        next(error);
    }
});

export default authRouter;