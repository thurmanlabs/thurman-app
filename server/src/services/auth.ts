import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { verify, sign, Secret, JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { createUser, validateUser, getUser } from "../prisma/models";
import { createDeveloperWallet } from "./circle";
import { UserRole, UserStatus } from "@prisma/client";

export const AUTH_TOKEN_COOKIE = "thurmanlabs";
const POLYGON_MAINNET_ID = "137";

interface UserResponse {
    id: number;
    email: string;
    account: string;
    walletName: string | null;
    custodyType: string;
    chainId: number;
    accountType: string;
    role: UserRole;
    status: UserStatus;
}

export type SignupParams = {
    email: string;
    password: string;
    accountType: AccountType
    blockchains: Blockchain[];
    walletSetId: string;
};

interface SignupReturnParams {
    token: Secret;
    user: UserResponse;
}

interface LoginReturnParams {
    token: Secret;
    user: UserResponse;
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

const mapToUserResponse = (
    user: { id: number; email: string | null; role: UserRole; status: UserStatus },
    wallet: {
        id?: string | null;
        address: string;
        name?: string | null;
        custodyType?: string;
        accountType?: string;
        blockchains?: { chainId: string; name?: string }[];
    }
): UserResponse => {
    
    return {
        id: user.id,
        email: user.email || "",
        account: wallet.address,
        walletName: wallet.name || null,
        custodyType: wallet.custodyType || "EOA",
        chainId: Number(wallet.blockchains?.[0]?.chainId || POLYGON_MAINNET_ID),
        accountType: wallet.accountType || "EOA",
        role: user.role,
        status: user.status
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

        const { id, address } = wallet;
        const token = createToken(user.email, user.id, id, address);
        const userResponse = mapToUserResponse(user, wallet);

        return {
            token,
            user: userResponse
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

        let wallet = user.wallets[0];

        const userResponse = mapToUserResponse({id: user.id, email: user.email, role: user.role, status: user.status}, user.wallets[0])

        return {
            token,
            user: userResponse
        };
    } catch (err) {
        console.error("Login failed:", err instanceof Error ? err.message : "Unknown error");
        return null;
    }
};

export const getAuthenticatedUser = async (userEmail: string): Promise<UserResponse | null> => {
    try {
        const user = await getUser(userEmail);

        if (!user) {
            console.error("Get user failed: Invalid email");
            return null;
        }

        const userResponse = mapToUserResponse({ id: user.id, email: user.email, role: user.role, status: user.status }, user.wallets[0]);

        return userResponse;
    } catch (err) {
        console.error("Get user failed: ", err instanceof Error ? err.message  : "Unknown error");
        return null;
    }
}