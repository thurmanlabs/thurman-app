import { User, Prisma, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import db from "../../utils/prismaClient";

const SALT_ROUNDS = 10;

type ValidatedUserData = {
    id: number;
    email: string | null;
    role: UserRole;
    status: UserStatus;
    wallets: {
        id: string | null;
        custodyType: string;
        address: string;
        name: string | null;
        blockchains: {
            chainId: string;
            name: string;
        }[];
    }[];
};

type ValidationResult = {
    user: ValidatedUserData | null;
    isValid: boolean;
};

export async function createUser(email: string, password: string): Promise<User> {
    let encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    try {
        const user = await db.user.create({
            data: {
                email: email,
                password: encryptedPassword
            },
        });
        return user;
    } catch (err: any) {

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new Error(`A user with email ${email} already exists.`);
        }

        throw err;
    }
}

export async function validateUser(userEmail: string, password: string): Promise<ValidationResult> {
    if (!userEmail || !password) {
        throw new Error("Email and password are required");
    }

    try {
        const user = await db.user.findUnique({
            where: {
                email: userEmail
            },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                status: true,
                wallets: {
                    select: {
                        id: true,
                        custodyType: true,
                        address: true,
                        name: true,
                        blockchains: {
                            select: {
                                chainId: true,
                                name: true,
                            }
                        }
                    }
                },
            }
        });

        if (!user || !user.password) {
            return {
                user: null,
                isValid: false
            };
        }

        const isValid = await bcrypt.compare(password, user.password);

        // Don't include password in the returned user object
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: isValid ? userWithoutPassword : null,
            isValid
        };
    } catch (err) {
        console.error("User validation error:", err);
        throw new Error(
            err instanceof Error
                ? `Failed to validate user: ${err.message}`
                : "Failed to validate user"
        );
    }
}

export async function getUser(userEmail: string): Promise<ValidatedUserData | null> {
    try {
        const user = await db.user.findUnique({
            where: {
                email: userEmail
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                wallets: {
                    select: {
                        id: true,
                        custodyType: true,
                        address: true,
                        name: true,
                        blockchains: {
                            select: {
                                chainId: true,
                                name: true,
                            }
                        }
                    }
                },
            }
        });

        if (!user) {
            return null;
        }

        return user;
    } catch (err: any) {
        throw err;
    }
}