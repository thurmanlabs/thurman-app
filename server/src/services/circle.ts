import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import circleContractClient from "../utils/circleContractClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import { parseUnits, formatUnits } from "ethers";

// Smart Contract ABI Definitions
const POOL_MANAGER_ABI = {
    addPool: "addPool(address,address,address,uint256,uint256,uint256,uint256)",
    batchInitLoans: "batchInitLoans(uint16,(address,address,uint256,uint256,uint16,uint256)[])"
};

// Loan Data Interface
interface LoanData {
    borrower_address: string;
    originator_address: string;
    retention_rate: number;
    principal: number;
    term_months: number;
    interest_rate: number;
    business_name?: string;
    loan_purpose?: string;
    risk_grade?: string;
}

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

// Helper Functions for Smart Contract Integration
const formatPoolParameters = (params: {
    vaultAddress: string;
    aavePoolAddress: string;
    originatorRegistryAddress: string;
    collateralCushion: number;
    ltvRatioCap: number;
    liquidityPremiumRate: number;
    marginFee: number;
}) => {
    return [
        params.vaultAddress,
        params.aavePoolAddress,
        params.originatorRegistryAddress,
        parseUnits(params.collateralCushion.toString(), 18),
        parseUnits(params.ltvRatioCap.toString(), 18),
        parseUnits(params.liquidityPremiumRate.toString(), 18),
        parseUnits(params.marginFee.toString(), 18)
    ];
};

const formatLoanParameters = (loans: LoanData[]): any[] => {
    return loans.map(loan => [
        loan.borrower_address,
        loan.originator_address,
        parseUnits(loan.retention_rate.toString(), 18), // retention rate as decimal (0.05 = 5%)
        parseUnits(loan.principal.toString(), 6), // principal in USDC (6 decimals)
        loan.term_months, // term in months (uint16)
        parseUnits(loan.interest_rate.toString(), 18) // interest rate as decimal (0.085 = 8.5%)
    ]);
};

const parsePoolCreatedEvent = async (txHash: string): Promise<number | null> => {
    try {
        // TODO: Implement actual event parsing from transaction logs
        // This would typically involve:
        // 1. Fetching transaction receipt from blockchain
        // 2. Parsing logs for PoolCreated event
        // 3. Extracting poolId from event data
        console.log(`Parsing PoolCreated event from transaction: ${txHash}`);
        
        // Placeholder implementation - replace with actual event parsing
        return null;
    } catch (error: any) {
        console.error("Error parsing PoolCreated event:", error);
        return null;
    }
};

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
        // Default config values (as decimals for easier management)
        const poolConfig = {
            collateralCushion: 0.1, // 10%
            ltvRatioCap: 0.8, // 80%
            liquidityPremiumRate: 0.02, // 2%
            marginFee: 0.005 // 0.5%
        };

        // Format parameters for smart contract call
        const poolParameters = formatPoolParameters({
            vaultAddress,
            aavePoolAddress,
            originatorRegistryAddress,
            ...poolConfig
        });

        // Execute smart contract call via Circle
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.addPool,
            abiParameters: poolParameters,
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Pool creation transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error deploying pool:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy pool"
        };
    }
};

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
        // Format loan parameters for batch initialization
        const loanParameters = formatLoanParameters(loanData);

        // Execute batch loan initialization via Circle
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.batchInitLoans,
            abiParameters: [poolId, loanParameters],
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Loan batch initialization transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error deploying loans:", error);
        return {
            success: false,
            error: error.message || "Failed to deploy loans"
        };
    }
};

export const getPoolIdFromTransaction = async (txHash: string): Promise<number | null> => {
    try {
        // Parse the transaction logs to extract pool ID
        return await parsePoolCreatedEvent(txHash);
    } catch (error: any) {
        console.error("Error getting pool ID from transaction:", error);
        return null;
    }
};