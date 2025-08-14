import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { 
    executeContractTransaction, 
    THURMAN_ABI, 
    TransactionRequest, 
    TransactionResponse 
} from "./transactionService";
import { 
    parseUSDCAmount, 
    formatPoolId, 
    formatAddress 
} from "./utils";
import { 
    validateWalletPermissions, 
    getUserWalletId, 
    getAdminWalletId 
} from "./walletService";

// ============================================================================
// DEPOSIT INTERFACES
// ============================================================================

export interface DepositRequest {
    poolId: number;
    amount: string; // USDC amount in human readable format (e.g., "100.50")
    userAddress: string;
    walletId: string;
}

export interface DepositFulfillment {
    poolId: number;
    amount: string;
    userAddress: string;
    adminWalletId: string;
}

// ============================================================================
// DEPOSIT TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Create USDC approval transaction
 * @param amount - USDC amount to approve (human readable format)
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createUSDCApproval = async (
    amount: string, 
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating USDC approval for ${amount} USDC, wallet: ${userWalletId}`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "approve");
        
        // Get pool manager address from environment
        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
        if (!poolManagerAddress) {
            throw new Error("Pool manager address not configured");
        }
        
        // Format parameters for approve(address,uint256)
        const parameters = [
            formatAddress(poolManagerAddress), // spender address
            parseUSDCAmount(amount) // amount to approve
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.USDC_ADDRESS || "",
            functionSignature: THURMAN_ABI.USDC_APPROVE,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ USDC approval transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ USDC approval failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create USDC approval:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create deposit request transaction
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createDepositRequest = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating deposit request for pool ${poolId}, amount: ${amount} USDC`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "deposit");
        
        // TODO: Validate pool exists and deposits are enabled
        // This would typically query the pool manager contract
        // await validatePoolDepositsEnabled(poolId);
        
        // Format parameters for requestDeposit(uint16,uint256,address)
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_REQUEST_DEPOSIT,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Deposit request transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Deposit request failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create deposit request:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create deposit fulfillment transaction (admin only)
 * @param poolId - Pool ID to fulfill deposit for
 * @param amount - USDC amount to fulfill (human readable format)
 * @param userAddress - User's Ethereum address
 * @param adminWalletId - Admin's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createDepositFulfillment = async (
    poolId: number,
    amount: string,
    userAddress: string,
    adminWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating deposit fulfillment for pool ${poolId}, user: ${userAddress}, amount: ${amount} USDC`);
        
        // Validate admin wallet exists and has admin permissions
        await validateWalletPermissions(adminWalletId, "admin");
        
        // Format parameters for fulfillDeposit(uint16,uint256,address)
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_FULFILL_DEPOSIT,
            parameters,
            walletId: adminWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Deposit fulfillment transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Deposit fulfillment failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create deposit fulfillment:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

/**
 * Create share claiming transaction
 * @param poolId - Pool ID to claim shares from
 * @param amount - USDC amount to claim (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Transaction response with ID
 */
export const createShareClaim = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<TransactionResponse> => {
    try {
        console.log(`🔄 Creating share claim for pool ${poolId}, user: ${userAddress}, amount: ${amount} USDC`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "claim");
        
        // TODO: Validate user has claimable amount
        // This would typically query the pool manager contract
        // await validateClaimableAmount(poolId, userAddress, amount);
        
        // Format parameters for deposit(uint16,uint256,address) - same as direct deposit
        const parameters = [
            formatPoolId(poolId),
            parseUSDCAmount(amount),
            formatAddress(userAddress)
        ];
        
        const transactionRequest: TransactionRequest = {
            contractAddress: process.env.POOL_MANAGER_ADDRESS || "",
            functionSignature: THURMAN_ABI.POOL_MANAGER_DEPOSIT,
            parameters,
            walletId: userWalletId
        };
        
        const result = await executeContractTransaction(transactionRequest);
        
        if (result.status === "PENDING") {
            console.log(`✅ Share claim transaction created: ${result.transactionId}`);
        } else {
            console.error(`❌ Share claim failed: ${result.error}`);
        }
        
        return result;
        
    } catch (error: any) {
        console.error("Failed to create share claim:", error);
        return {
            transactionId: uuidv4(),
            status: "FAILED",
            error: error.message
        };
    }
};

// ============================================================================
// COMPLETE DEPOSIT FLOWS
// ============================================================================

/**
 * Complete two-step deposit flow using Circle batch operations: USDC approval + deposit request
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userWalletId - User's Circle wallet ID
 * @returns Object with batch transaction ID and status
 */
export const executeFullDepositRequest = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userWalletId: string
): Promise<{
    batchTransaction: TransactionResponse;
    success: boolean;
    error?: string;
}> => {
    try {
        console.log(`🔄 Starting batched deposit request flow for pool ${poolId}, amount: ${amount} USDC`);
        
        // Validate wallet exists and user has permissions
        await validateWalletPermissions(userWalletId, "approve");
        
        // Get required contract addresses from environment
        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
        const usdcAddress = process.env.USDC_ADDRESS;
        
        if (!poolManagerAddress || !usdcAddress) {
            throw new Error("Required contract addresses not configured");
        }
        
        // Format amount for blockchain
        const formattedAmount = parseUSDCAmount(amount);
        const formattedPoolId = formatPoolId(poolId);
        const formattedUserAddress = formatAddress(userAddress);
        
        // Create ethers interfaces for proper function encoding (ethers v6)
        const usdcInterface = new ethers.Interface([
            "function approve(address spender, uint256 amount)"
        ]);
        
        const poolManagerInterface = new ethers.Interface([
            "function requestDeposit(uint16 poolId, uint256 amount, address user)"
        ]);
        
        // Encode function calls using ethers
        const approveData = usdcInterface.encodeFunctionData("approve", [
            poolManagerAddress, 
            formattedAmount
        ]);
        
        const requestDepositData = poolManagerInterface.encodeFunctionData("requestDeposit", [
            formattedPoolId,
            formattedAmount,
            formattedUserAddress
        ]);
        
        // Create batch transaction request for executeBatch((address, uint256, bytes)[])
        // Transaction 1: USDC approve for pool manager
        // Transaction 2: Pool manager requestDeposit
        
        const batchTransactionRequest: TransactionRequest = {
            contractAddress: userWalletId, // Execute on the user's wallet (MSCA)
            functionSignature: "executeBatch((address, uint256, bytes)[])",
            parameters: [
                [
                    // First transaction: USDC approve
                    [
                        usdcAddress, // USDC contract address
                        "0", // No native token transfer
                        approveData // Properly encoded approve function call
                    ],
                    // Second transaction: Pool manager requestDeposit
                    [
                        poolManagerAddress, // Pool manager contract address
                        "0", // No native token transfer
                        requestDepositData // Properly encoded requestDeposit function call
                    ]
                ]
            ],
            walletId: userWalletId
        };
        
        console.log("🔄 Executing batched deposit transaction...");
        const batchResult = await executeContractTransaction(batchTransactionRequest);
        
        if (batchResult.status === "PENDING") {
            console.log(`✅ Batched deposit transaction created successfully: ${batchResult.transactionId}`);
            return {
                batchTransaction: batchResult,
                success: true
            };
        } else {
            console.error(`❌ Batched deposit transaction failed: ${batchResult.error}`);
            return {
                batchTransaction: batchResult,
                success: false,
                error: `Batched deposit failed: ${batchResult.error}`
            };
        }
        
    } catch (error: any) {
        console.error("❌ Batched deposit request flow failed:", error);
        return {
            batchTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "Flow failed"
            },
            success: false,
            error: error.message
        };
    }
};

/**
 * Alternative: Execute full deposit request with user ID instead of wallet ID
 * @param poolId - Pool ID to deposit into
 * @param amount - USDC amount to deposit (human readable format)
 * @param userAddress - User's Ethereum address
 * @param userId - User ID from database
 * @returns Object with batch transaction ID and status
 */
export const executeFullDepositRequestByUserId = async (
    poolId: number,
    amount: string,
    userAddress: string,
    userId: number
): Promise<{
    batchTransaction: TransactionResponse;
    success: boolean;
    error?: string;
}> => {
    try {
        // Get user's wallet ID
        const userWalletId = await getUserWalletId(userId);
        
        // Execute the full deposit request flow
        return await executeFullDepositRequest(poolId, amount, userAddress, userWalletId);
        
    } catch (error: any) {
        console.error("❌ Full deposit request by user ID failed:", error);
        return {
            batchTransaction: {
                transactionId: "",
                status: "FAILED",
                error: "User wallet not found"
            },
            success: false,
            error: error.message
        };
    }
}; 