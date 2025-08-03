import express, { Router, Request, Response, NextFunction } from "express";
import { deployLoans, configurePoolSettings, getPoolIdFromTransaction, cleanupFailedPoolIds } from "../services/circle";
import { findByTransactionId, updateDeploymentStatus } from "../prisma/models";

const webhooksRouter: Router = express.Router();

// Map to store active SSE connections
const connectionMap = new Map<string, Response>();

// Helper function to broadcast updates to all connected clients
const broadcastToClients = (eventData: any) => {
    const eventString = `data: ${JSON.stringify(eventData)}\n\n`;
    connectionMap.forEach((connection, connectionId) => {
        try {
            connection.write(eventString);
        } catch (error) {
            console.error(`Error broadcasting to connection ${connectionId}:`, error);
            // Remove failed connection
            cleanupConnection(connectionId);
        }
    });
};

// Helper function to cleanup connection
const cleanupConnection = (connectionId: string) => {
    if (connectionMap.has(connectionId)) {
        connectionMap.delete(connectionId);
        console.log(`Connection ${connectionId} cleaned up`);
    }
};

// GET /api/webhooks/circle - SSE endpoint for real-time updates
webhooksRouter.get("/circle", (req: Request, res: Response) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Generate unique connection ID
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add connection to map
    connectionMap.set(connectionId, res);
    console.log(`New SSE connection established: ${connectionId}`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

    // Send periodic heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
            console.error(`Error sending heartbeat to ${connectionId}:`, error);
            clearInterval(heartbeatInterval);
            cleanupConnection(connectionId);
        }
    }, 30000); // Send heartbeat every 30 seconds

    // Handle client disconnect
    req.on('close', () => {
        console.log(`SSE connection closed: ${connectionId}`);
        clearInterval(heartbeatInterval);
        cleanupConnection(connectionId);
    });

    // Handle connection error
    req.on('error', (error) => {
        console.error(`SSE connection error for ${connectionId}:`, error);
        clearInterval(heartbeatInterval);
        cleanupConnection(connectionId);
    });
});

// POST /api/webhooks/circle - Enhanced two-phase deployment webhook handler
webhooksRouter.post("/circle", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = req.body;
        
        // Handle Circle test webhooks
        if (notification.notificationType === 'webhooks.test') {
            console.log("Processing Circle test webhook");
            return res.status(200).json({
                success: true,
                message: "Test webhook received successfully",
                timestamp: notification.timestamp,
                notificationId: notification.notificationId
            });
        }

        // Handle actual transaction webhooks
        const transactionData = notification.notification;
        
        if (!transactionData || !transactionData.id || !transactionData.state) {
            return res.status(400).json({
                success: false,
                error: "Invalid webhook notification - missing transaction data"
            });
        }

        console.log(`Processing transaction webhook: ${transactionData.id} - ${transactionData.state}`);

        // Phase 1: Check for pool creation transaction
        const poolCreationPool = await findByTransactionId(transactionData.id);
        console.log(`Pool creation pool found:`, poolCreationPool ? `Pool ID ${poolCreationPool.id}` : 'No pool found');

        if (poolCreationPool && poolCreationPool.pool_creation_tx_id === transactionData.id && transactionData.state === 'CONFIRMED') {
            console.log(`Pool creation confirmed for pool ${poolCreationPool.id}`);
            
            // Parse the actual blockchain pool ID from the transaction
            const blockchainPoolId = await getPoolIdFromTransaction(transactionData.txHash);
            
            if (blockchainPoolId === null) {
                console.error(`Failed to parse pool ID from transaction ${transactionData.txHash}`);
                // Fallback to using database ID as pool ID
                const fallbackPoolId = poolCreationPool.id;
                console.log(`Using fallback pool ID: ${fallbackPoolId}`);
                
                await updateDeploymentStatus({
                    poolId: poolCreationPool.id,
                    status: 'POOL_CREATED',
                    txData: { 
                        pool_creation_tx_hash: transactionData.txHash,
                        pool_id: fallbackPoolId
                    }
                });
            } else {
                console.log(`Parsed blockchain pool ID: ${blockchainPoolId}`);
                
                // Update pool status to POOL_CREATED with correct blockchain pool ID
                await updateDeploymentStatus({
                    poolId: poolCreationPool.id,
                    status: 'POOL_CREATED',
                    txData: { 
                        pool_creation_tx_hash: transactionData.txHash,
                        pool_id: blockchainPoolId
                    }
                });
            }

            // Phase 2: Configure pool settings (enable borrowing)
            const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
            if (!poolManagerAddress) {
                throw new Error("Missing POOL_MANAGER_ADDRESS environment variable");
            }

            // Use the blockchain pool ID (either parsed or fallback)
            const poolIdToUse = blockchainPoolId !== null ? blockchainPoolId : poolCreationPool.id;

            const configResult = await configurePoolSettings({
                poolId: poolIdToUse,
                adminWalletId: poolCreationPool.deployed_by_wallet_id || '',
                poolManagerAddress
            });

            if (configResult.success) {
                await updateDeploymentStatus({
                    poolId: poolCreationPool.id,
                    status: 'CONFIGURING_POOL',
                    txData: { pool_config_tx_id: configResult.transactionId }
                });

                // Broadcast update
                broadcastToClients({
                    type: 'deployment_update',
                    poolId: poolCreationPool.id,
                    status: 'CONFIGURING_POOL',
                    txHash: transactionData.txHash
                });
            } else {
                throw new Error(`Failed to configure pool settings: ${configResult.error}`);
            }
        }

        // Phase 2: Check for pool configuration transaction
        const configPool = await findByTransactionId(transactionData.id);
        console.log(`Pool configuration pool found:`, configPool ? `Pool ID ${configPool.id}` : 'No pool found');

        if (configPool && configPool.pool_config_tx_id === transactionData.id && transactionData.state === 'CONFIRMED') {
            console.log(`Pool configuration confirmed for pool ${configPool.id}`);
            
            await updateDeploymentStatus({
                poolId: configPool.id,
                status: 'POOL_CONFIGURED',
                txData: { 
                    pool_config_tx_hash: transactionData.txHash
                }
            });

            // Phase 3: Deploy loans
            const loanData = JSON.parse(configPool.loan_data);
            const originatorAddress = loanData[0]?.originator_address;
            
            if (!originatorAddress) {
                throw new Error("Missing originator address in loan data");
            }

            const poolManagerAddress = process.env.POOL_MANAGER_ADDRESS;
            if (!poolManagerAddress) {
                throw new Error("Missing POOL_MANAGER_ADDRESS environment variable");
            }

            const loanDeployment = await deployLoans({
                loanData,
                poolId: configPool.pool_id || configPool.id,
                adminWalletId: configPool.deployed_by_wallet_id || '',
                poolManagerAddress,
                originatorAddress
            });

            if (loanDeployment.success) {
                await updateDeploymentStatus({
                    poolId: configPool.id,
                    status: 'DEPLOYING_LOANS',
                    txData: { loans_creation_tx_id: loanDeployment.transactionId }
                });

                // Broadcast update
                broadcastToClients({
                    type: 'deployment_update',
                    poolId: configPool.id,
                    status: 'DEPLOYING_LOANS',
                    txHash: transactionData.txHash
                });
            } else {
                throw new Error(`Failed to deploy loans: ${loanDeployment.error}`);
            }
        }

        // Phase 3: Check for loan deployment transaction
        const loanDeploymentPool = await findByTransactionId(transactionData.id);
        console.log(`Loan deployment pool found:`, loanDeploymentPool ? `Pool ID ${loanDeploymentPool.id}` : 'No pool found');

        if (loanDeploymentPool && loanDeploymentPool.loans_creation_tx_id === transactionData.id && transactionData.state === 'CONFIRMED') {
            console.log(`Loan deployment confirmed for pool ${loanDeploymentPool.id}`);
            
            await updateDeploymentStatus({
                poolId: loanDeploymentPool.id,
                status: 'DEPLOYED',
                txData: { 
                    loans_creation_tx_hash: transactionData.txHash
                }
            });

            // Broadcast completion
            broadcastToClients({
                type: 'deployment_complete',
                poolId: loanDeploymentPool.id,
                status: 'DEPLOYED',
                txHash: transactionData.txHash
            });
        }

        // Handle failures for all phases
        if (transactionData.state === 'FAILED') {
            const failedPool = poolCreationPool || configPool || loanDeploymentPool;
            if (failedPool) {
                await updateDeploymentStatus({
                    poolId: failedPool.id,
                    status: 'FAILED',
                    txData: {}
                });

                // Clean up failed pool IDs to prevent future pool ID gaps
                await cleanupFailedPoolIds();

                broadcastToClients({
                    type: 'deployment_failed',
                    poolId: failedPool.id,
                    status: 'FAILED',
                    error: transactionData.error
                });
            }
        }

        // If no pool was found for this transaction, log it but don't fail
        if (!poolCreationPool && !loanDeploymentPool) {
            console.log(`No pool found for transaction ${transactionData.id} - this might be a test transaction or unrelated transaction`);
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Webhook error:", error);
        next(error);
    }
});

// GET /api/webhooks/status - Get current connection status (for debugging)
webhooksRouter.get("/status", (req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        data: {
            activeConnections: connectionMap.size,
            connectionIds: Array.from(connectionMap.keys())
        }
    });
});

export default webhooksRouter; 