import express, { Router, Request, Response, NextFunction } from "express";
import { handleDeploymentWebhook } from "../services/loanPool";

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

// POST /api/webhooks/circle - Circle webhook receiver
webhooksRouter.post("/circle", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = req.body;
        
        // Validate notification has required fields
        if (!notification || !notification.transactionId || !notification.state) {
            console.error("Invalid webhook notification:", notification);
            return res.status(400).json({
                success: false,
                error: "Invalid webhook notification",
                message: "Missing required fields: transactionId, state"
            });
        }

        console.log(`Processing Circle webhook for transaction ${notification.transactionId} with state ${notification.state}`);

        // Convert Circle webhook format to our internal format
        const webhookNotification = {
            transactionId: notification.transactionId,
            status: notification.state, // Map 'state' to 'status'
            txHash: notification.txHash,
            error: notification.error
        };

        // Use LoanPoolService for business logic
        await handleDeploymentWebhook(webhookNotification);

        // Prepare event data for SSE broadcast
        const eventData = {
            type: 'deployment_update',
            transactionId: notification.transactionId,
            status: notification.state, // Use 'status' for consistency
            timestamp: Date.now(),
            txHash: notification.txHash,
            error: notification.error
        };

        // Broadcast update to all connected SSE clients
        broadcastToClients(eventData);

        console.log(`Webhook processed successfully for transaction ${notification.transactionId}`);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully"
        });

    } catch (error: any) {
        console.error("Error processing Circle webhook:", error);
        
        // Prepare error event for SSE broadcast
        const errorEventData = {
            type: 'deployment_error',
            transactionId: req.body?.transactionId,
            error: error.message,
            timestamp: Date.now()
        };
        
        broadcastToClients(errorEventData);

        // Pass error to error handler middleware
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