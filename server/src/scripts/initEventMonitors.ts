import { initializeEventMonitors } from '../services/eventMonitoring';

/**
 * Initialize Circle Event Monitors
 * This script should be run on server startup to ensure all event monitors are active
 */
export const initEventMonitors = async (): Promise<void> => {
    try {
        console.log("🚀 Initializing Circle Event Monitors...");
        
        const result = await initializeEventMonitors();
        
        if (result.success) {
            console.log("✅ Event monitors initialized successfully");
            console.log("📊 Monitor Status:");
            
            if (result.monitors) {
                Object.entries(result.monitors).forEach(([eventSignature, monitorId]) => {
                    console.log(`  - ${eventSignature}: ${monitorId}`);
                });
            }
        } else {
            console.error("❌ Failed to initialize event monitors:", result.error);
        }
        
    } catch (error: any) {
        console.error("❌ Event monitor initialization failed:", error);
    }
};

// Run initialization if this script is executed directly
if (require.main === module) {
    initEventMonitors()
        .then(() => {
            console.log("🎉 Event monitor initialization completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Event monitor initialization failed:", error);
            process.exit(1);
        });
} 