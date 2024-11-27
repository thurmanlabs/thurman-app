import express, { Router } from "express";
import { getAuthenticatedUser } from "../services/auth";

var userRouter: Router = express.Router();

userRouter.get("/", async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { email } = req.body;
    
    try {
        const user = getAuthenticatedUser(email);

        if (!user) {
            return res.status(400).json({
                errorMessage: "Invalid user email"
            });
        }

        return res.status(200).send({
            user
        });

    } catch (err: any) {
        console.error("Get user error:", err);
        return res.status(500).json({
            errorMessage: "Internal server error"
        });
    }
    console.log("Hi");
})

export default userRouter;