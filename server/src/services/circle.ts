// ============================================================================
// LEGACY CIRCLE SERVICE - DEPRECATED
// ============================================================================
// 
// This file contains legacy functions that are being phased out.
// New functionality has been moved to separate services:
// 
// - transactionService.ts - Core transaction execution
// - walletService.ts - Wallet management
// - circleDeposit.ts - Deposit operations
// - circlePool.ts - Pool deployment and management
// - utils.ts - Shared utilities
// 
// Please use the new services for all new development.
// ============================================================================

import { AccountType, Blockchain } from "@circle-fin/developer-controlled-wallets";
import { createUser, createWallet } from "../prisma/models";
import circleClient from "../utils/circleClient";
import circleContractClient from "../utils/circleContractClient";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@prisma/client";
import { parseUnits, formatUnits } from "ethers";
import db from "../utils/prismaClient";

// Re-export from new services for backward compatibility
export {
    // Transaction service
    executeContractTransaction,
    THURMAN_ABI,
    TransactionRequest,
    TransactionResponse,
    validateTransactionParams
} from "./transactionService";

export {
    // Wallet service
    createDeveloperWallet,
    getUserWalletId,
    getAdminWalletId,
    validateWalletPermissions,
    getWalletById,
    getUserWallets
} from "./walletService";

export {
    // Deposit service
    createUSDCApproval,
    createDepositRequest,
    createDepositFulfillment,
    createShareClaim,
    executeFullDepositRequest,
    executeFullDepositRequestByUserId,
    DepositRequest,
    DepositFulfillment
} from "./circleDeposit";

export {
    // Pool service
    deployPoolAndLoans,
    configurePoolSettings,
    deployLoans,
    getPoolIdFromTransaction,
    cleanupFailedPoolIds
} from "./circlePool";

export {
    // Utils
    parseUSDCAmount,
    formatPoolId,
    formatAddress,
    formatAddresses,
    formatUSDCAmount,
    validateUSDCAmount
} from "./utils";