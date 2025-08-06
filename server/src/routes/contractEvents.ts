/**
 * Contract Events Webhook Endpoint
 * 
 * Processes Circle contract event notifications and updates deposit state
 */

import express, { Router, Request, Response } from "express";
import {
  updateDepositState,
  DepositEvent,
  validateDepositEvent
} from "../services/depositStateManager";

var contractEventsRouter: Router = express.Router();

// Configuration - these should come from environment variables
const POOL_MANAGER_CONTRACT_ADDRESS = process.env.POOL_MANAGER_CONTRACT_ADDRESS?.toLowerCase();

// TypeScript interfaces for Circle webhook data
interface CircleEventNotification {
  notificationType: string;
  version: number;
  customAttributes?: Record<string, any>;
  contractEvent?: {
    contractAddress: string;
    blockNumber: string;
    transactionHash: string;
    eventName: string;
    topics: string[];
    data: string;
    logIndex: string;
    transactionIndex: string;
  };
}

interface ProcessedEventData {
  poolId: number;
  userAddress: string;
  amount: string;
  eventType: "REQUESTED" | "FULFILLED" | "CLAIMED";
  txHash: string;
  blockNumber: number;
}

// Data Conversion Utilities

/**
 * Convert hex topic to number (for poolId)
 */
function parseHexToNumber(hexValue: string): number {
  if (!hexValue || !hexValue.startsWith("0x")) {
    throw new Error(`Invalid hex value: ${hexValue}`);
  }
  return parseInt(hexValue, 16);
}

/**
 * Convert hex topic to Ethereum address
 */
function parseHexToAddress(hexValue: string): string {
  if (!hexValue || !hexValue.startsWith("0x")) {
    throw new Error(`Invalid hex value: ${hexValue}`);
  }
  
  // Remove 0x prefix and pad to 64 characters if needed
  const hex = hexValue.slice(2).padStart(64, "0");
  
  // Extract last 40 characters (20 bytes) for address
  const address = "0x" + hex.slice(-40);
  
  return address.toLowerCase();
}

/**
 * Extract amount from event data (handle USDC 6 decimals)
 */
function parseEventAmount(dataHex: string): string {
  if (!dataHex || !dataHex.startsWith("0x")) {
    throw new Error(`Invalid data hex: ${dataHex}`);
  }
  
  // Remove 0x prefix
  const hex = dataHex.slice(2);
  
  // Parse as big integer to handle large numbers
  const amountWei = BigInt("0x" + hex);
  
  // Convert from wei (assuming 6 decimals for USDC)
  const amount = Number(amountWei) / Math.pow(10, 6);
  
  return amount.toString();
}

/**
 * Map Circle event names to our internal types
 */
function getEventTypeFromName(eventName: string): "REQUESTED" | "FULFILLED" | "CLAIMED" | null {
  const eventMap: Record<string, "REQUESTED" | "FULFILLED" | "CLAIMED"> = {
    "DepositRequest": "REQUESTED",
    "DepositRequested": "REQUESTED",
    "DepositFulfilled": "FULFILLED",
    "DepositFulfillment": "FULFILLED",
    "Deposit": "CLAIMED",
    "SharesClaimed": "CLAIMED",
    "Claim": "CLAIMED"
  };
  
  return eventMap[eventName] || null;
}

// Event Processing Pipeline

/**
 * Process Circle contract event notification
 */
function processContractEvent(notification: CircleEventNotification): ProcessedEventData | null {
  const contractEvent = notification.contractEvent;
  
  if (!contractEvent) {
    console.log("No contract event data in notification");
    return null;
  }
  
  console.log("Processing contract event:", {
    eventName: contractEvent.eventName,
    txHash: contractEvent.transactionHash,
    blockNumber: contractEvent.blockNumber
  });
  
  // Check if this is from our PoolManager contract
  if (POOL_MANAGER_CONTRACT_ADDRESS && 
      contractEvent.contractAddress.toLowerCase() !== POOL_MANAGER_CONTRACT_ADDRESS) {
    console.log(`Ignoring event from different contract: ${contractEvent.contractAddress}`);
    return null;
  }
  
  // Determine event type
  const eventType = getEventTypeFromName(contractEvent.eventName);
  if (!eventType) {
    console.log(`Unsupported event type: ${contractEvent.eventName}`);
    return null;
  }
  
  try {
    // Parse event data based on expected format
    // Assuming topics format: [eventSignature, poolId, userAddress]
    // and data contains the amount
    
    if (contractEvent.topics.length < 3) {
      throw new Error(`Insufficient topics. Expected at least 3, got ${contractEvent.topics.length}`);
    }
    
    const poolId = parseHexToNumber(contractEvent.topics[1]);
    const userAddress = parseHexToAddress(contractEvent.topics[2]);
    const amount = parseEventAmount(contractEvent.data);
    const blockNumber = parseHexToNumber(contractEvent.blockNumber);
    
    return {
      poolId,
      userAddress,
      amount,
      eventType,
      txHash: contractEvent.transactionHash,
      blockNumber
    };
    
  } catch (error) {
    console.error("Error parsing contract event:", error);
    throw error;
  }
}

/**
 * Convert processed event data to DepositEvent
 */
function createDepositEvent(eventData: ProcessedEventData): DepositEvent {
  return {
    type: eventData.eventType,
    poolId: eventData.poolId,
    userAddress: eventData.userAddress,
    amount: eventData.amount,
    txHash: eventData.txHash,
    timestamp: new Date()
  };
}

// Webhook Endpoint

/**
 * POST /webhook - Circle contract event notifications
 */
contractEventsRouter.post("/webhook", async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    console.log("Received webhook notification:", {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Validate notification format
    const notification: CircleEventNotification = req.body;
    
    if (!notification || typeof notification !== "object") {
      console.error("Invalid notification format: not an object");
      return res.status(400).json({
        error: "Invalid notification format",
        message: "Request body must be a valid JSON object"
      });
    }
    
    // Check notification type
    if (notification.notificationType !== "contracts.eventLog") {
      console.log(`Ignoring notification type: ${notification.notificationType}`);
      return res.status(200).json({
        message: "Notification acknowledged",
        processed: false,
        reason: "Unsupported notification type"
      });
    }
    
    // Handle test webhooks
    if (!notification.contractEvent) {
      console.log("Received test webhook or notification without contract event");
      return res.status(200).json({
        message: "Test webhook acknowledged",
        processed: false,
        reason: "No contract event data"
      });
    }
    
    // Process the contract event
    let processedEvent: ProcessedEventData | null = null;
    
    try {
      processedEvent = processContractEvent(notification);
    } catch (error) {
      console.error("Error processing contract event:", error);
      return res.status(400).json({
        error: "Invalid event data",
        message: error instanceof Error ? error.message : "Unknown processing error"
      });
    }
    
    if (!processedEvent) {
      console.log("Event not processed (filtered out or unsupported)");
      return res.status(200).json({
        message: "Notification acknowledged",
        processed: false,
        reason: "Event filtered or unsupported"
      });
    }
    
    // Create deposit event and update state
    const depositEvent = createDepositEvent(processedEvent);
    
    // Validate the deposit event before processing
    if (!validateDepositEvent(depositEvent)) {
      console.error("Invalid deposit event:", depositEvent);
      return res.status(400).json({
        error: "Invalid deposit event data",
        message: "Event data failed validation"
      });
    }
    
    try {
      // Update in-memory state
      updateDepositState(depositEvent);
      
      console.log("Successfully processed deposit event:", {
        type: depositEvent.type,
        poolId: depositEvent.poolId,
        userAddress: depositEvent.userAddress,
        amount: depositEvent.amount,
        txHash: depositEvent.txHash,
        processingTime: Date.now() - startTime
      });
      
      return res.status(200).json({
        message: "Event processed successfully",
        processed: true,
        event: {
          type: depositEvent.type,
          poolId: depositEvent.poolId,
          userAddress: depositEvent.userAddress,
          amount: depositEvent.amount,
          txHash: depositEvent.txHash
        }
      });
      
    } catch (stateError) {
      console.error("Error updating deposit state:", stateError);
      
      // Return 200 to acknowledge webhook but log the state error
      // This prevents Circle from retrying the webhook
      return res.status(200).json({
        message: "Webhook acknowledged with processing error",
        processed: false,
        error: stateError instanceof Error ? stateError.message : "State update failed"
      });
    }
    
  } catch (error) {
    console.error("Unexpected error in webhook handler:", error);
    
    const processingTime = Date.now() - startTime;
    
    // Return 500 for unexpected errors to trigger Circle retry if appropriate
    return res.status(500).json({
      error: "Internal server error",
      message: "Unexpected error processing webhook",
      processingTime
    });
  }
});

// Health check endpoint for webhook monitoring
contractEventsRouter.get("/webhook/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    message: "Contract events webhook is operational",
    timestamp: new Date().toISOString(),
    config: {
      poolManagerContract: POOL_MANAGER_CONTRACT_ADDRESS || "not configured"
    }
  });
});

// Debug endpoint to get recent webhook activity (only in development)
if (process.env.NODE_ENV === "development") {
  const recentWebhooks: any[] = [];
  const MAX_RECENT_WEBHOOKS = 50;
  
  // Middleware to track recent webhooks
  contractEventsRouter.use("/webhook", (req: Request, res: Response, next: express.NextFunction) => {
    recentWebhooks.unshift({
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
      body: req.body,
      processed: false // Will be updated in the main handler
    });
    
    // Keep only recent webhooks
    if (recentWebhooks.length > MAX_RECENT_WEBHOOKS) {
      recentWebhooks.splice(MAX_RECENT_WEBHOOKS);
    }
    
    next();
  });
  
  contractEventsRouter.get("/webhook/debug", (req: Request, res: Response) => {
    res.status(200).json({
      recentWebhooks: recentWebhooks.slice(0, 20), // Return last 20
      totalTracked: recentWebhooks.length
    });
  });
}

export default contractEventsRouter; 