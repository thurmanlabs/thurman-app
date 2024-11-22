import { User, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import db from "../../utils/prismaClient";

const SALT_ROUNDS = 10;

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