import { parseUnits } from "ethers";

// ============================================================================
// PARAMETER FORMATTING UTILITIES
// ============================================================================

/**
 * Convert USDC amount to 6-decimal wei format
 * @param amount - Human readable USDC amount (e.g., "100.50")
 * @returns Formatted amount as string for contract calls
 */
export const parseUSDCAmount = (amount: string): string => {
    try {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid USDC amount: ${amount}`);
        }
        return parseUnits(amount, 6).toString();
    } catch (error) {
        throw new Error(`Failed to parse USDC amount ${amount}: ${error}`);
    }
};

/**
 * Format pool ID as uint16 string
 * @param poolId - Pool ID number
 * @returns Formatted pool ID as string
 */
export const formatPoolId = (poolId: number): string => {
    if (!Number.isInteger(poolId) || poolId < 0 || poolId > 65535) {
        throw new Error(`Invalid pool ID: ${poolId}. Must be uint16 (0-65535)`);
    }
    return poolId.toString();
};

/**
 * Validate and format Ethereum address
 * @param address - Ethereum address
 * @returns Formatted address (lowercase)
 */
export const formatAddress = (address: string): string => {
    if (!address || typeof address !== 'string') {
        throw new Error(`Invalid address: ${address}`);
    }
    
    // Basic Ethereum address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
        throw new Error(`Invalid Ethereum address format: ${address}`);
    }
    
    return address.toLowerCase();
};

/**
 * Validate and format multiple addresses
 * @param addresses - Array of Ethereum addresses
 * @returns Array of formatted addresses
 */
export const formatAddresses = (addresses: string[]): string[] => {
    return addresses.map(address => formatAddress(address));
};

/**
 * Convert wei amount back to human readable USDC
 * @param weiAmount - Amount in wei (6 decimals)
 * @returns Human readable USDC amount
 */
export const formatUSDCAmount = (weiAmount: string): string => {
    try {
        const amount = parseFloat(weiAmount) / Math.pow(10, 6);
        return amount.toFixed(2);
    } catch (error) {
        throw new Error(`Failed to format USDC amount ${weiAmount}: ${error}`);
    }
};

/**
 * Validate USDC amount is within reasonable bounds
 * @param amount - USDC amount in human readable format
 * @param minAmount - Minimum allowed amount (default: 0.01)
 * @param maxAmount - Maximum allowed amount (default: 1000000)
 * @returns True if valid
 */
export const validateUSDCAmount = (
    amount: string, 
    minAmount: number = 0.01, 
    maxAmount: number = 1000000
): boolean => {
    try {
        const parsedAmount = parseFloat(amount);
        return !isNaN(parsedAmount) && parsedAmount >= minAmount && parsedAmount <= maxAmount;
    } catch {
        return false;
    }
}; 