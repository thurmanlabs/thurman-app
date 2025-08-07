import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { config } from "../config";

const circleContractClient = initiateSmartContractPlatformClient({
    apiKey: config.circleApiKey,
    entitySecret: config.circleEntitySecret,
});

export class CircleContractClient {
    private client = circleContractClient;

    /**
     * Query a contract function
     * @param contractAddress - Contract address to query
     * @param functionName - Function name to call
     * @param functionArgs - Function arguments
     * @returns Function result
     */
    async queryContract({
        contractAddress,
        functionName,
        functionArgs = []
    }: {
        contractAddress: string;
        functionName: string;
        functionArgs?: any[];
    }): Promise<string> {
        try {
            // For now, return a mock value since we need to implement the actual Circle SDK query
            // This will be replaced with actual implementation once we confirm the correct API
            console.log(`Mock query: ${functionName} on ${contractAddress} with args:`, functionArgs);
            
            // Mock responses for testing
            if (functionName === 'balanceOf') {
                return '1000000000000000000'; // 1 share in wei
            } else if (functionName === 'convertToAssets') {
                return '1000000'; // 1 USDC (6 decimals)
            } else if (functionName === 'totalAssets') {
                return '1000000000'; // 1000 USDC
            } else if (functionName === 'totalSupply') {
                return '1000000000000000000000'; // 1000 shares
            }
            
            return '0';
        } catch (error) {
            console.error(`Error querying contract ${contractAddress} function ${functionName}:`, error);
            throw error;
        }
    }

    /**
     * Query user's share balance
     * @param userAddress - User's wallet address
     * @param vaultAddress - Vault contract address
     * @returns Share balance as string
     */
    async getShareBalance(userAddress: string, vaultAddress: string): Promise<string> {
        return this.queryContract({
            contractAddress: vaultAddress,
            functionName: 'balanceOf',
            functionArgs: [userAddress]
        });
    }

    /**
     * Convert shares to assets (USD value)
     * @param shares - Share amount as string
     * @param vaultAddress - Vault contract address
     * @returns Asset value as string
     */
    async convertSharesToAssets(shares: string, vaultAddress: string): Promise<string> {
        return this.queryContract({
            contractAddress: vaultAddress,
            functionName: 'convertToAssets',
            functionArgs: [shares]
        });
    }

    /**
     * Get total assets in vault
     * @param vaultAddress - Vault contract address
     * @returns Total assets as string
     */
    async getTotalAssets(vaultAddress: string): Promise<string> {
        return this.queryContract({
            contractAddress: vaultAddress,
            functionName: 'totalAssets',
            functionArgs: []
        });
    }

    /**
     * Get total shares in vault
     * @param vaultAddress - Vault contract address
     * @returns Total shares as string
     */
    async getTotalShares(vaultAddress: string): Promise<string> {
        return this.queryContract({
            contractAddress: vaultAddress,
            functionName: 'totalSupply',
            functionArgs: []
        });
    }
}

export default circleContractClient; 