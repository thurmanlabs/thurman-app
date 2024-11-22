import express, { Router } from "express";
import { Secret } from "jsonwebtoken";
import {
    signup,
    SignupParams,
    SignupReturnParams,
    AUTH_TOKEN_COOKIE
} from "../services/auth";
import { config } from "../config";

var authRouter: Router = express.Router();

const dayMs = 24 * 60 * 60 * 1000;
const tokenLengthMs = 1 * dayMs;

function setAuthCookie(res: express.Response, token: Secret | undefined) {
    res.cookie(AUTH_TOKEN_COOKIE, token, {
        expires: new Date(Date.now() + tokenLengthMs),
        secure: false,
        httpOnly: true
    });
}

authRouter.post("/signup", async (req: express.Request, res: express.Response) => {
    const { email, password, accountType, blockchains } = req.body;

    if (!email || !password || !accountType || !blockchains) {
        return res.status(400).json({ 
            errorMessage: "Missing required fields" 
        });
    }

    try {
        const userSignup = await signup({
            email,
            password,
            accountType,
            blockchains: [blockchains],
            walletSetId: "0190af6f-db3c-71c1-9ff3-824e4bab0448"
        });

        if (!userSignup) {
            return res.status(400).json({ 
                errorMessage: "Unable to create new user" 
            });
        }

        const { userId, email: userEmail, walletId, address, token } = userSignup;
        
        setAuthCookie(res, token);
        
        return res.status(201).json({
            userId,
            email: userEmail,
            walletId,
            address,
            token
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({
            errorMessage: err instanceof Error ? err.message : "Internal server error"
        });
    }
});