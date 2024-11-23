import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { verify, sign, Secret, JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { createUser, validateUser } from "../prisma/models";
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

type LoginParams = {
    email: string;
    password: string;
};

type LoginReturnParams = {
    token: Secret;
    user: {
        id: number;
        email: string | null;
        wallets: {
            id: string | null;
            name: string | null;
            address: string;
            custodyType: string;
        }[];
    };
};

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

export const login = async ({
    email,
    password
}: LoginParams): Promise<LoginReturnParams | null> => {
    if (!email || !password) {
        console.error("Login failed: Missing email or password");
        return null;
    }

    try {
        const validationResult = await validateUser(email, password);
        if (!validationResult) {
            console.error("Login failed: Validation returned null");
            return null;
        }

        const { user, isValid } = validationResult;
        if (!isValid || !user) {
            console.error("Login failed: Invalid credentials");
            return null;
        }

        // Ensure required user data exists
        if (!user.email || !user.wallets?.[0]?.id || !user.wallets[0].address) {
            console.error("Login failed: Incomplete user data", {
                hasEmail: !!user.email,
                hasWallet: !!user.wallets?.[0],
            });
            return null;
        }

        const token = createToken(
            user.email,
            user.id,
            user.wallets[0].id,
            user.wallets[0].address
        );

        return {
            token,
            user // Return the complete user object
        };
    } catch (error) {
        console.error("Login failed:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
};