import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { verify, sign, Secret, JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { createUser } from "../prisma/models";
import { createDeveloperWallet } from "./circle";

export const AUTH_TOKEN_COOKIE = "thurmanlabs";

export type SignupParams = {
    email: string;
    password: string;
    accountType: AccountType
    blockchains: Blockchain[];
    walletSetId: string;
};

export type SignupReturnParams = {
    userId: number;
    email: string;
    walletId: string | null | undefined;
    address: string | undefined;
    token: Secret;
}

type CreateTokenParams = {
    email: string;
    userId: number;
    walletId: string | null | undefined;
    address: string | undefined;
}

export const createToken = (
    email: string,
    userId: number,
    walletId: string | null | undefined,
    address: string | undefined
): Secret => {
    return sign({ email, userId, walletId, address }, config.jwtSecretKey, { expiresIn: "1d" });
}

export const signup = async ({
    email,
    password,
    accountType,
    blockchains,
    walletSetId
}: SignupParams): Promise<SignupReturnParams | null> => {
    try {
        const user = await createUser(email, password);
        
        if (!user.email || !user.id) {
            console.error("User created without email or id");
            return null;
        }

        const wallet = await createDeveloperWallet({
            accountType,
            blockchains,
            name: user.email,
            refId: user.id.toString(),
            walletSetId
        });

        if (!wallet) {
            console.error("Failed to create wallet");
            return null;
        }

        const { walletId, address } = wallet;
        const token = createToken(user.email, user.id, walletId, address);

        return {
            userId: user.id,
            email: user.email,
            walletId,
            address,
            token
        };

    } catch (error) {
        console.error("Signup failed: ", error);
        return null;
    }
};