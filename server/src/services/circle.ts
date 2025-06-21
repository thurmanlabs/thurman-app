import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";

type CreateWalletParams = {
    accountType: AccountType | undefined;
    blockchains: Blockchain[];
    name: string;
    refId: string;
    walletSetId: string;
}

type CreateWalletReturnParams = {
    walletId: string | null | undefined;
    address: string | undefined;
}

const formatBlockchainData = (walletId: string | undefined, blockchains: Blockchain[]): { chainId: string, name: string }[] => {
    return blockchains.map(blockchain => ({
        chainId: blockchain.toString() === "MATIC" ? "137" : 
                blockchain.toString() === "MATIC-AMOY" ? "80002" : 
                blockchain.toString() === "ETH-SEPOLIA" ? "11155111" : 
                blockchain.toString() === "ETH" ? "1" : 
                blockchain.toString() === "AVAX" ? "43114" : 
                blockchain.toString() === "AVAX-FUJI" ? "43113" : 
                blockchain.toString() === "ARB" ? "42161" : 
                blockchain.toString() === "ARB-SEPOLIA" ? "421614" : 
                blockchain.toString() === "BASE" ? "8453" : 
                blockchain.toString() === "BASE-SEPOLIA" ? "84532" : "",
        name: blockchain.toString()
    }));
};

export const createDeveloperWallet = async ({
    accountType,
    blockchains,
    name,
    refId,
    walletSetId
}: CreateWalletParams): Promise<Wallet | null> => {
    const idempotencyKey = uuidv4();

    try {
        let wallet = await circleClient.createWallets({
            idempotencyKey: idempotencyKey,
            accountType: accountType,
            blockchains: blockchains,
            metadata: [{ name: name, refId: refId }],
            count: 1,
            walletSetId: walletSetId,
        })

        let walletId = wallet.data?.wallets[0].id;

        const walletRecord = await createWallet({
            id: walletId,
            address: wallet.data?.wallets[0].address ? wallet.data?.wallets[0].address : "",
            custodyType: wallet.data?.wallets[0].custodyType ? wallet.data?.wallets[0].custodyType : "EOA",
            accountType: "SCA",
            name: wallet.data?.wallets[0].name,
            userId: wallet.data?.wallets[0].refId ? parseInt(wallet.data?.wallets[0].refId) : undefined,
            blockchains: formatBlockchainData(walletId, blockchains)
        });

        return walletRecord;
    } catch (e: any) {
        console.error(e);
        return null;
    }
}