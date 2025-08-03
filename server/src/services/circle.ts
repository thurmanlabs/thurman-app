import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import circleContractClient from "../utils/circleContractClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import { parseUnits, formatUnits } from "ethers";
import db from "../utils/prismaClient";

// Smart Contract ABI Definitions
const POOL_MANAGER_ABI = {
    addPool: "addPool(address,address,uint256)",
    setPoolOperationalSettings: "setPoolOperationalSettings(uint16,bool,bool,bool,bool,uint256,uint256,uint256)",
    batchInitLoan: "batchInitLoan(uint16,(address,uint256,uint256,uint16,uint256)[],address)"
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
    originatorRegistryAddress: string;
    poolManagerAddress: string;
}

type DeployPoolAndLoansResult = {
    success: boolean;
    transactionId?: string;
    error?: string;
}

type ConfigurePoolResult = {
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
    originatorRegistryAddress: string;
    marginFee: number;
}) => {
    return [
        params.vaultAddress,
        params.originatorRegistryAddress,
        parseUnits(params.marginFee.toString(), 18).toString() // Convert BigInt to string
    ];
};

const formatLoanParameters = (loans: LoanData[]): any[] => {
    return loans.map(loan => [
        loan.borrower_address,
        parseUnits(loan.retention_rate.toString(), 18).toString(), // retention rate as decimal (0.05 = 5%)
        parseUnits(loan.principal.toString(), 6).toString(), // principal in USDC (6 decimals)
        loan.term_months, // term in months (uint16)
        parseUnits(loan.interest_rate.toString(), 18).toString() // interest rate as decimal (0.085 = 8.5%)
    ]);
};

const parsePoolCreatedEvent = async (txHash: string): Promise<number | null> => {
    try {
        console.log(`Parsing PoolCreated event from transaction: ${txHash}`);
        
        // TODO: IMPLEMENT ACTUAL BLOCKCHAIN EVENT PARSING
        // This is where we would:
        // 1. Use Circle's API to get transaction details
        // 2. Parse the transaction logs for PoolCreated event
        // 3. Extract the actual pool ID from the event data
        
        // For now, we'll use a temporary workaround
        // WARNING: This may not match the actual blockchain pool ID!
        
        // Get the next available pool ID by finding the maximum existing SUCCESSFUL pool ID and adding 1
        // This accounts for non-sequential pool IDs (like 0, 1, 2, 5) and excludes failed pools
        const successfulPools = await db.loanPool.findMany({
            where: {
                pool_id: { not: null },
                status: { 
                    in: ['POOL_CREATED', 'POOL_CONFIGURED', 'DEPLOYING_LOANS', 'DEPLOYED'] as any
                }
            },
            select: {
                pool_id: true
            }
        });
        
        const maxPoolId = successfulPools.length > 0 ? Math.max(...successfulPools.map(p => p.pool_id!)) : -1;
        const nextPoolId = maxPoolId + 1; // Next pool ID after the maximum successful pool
        
        console.log(`⚠️  TEMPORARY: Using sequential pool ID: ${nextPoolId} for transaction: ${txHash}`);
        console.log(`⚠️  WARNING: This may not match the actual blockchain pool ID!`);
        console.log(`⚠️  TODO: Implement proper event parsing to get real blockchain pool ID`);
        
        return nextPoolId;
    } catch (error: any) {
        console.error("Error parsing PoolCreated event:", error);
        return null;
    }
};

// Loan Pool Deployment Functions
export const deployPoolAndLoans = async ({
    adminWalletId,
    vaultAddress,
    originatorRegistryAddress,
    poolManagerAddress
}: DeployPoolParams): Promise<DeployPoolAndLoansResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Format parameters for smart contract call
        const poolParameters = formatPoolParameters({
            vaultAddress,
            originatorRegistryAddress,
            marginFee: 0.005 // 0.5%
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

export const configurePoolSettings = async ({
    poolId,
    adminWalletId,
    poolManagerAddress
}: {
    poolId: number;
    adminWalletId: string;
    poolManagerAddress: string;
}): Promise<ConfigurePoolResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Configure pool to enable borrowing and other operations
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.setPoolOperationalSettings,
            abiParameters: [
                poolId.toString(), // poolId
                true, // depositsEnabled
                true, // withdrawalsEnabled
                true, // borrowingEnabled (required for batchInitLoan)
                false, // isPaused
                "0", // maxDepositAmount (0 = no limit)
                "0", // minDepositAmount (0 = no minimum)
                "0"  // depositCap (0 = no cap)
            ],
            walletId: adminWalletId,
            fee: {
                type: "level",
                config: {
                    feeLevel: "MEDIUM"
                }
            }
        });

        console.log("Pool configuration transaction initiated:", contractExecution.data?.id);

        return {
            success: true,
            transactionId: contractExecution.data?.id
        };

    } catch (error: any) {
        console.error("Error configuring pool settings:", error);
        return {
            success: false,
            error: error.message || "Failed to configure pool settings"
        };
    }
};

export const deployLoans = async ({
    loanData,
    poolId,
    adminWalletId,
    poolManagerAddress,
    originatorAddress
}: {
    loanData: any[];
    poolId: number;
    adminWalletId: string;
    poolManagerAddress: string;
    originatorAddress: string;
}): Promise<DeployLoansResult> => {
    const idempotencyKey = uuidv4();

    try {
        // Format loan parameters for batch initialization
        const loanParameters = formatLoanParameters(loanData);

        // Execute batch loan initialization via Circle
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress: poolManagerAddress,
            abiFunctionSignature: POOL_MANAGER_ABI.batchInitLoan,
            abiParameters: [poolId.toString(), loanParameters, originatorAddress], // Convert poolId to string
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

// Helper function to clean up failed pool IDs (reset them to null so they don't interfere with future assignments)
export const cleanupFailedPoolIds = async (): Promise<void> => {
    try {
        const failedPools = await db.loanPool.findMany({
            where: {
                status: 'FAILED',
                pool_id: { not: null }
            },
            select: {
                id: true,
                pool_id: true
            }
        });

        if (failedPools.length > 0) {
            console.log(`Found ${failedPools.length} failed pools with pool_id that need cleanup`);
            
            for (const pool of failedPools) {
                await db.loanPool.update({
                    where: { id: pool.id },
                    data: { pool_id: null }
                });
                console.log(`✅ Reset pool_id to null for failed pool ${pool.id} (was ${pool.pool_id})`);
            }
        }
    } catch (error: any) {
        console.error("Error cleaning up failed pool IDs:", error);
    }
};