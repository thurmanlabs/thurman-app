import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";

// Initialize smart contract platform client
const smartContractClient = initiateSmartContractPlatformClient({
    apiKey: config.circleApiKey,
    entitySecret: config.circleEntitySecret,
});
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import { parseUnits } from "ethers";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { config } from "../config";

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

// Loan Pool Deployment Types
type DeployPoolParams = {
    adminWalletId: string;
    vaultAddress: string;
    aavePoolAddress: string;
    originatorRegistryAddress: string;
    poolManagerAddress: string;
}

type DeployPoolAndLoansResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type DeployLoansResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type LoanParameter = {
    borrower: string;
    originator: string;
    retentionRate: string;
    principal: string;
    termMonths: number;
    interestRate: string;
}

// Loan Pool Deployment Functions
export const deployPoolAndLoans = async ({
    adminWalletId,
    vaultAddress,
    aavePoolAddress,
    originatorRegistryAddress,
    poolManagerAddress
}: DeployPoolParams): Promise<DeployPoolAndLoansResult> => {
    const idempotencyKey = uuidv4();

    try {

        // Default config values
        const collateralCushion = parseUnits("0.1", 18);
        const ltvRatioCap = parseUnits("0.8", 18);
        const liquidityPremiumRate = parseUnits("0.02", 18);
        const marginFee = parseUnits("0.005", 18);

        // Call addPool() via Circle contract execution
        const transaction = await circleClient.createContractExecutionTransaction({
            walletId: adminWalletId,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: "addPool(address,address,address,uint256,uint256,uint256,uint256)",
            abiParameters: [
                vaultAddress,
                aavePoolAddress,
                originatorRegistryAddress,
                collateralCushion.toString(),
                ltvRatioCap.toString(),
                liquidityPremiumRate.toString(),
                marginFee.toString()
            ],
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        const transactionId = transaction.data?.id;
        
        if (!transactionId) {
            throw new Error("Failed to get transaction ID from Circle");
        }

        return {
            success: true,
            transactionId
        };

    } catch (error: any) {
        console.error("Error deploying pool and loans:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy pool and loans"
        };
    }
}

export const deployLoans = async ({
    loanData,
    poolId,
    adminWalletId,
    poolManagerAddress
}: {
    loanData: any[];
    poolId: number;
    adminWalletId: string;
    poolManagerAddress: string;
}): Promise<DeployLoansResult> => {
    const idempotencyKey = uuidv4();

    try {
        if (!Array.isArray(loanData)) {
            throw new Error("Invalid loan data format");
        }

        // Format as loan parameters array for batchInitLoans
        const loanParameters: LoanParameter[] = loanData.map((loan: any) => ({
            borrower: loan.borrower_address,
            originator: loan.originator_address,
            retentionRate: loan.retention_rate.toString(),
            principal: loan.principal.toString(),
            termMonths: loan.term_months,
            interestRate: loan.interest_rate.toString()
        }));

        // Convert to the format expected by batchInitLoans
        const batchArgs = loanParameters.map(loan => [
            loan.borrower,
            loan.originator,
            parseUnits(loan.retentionRate, 18),
            parseUnits(loan.principal, 6), // Assuming principal is in USD with 6 decimals
            loan.termMonths,
            parseUnits(loan.interestRate, 18)
        ]);



        // Call batchInitLoans via Circle contract execution
        const transaction = await circleClient.createContractExecutionTransaction({
            walletId: adminWalletId,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: "batchInitLoans(uint256,(address,address,uint256,uint256,uint256,uint256)[])",
            abiParameters: [poolId, batchArgs],
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        const transactionId = transaction.data?.id;
        
        if (!transactionId) {
            throw new Error("Failed to get transaction ID from Circle");
        }

        return {
            success: true,
            transactionId
        };

    } catch (error: any) {
        console.error("Error deploying loans:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy loans"
        };
    }
}

export const getPoolIdFromTransaction = async (txHash: string): Promise<number | null> => {
    try {
        // TODO: Implement actual event parsing from transaction logs
        // For now, return a placeholder
        console.log(`Extracting pool ID from transaction: ${txHash}`);
        
        // Placeholder implementation - replace with actual event parsing
        // This would typically involve:
        // 1. Fetching transaction receipt
        // 2. Parsing logs for PoolCreated event
        // 3. Extracting poolId from event data
        
        return null; // Placeholder - implement actual logic
    } catch (error: any) {
        console.error("Error extracting pool ID from transaction:", error);
        return null;
    }
}