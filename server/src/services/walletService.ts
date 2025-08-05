import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import db from "../utils/prismaClient";

// ============================================================================
// WALLET MANAGEMENT TYPES
// ============================================================================

type CreateWalletParams = {
    accountType: AccountType | undefined;
    blockchains: Blockchain[];
    name: string;
    refId: string;
    walletSetId: string;
}

// ============================================================================
// WALLET CREATION AND MANAGEMENT
// ============================================================================

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

/**
 * Create a new Circle developer wallet
 * @param params - Wallet creation parameters
 * @returns Created wallet or null if failed
 */
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

/**
 * Get user's Circle wallet ID from database
 * @param userId - User ID from database
 * @returns Circle wallet ID
 */
export const getUserWalletId = async (userId: number): Promise<string> => {
    try {
        const wallet = await db.wallet.findFirst({
            where: {
                userId: userId,
                accountType: "SCA" // Smart Contract Account
            }
        });
        
        if (!wallet || !wallet.id) {
            throw new Error(`No Circle wallet found for user ${userId}`);
        }
        
        return wallet.id;
    } catch (error: any) {
        console.error(`Failed to get user wallet ID for user ${userId}:`, error);
        throw new Error(`Wallet not found for user ${userId}`);
    }
};

/**
 * Get admin wallet ID for fulfillments
 * @returns Admin Circle wallet ID
 */
export const getAdminWalletId = async (): Promise<string> => {
    try {
        // Look for admin wallet in database
        const adminWallet = await db.wallet.findFirst({
            where: {
                name: { contains: "admin" },
                accountType: "SCA"
            }
        });
        
        if (adminWallet?.id) {
            return adminWallet.id;
        }
        
        // Fallback to environment variable
        const envAdminWalletId = process.env.ADMIN_WALLET_ID;
        if (envAdminWalletId) {
            return envAdminWalletId;
        }
        
        throw new Error("No admin wallet configured");
    } catch (error: any) {
        console.error("Failed to get admin wallet ID:", error);
        throw new Error("Admin wallet not found");
    }
};

/**
 * Validate wallet permissions for specific action
 * @param walletId - Circle wallet ID
 * @param action - Action to validate ("approve", "deposit", "claim", "admin")
 * @returns Promise that resolves if wallet has permissions
 */
export const validateWalletPermissions = async (
    walletId: string, 
    action: "approve" | "deposit" | "claim" | "admin"
): Promise<void> => {
    try {
        // Check if wallet exists in database
        const wallet = await db.wallet.findUnique({
            where: { id: walletId }
        });
        
        if (!wallet) {
            throw new Error(`Wallet ${walletId} not found in database`);
        }
        
        // For admin actions, check if wallet has admin privileges
        if (action === "admin") {
            const isAdmin = wallet.name?.toLowerCase().includes("admin") || 
                           wallet.userId === parseInt(process.env.ADMIN_USER_ID || "0");
            
            if (!isAdmin) {
                throw new Error(`Wallet ${walletId} does not have admin permissions`);
            }
        }
        
        // Additional validation could be added here:
        // - Check wallet status
        // - Check user permissions
        // - Check wallet balance for certain actions
        
        console.log(`✅ Wallet ${walletId} validated for ${action} action`);
        
    } catch (error: any) {
        console.error(`❌ Wallet permission validation failed for ${action}:`, error);
        throw error;
    }
};

/**
 * Get wallet by ID
 * @param walletId - Circle wallet ID
 * @returns Wallet record or null
 */
export const getWalletById = async (walletId: string): Promise<Wallet | null> => {
    try {
        return await db.wallet.findUnique({
            where: { id: walletId }
        });
    } catch (error: any) {
        console.error(`Failed to get wallet by ID ${walletId}:`, error);
        return null;
    }
};

/**
 * Get all wallets for a user
 * @param userId - User ID from database
 * @returns Array of wallet records
 */
export const getUserWallets = async (userId: number): Promise<Wallet[]> => {
    try {
        return await db.wallet.findMany({
            where: {
                userId: userId
            }
        });
    } catch (error: any) {
        console.error(`Failed to get wallets for user ${userId}:`, error);
        return [];
    }
}; 