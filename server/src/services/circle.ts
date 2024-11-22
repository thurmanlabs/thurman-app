import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import { v4 as uuidv4 } from "uuid";

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

export const createDeveloperWallet = async ({
    accountType,
    blockchains,
    name,
    refId,
    walletSetId
}: CreateWalletParams): Promise<CreateWalletReturnParams | null> => {
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
            accountType: "EOA",
            name: wallet.data?.wallets[0].name,
            userId: wallet.data?.wallets[0].refId ? parseInt(wallet.data?.wallets[0].refId) : undefined,
            blockchains: [
                { chainId: "137", name: "MATIC", walletId: walletId ?? "" }, 
                { chainId: "80002", name: "MATIC-AMOY", walletId: walletId ?? "" }
            ]
        });

        return {
            walletId: walletRecord?.id,
            address: walletRecord?.address
        };
    } catch (e: any) {
        console.error(e);
        return null;
    }
}