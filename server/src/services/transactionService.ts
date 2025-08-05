import { v4 as uuidv4 } from "uuid";
import circleClient from "../utils/circleClient";

// ============================================================================
// CIRCLE SDK CONTRACT TRANSACTION FOUNDATION
// ============================================================================

// Thurman Protocol ABI Function Signatures
export const THURMAN_ABI = {
    // USDC Token Contract
    USDC_APPROVE: "approve(address,uint256)",
    
    // Pool Manager Contract - Deposit Functions
    POOL_MANAGER_REQUEST_DEPOSIT: "requestDeposit(uint16,uint256,address)",
    POOL_MANAGER_FULFILL_DEPOSIT: "fulfillDeposit(uint16,uint256,address)",
    POOL_MANAGER_DEPOSIT: "deposit(uint16,uint256,address)",
    
    // Pool Manager Contract - Pool Management
    POOL_MANAGER_ADD_POOL: "addPool(address,address,uint256)",
    POOL_MANAGER_SET_POOL_SETTINGS: "setPoolOperationalSettings(uint16,bool,bool,bool,bool,uint256,uint256,uint256)",
    POOL_MANAGER_BATCH_INIT_LOAN: "batchInitLoan(uint16,(address,uint256,uint256,uint16,uint256)[],address)"
};

// TypeScript Interfaces
export interface TransactionRequest {
    contractAddress: string;
    functionSignature: string;
    parameters: any[];
    walletId: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export interface TransactionResponse {
    transactionId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    error?: string;
}

// ============================================================================
// PARAMETER VALIDATION
// ============================================================================

/**
 * Validate all transaction parameters before execution
 * @param request - Transaction request object
 * @returns Validated and formatted parameters
 */
export const validateTransactionParams = (request: TransactionRequest): any[] => {
    const { contractAddress, functionSignature, parameters, walletId } = request;
    
    // Validate contract address
    if (!contractAddress || typeof contractAddress !== 'string') {
        throw new Error(`Invalid contract address: ${contractAddress}`);
    }
    
    // Basic Ethereum address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(contractAddress)) {
        throw new Error(`Invalid contract address format: ${contractAddress}`);
    }
    
    // Validate function signature
    if (!functionSignature || typeof functionSignature !== 'string') {
        throw new Error(`Invalid function signature: ${functionSignature}`);
    }
    
    // Validate wallet ID
    if (!walletId || typeof walletId !== 'string') {
        throw new Error(`Invalid wallet ID: ${walletId}`);
    }
    
    // Validate parameters array
    if (!Array.isArray(parameters)) {
        throw new Error(`Parameters must be an array`);
    }
    
    return parameters;
};

// ============================================================================
// CORE TRANSACTION EXECUTION FUNCTION
// ============================================================================

/**
 * Execute contract transaction using Circle SDK
 * @param request - Transaction request with all parameters
 * @returns Transaction response with ID and status
 */
export const executeContractTransaction = async (
    request: TransactionRequest
): Promise<TransactionResponse> => {
    const { contractAddress, functionSignature, parameters, walletId, feeLevel = "MEDIUM" } = request;
    
    // Generate idempotency key
    const idempotencyKey = uuidv4();
    
    try {
        // Validate and format parameters
        const validatedParams = validateTransactionParams(request);
        
        console.log(`🔄 Executing contract transaction:`, {
            contractAddress,
            functionSignature,
            parameters: validatedParams,
            walletId,
            idempotencyKey
        });
        
        // Execute transaction via Circle SDK
        const contractExecution = await circleClient.createContractExecutionTransaction({
            idempotencyKey,
            contractAddress,
            abiFunctionSignature: functionSignature,
            abiParameters: validatedParams,
            walletId,
            fee: {
                type: "level",
                config: {
                    feeLevel
                }
            }
        });
        
        const transactionId = contractExecution.data?.id;
        
        if (!transactionId) {
            throw new Error("No transaction ID returned from Circle SDK");
        }
        
        console.log(`✅ Contract transaction executed successfully:`, {
            transactionId,
            contractAddress,
            functionSignature
        });
        
        return {
            transactionId,
            status: "PENDING"
        };
        
    } catch (error: any) {
        console.error(`❌ Contract transaction failed:`, {
            error: error.message,
            contractAddress,
            functionSignature,
            parameters,
            walletId,
            idempotencyKey
        });
        
        return {
            transactionId: idempotencyKey, // Use idempotency key as fallback ID
            status: "FAILED",
            error: error.message || "Unknown transaction error"
        };
    }
}; 