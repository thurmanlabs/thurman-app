import { Wallet, BlockchainAccess } from "@prisma/client";
import db from "../../utils/prismaClient";

type CreateWalletParams = {
    id?: string;
    address: string;
    custodyType: string;
    accountType: string;
    name?: string;
    userId?: number;
    blockchains: BlockchainAccess[];
}

export async function createWallet({
    id,
    address,
    custodyType,
    accountType,
    name,
    userId,
    blockchains
}: CreateWalletParams): Promise<Wallet | null> {
    try {
        const wallet = db.wallet.create({
            data: {
                id: id,
                address: address,
                custodyType: custodyType,
                accountType: accountType,
                name: name,
                userId: userId,
                blockchains: {
                    create: blockchains
                }
            }
        });
        return wallet;
    } catch (err: unknown) {
        console.error(err);
        return null;
    }
}