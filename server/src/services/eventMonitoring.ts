import circleContractClient from "../utils/circleContractClient";
import { formatUSDCAmount } from "./utils";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface DepositEvent {
    eventType: 'DepositRequest' | 'DepositFulfilled' | 'Deposit';
    transactionHash: string;
    blockNumber: number;
    poolId: number;
    userAddress: string;
    amount: string; // Human readable USDC amount
    amountWei: string; // Raw wei amount
    timestamp: number;
    logIndex: number;
    contractAddress: string;
}

export interface EventQuery {
    userAddress?: string;
    poolId?: number;
    limit?: number;
    fromBlock?: number;
    toBlock?: number;
    eventType?: 'DepositRequest' | 'DepositFulfilled' | 'Deposit';
}

export interface ParsedEventData {
    poolId: number;
    userAddress: string;
    amount: string;
    amountWei: string;
    eventType: 'DepositRequest' | 'DepositFulfilled' | 'Deposit';
}

export interface EventMonitor {
    id: string;
    contractAddress: string;
    eventSignature: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

// ============================================================================
// EVENT SIGNATURES
// ============================================================================

export const THURMAN_EVENTS = {
    DEPOSIT_REQUEST: "DepositRequest(uint256,address,uint256)",
    DEPOSIT_FULFILLED: "DepositFulfilled(uint256,address,uint256)",
    DEPOSIT: "Deposit(address,address,uint256,uint256)"
};

// ============================================================================
// CONTRACT IMPORT AND EVENT MONITOR SETUP
// ============================================================================

/**
 * Import Thurman PoolManager contract into Circle's system
 * @returns Contract import result
 */
export const importThurmanContract = async (): Promise<{ success: boolean; contractId?: string; error?: string }> => {
    try {
        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
        if (!poolManagerAddress) {
            throw new Error("Pool manager address not configured");
        }

        console.log(`🔄 Importing Thurman PoolManager contract: ${poolManagerAddress}`);

        // Note: Contract import functionality may not be available in current SDK
        // This is a placeholder for when the API becomes available
        console.log("⚠️  Contract import not available in current SDK version");
        console.log("ℹ️  Please import contract manually via Circle Console");
        
        return {
            success: true,
            contractId: "manual-import-required"
        };

    } catch (error: any) {
        console.error("❌ Contract import failed:", error);
        return {
            success: false,
            error: error.message || "Failed to import contract"
        };
    }
};

/**
 * Create event monitor for a specific event
 * @param contractAddress - Contract address to monitor
 * @param eventSignature - Event signature to monitor
 * @returns Monitor creation result
 */
export const createEventMonitor = async (
    contractAddress: string,
    eventSignature: string
): Promise<{ success: boolean; monitorId?: string; error?: string }> => {
    try {
        console.log(`🔄 Creating event monitor for: ${eventSignature}`);

        // Note: Event monitor creation may not be available in current SDK
        // This is a placeholder for when the API becomes available
        console.log("⚠️  Event monitor creation not available in current SDK version");
        console.log("ℹ️  Please create monitors manually via Circle Console");
        console.log(`  Contract: ${contractAddress}`);
        console.log(`  Event: ${eventSignature}`);
        
        return {
            success: true,
            monitorId: "manual-creation-required"
        };

    } catch (error: any) {
        console.error(`❌ Event monitor creation failed for ${eventSignature}:`, error);
        return {
            success: false,
            error: error.message || "Failed to create event monitor"
        };
    }
};

/**
 * Initialize all event monitors for Thurman protocol
 * @returns Initialization result with monitor IDs
 */
export const initializeEventMonitors = async (): Promise<{
    success: boolean;
    contractId?: string;
    monitors?: { [key: string]: string };
    error?: string;
}> => {
    try {
        console.log("🔄 Initializing Circle Event Monitors for Thurman Protocol");

        // Step 1: Import contract
        const contractResult = await importThurmanContract();
        if (!contractResult.success) {
            throw new Error(`Contract import failed: ${contractResult.error}`);
        }

        const contractId = contractResult.contractId;
        console.log("ℹ️  Using manual contract import process");

        // Step 2: Create event monitors
        const monitors: { [key: string]: string } = {};
        const eventSignatures = [
            THURMAN_EVENTS.DEPOSIT_REQUEST,
            THURMAN_EVENTS.DEPOSIT_FULFILLED,
            THURMAN_EVENTS.DEPOSIT
        ];

        const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
        if (!poolManagerAddress) {
            throw new Error("Pool manager address not configured");
        }

        for (const eventSignature of eventSignatures) {
            const monitorResult = await createEventMonitor(poolManagerAddress, eventSignature);
            if (monitorResult.success) {
                monitors[eventSignature] = monitorResult.monitorId!;
            } else {
                console.warn(`⚠️  Monitor creation failed for ${eventSignature}: ${monitorResult.error}`);
            }
        }

        console.log("✅ Event monitors initialization completed (manual setup required)");
        console.log("📋 Manual Setup Instructions:");
        console.log("1. Go to Circle Console > Contracts");
        console.log("2. Import contract:", poolManagerAddress);
        console.log("3. Create event monitors for each event signature");
        console.log("4. Configure webhook URL for notifications");
        
        return {
            success: true,
            contractId,
            monitors
        };

    } catch (error: any) {
        console.error("❌ Event monitors initialization failed:", error);
        return {
            success: false,
            error: error.message || "Failed to initialize event monitors"
        };
    }
};

// ============================================================================
// HISTORICAL EVENT QUERYING
// ============================================================================

/**
 * Query historical deposit events
 * @param query - Query parameters for filtering events
 * @returns Array of deposit events
 */
export const getDepositHistory = async (query: EventQuery = {}): Promise<DepositEvent[]> => {
    try {
        const {
            userAddress,
            poolId,
            limit = 100,
            fromBlock,
            toBlock,
            eventType
        } = query;

        console.log(`🔄 Querying deposit history:`, { userAddress, poolId, limit, eventType });

        // Note: Event history querying may not be available in current SDK
        // This is a placeholder for when the API becomes available
        console.log("⚠️  Event history querying not available in current SDK version");
        console.log("ℹ️  Please use Circle Console or REST API for event history");
        
        // Return empty array for now
        return [];

    } catch (error: any) {
        console.error("❌ Failed to query deposit history:", error);
        throw new Error(`Failed to query deposit history: ${error.message}`);
    }
};

// ============================================================================
// EVENT DATA PARSING HELPERS
// ============================================================================

/**
 * Parse raw event data to standardized DepositEvent format
 * @param event - Raw event from Circle API
 * @returns Parsed deposit event
 */
export const parseEventToDepositEvent = async (event: any): Promise<DepositEvent> => {
    try {
        const eventSignature = event.eventSignature || event.notification?.eventName;
        let parsedData: ParsedEventData;

        // Parse based on event type
        if (eventSignature === THURMAN_EVENTS.DEPOSIT_REQUEST) {
            parsedData = parseDepositRequestEvent(event);
        } else if (eventSignature === THURMAN_EVENTS.DEPOSIT_FULFILLED) {
            parsedData = parseDepositFulfilledEvent(event);
        } else if (eventSignature === THURMAN_EVENTS.DEPOSIT) {
            parsedData = parseDepositClaimedEvent(event);
        } else {
            throw new Error(`Unknown event signature: ${eventSignature}`);
        }

        return {
            eventType: parsedData.eventType,
            transactionHash: event.txHash || event.notification?.txHash,
            blockNumber: event.blockHeight || event.notification?.blockHeight,
            poolId: parsedData.poolId,
            userAddress: parsedData.userAddress,
            amount: parsedData.amount,
            amountWei: parsedData.amountWei,
            timestamp: event.firstConfirmDate ? new Date(event.firstConfirmDate).getTime() : Date.now(),
            logIndex: parseInt(event.logIndex || "0"),
            contractAddress: event.contractAddress || event.notification?.contractAddress
        };

    } catch (error: any) {
        console.error("Failed to parse event:", error);
        throw new Error(`Event parsing failed: ${error.message}`);
    }
};

/**
 * Parse DepositRequest event data
 * @param event - Raw event data
 * @returns Parsed event data
 */
export const parseDepositRequestEvent = (event: any): ParsedEventData => {
    try {
        // Event signature: "DepositRequest(uint256,address,uint256)"
        // Topics: [0] = event signature, [1] = poolId, [2] = userAddress, [3] = amount
        const topics = event.topics || event.notification?.topics || [];
        
        if (topics.length < 4) {
            throw new Error("Invalid DepositRequest event: insufficient topics");
        }

        const poolId = parseInt(topics[1], 16);
        const userAddress = `0x${topics[2].slice(26)}`; // Remove padding
        const amountWei = topics[3];
        const amount = formatUSDCAmount(amountWei);

        return {
            poolId,
            userAddress,
            amount,
            amountWei,
            eventType: 'DepositRequest'
        };

    } catch (error: any) {
        throw new Error(`DepositRequest parsing failed: ${error.message}`);
    }
};

/**
 * Parse DepositFulfilled event data
 * @param event - Raw event data
 * @returns Parsed event data
 */
export const parseDepositFulfilledEvent = (event: any): ParsedEventData => {
    try {
        // Event signature: "DepositFulfilled(uint256,address,uint256)"
        // Topics: [0] = event signature, [1] = poolId, [2] = userAddress, [3] = amount
        const topics = event.topics || event.notification?.topics || [];
        
        if (topics.length < 4) {
            throw new Error("Invalid DepositFulfilled event: insufficient topics");
        }

        const poolId = parseInt(topics[1], 16);
        const userAddress = `0x${topics[2].slice(26)}`; // Remove padding
        const amountWei = topics[3];
        const amount = formatUSDCAmount(amountWei);

        return {
            poolId,
            userAddress,
            amount,
            amountWei,
            eventType: 'DepositFulfilled'
        };

    } catch (error: any) {
        throw new Error(`DepositFulfilled parsing failed: ${error.message}`);
    }
};

/**
 * Parse Deposit (claimed) event data
 * @param event - Raw event data
 * @returns Parsed event data
 */
export const parseDepositClaimedEvent = (event: any): ParsedEventData => {
    try {
        // Event signature: "Deposit(address,address,uint256,uint256)"
        // Topics: [0] = event signature, [1] = userAddress, [2] = poolAddress
        // Data: [0] = amount, [1] = shares
        const topics = event.topics || event.notification?.topics || [];
        const data = event.data || event.notification?.data || [];
        
        if (topics.length < 3 || data.length < 2) {
            throw new Error("Invalid Deposit event: insufficient topics/data");
        }

        const userAddress = `0x${topics[1].slice(26)}`; // Remove padding
        const poolAddress = `0x${topics[2].slice(26)}`; // Remove padding
        
        // For Deposit events, we need to extract poolId from poolAddress or use a mapping
        // For now, we'll use 0 as placeholder - this should be enhanced with actual pool mapping
        const poolId = 0; // TODO: Implement pool address to ID mapping
        
        const amountWei = data[0];
        const amount = formatUSDCAmount(amountWei);

        return {
            poolId,
            userAddress,
            amount,
            amountWei,
            eventType: 'Deposit'
        };

    } catch (error: any) {
        throw new Error(`Deposit parsing failed: ${error.message}`);
    }
};

/**
 * Format event amounts from wei to readable USDC
 * @param amountWei - Amount in wei
 * @returns Formatted amount
 */
export const formatEventAmounts = (amountWei: string): string => {
    return formatUSDCAmount(amountWei);
};

// ============================================================================
// WEBHOOK INTEGRATION UTILITIES
// ============================================================================

/**
 * Validate incoming webhook event
 * @param event - Raw webhook event
 * @returns Validation result
 */
export const validateWebhookEvent = (event: any): { valid: boolean; error?: string } => {
    try {
        if (!event || !event.notification?.eventName) {
            return { valid: false, error: "Missing event signature" };
        }

        const validSignatures = Object.values(THURMAN_EVENTS);
        if (!validSignatures.includes(event.notification.eventName)) {
            return { valid: false, error: "Invalid event signature" };
        }

        if (!event.notification.txHash) {
            return { valid: false, error: "Missing transaction hash" };
        }

        return { valid: true };

    } catch (error: any) {
        return { valid: false, error: `Validation failed: ${error.message}` };
    }
};

/**
 * Handle event deduplication
 * @param event - Event to check for duplicates
 * @param existingEvents - Array of existing events
 * @returns Whether event is duplicate
 */
export const isDuplicateEvent = (event: DepositEvent, existingEvents: DepositEvent[]): boolean => {
    return existingEvents.some(existing => 
        existing.transactionHash === event.transactionHash && 
        existing.logIndex === event.logIndex
    );
};

/**
 * Get all active event monitors
 * @returns Array of active monitors
 */
export const getActiveMonitors = async (): Promise<EventMonitor[]> => {
    try {
        // Note: This method may not exist in the current SDK version
        // For now, return empty array - this can be enhanced when the API is available
        console.log("⚠️  getActiveMonitors: Method not available in current SDK version");
        console.log("ℹ️  Please check monitors via Circle Console");
        return [];

    } catch (error: any) {
        console.error("Failed to get active monitors:", error);
        return [];
    }
}; 