import { CircleContractClient } from '../utils/circleContractClient';
import { getDeployedPools } from './poolData';
import { getUserDepositStatus } from './depositStateManager';

// Types
export interface PortfolioPosition {
  poolId: number;
  poolName: string;
  vaultAddress: string;
  assetAddress: string;
  sharesOwned: string;
  currentValue: number;
  totalInvested: number;
  totalClaimed: number;
  pendingAmount: number;
  claimableAmount: number;
  returnAmount: number;
  returnPercentage: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  userAddress: string;
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  totalPositions: number;
  activePositions: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
}

export interface PortfolioCache {
  data: PortfolioSummary;
  timestamp: number;
  expiresAt: number;
}

// Cache for portfolio data (30 seconds)
const portfolioCache = new Map<string, PortfolioCache>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

/**
 * Get user's complete portfolio data
 * @param userAddress - User's wallet address
 * @returns Portfolio summary with all positions and calculations
 */
export async function getUserPortfolio(userAddress: string): Promise<PortfolioSummary> {
  try {
    // Check cache first
    const cached = portfolioCache.get(userAddress);
    if (cached && Date.now() < cached.expiresAt) {
      console.info(`Portfolio cache hit for user: ${userAddress}`);
      return cached.data;
    }

    console.info(`Fetching portfolio data for user: ${userAddress}`);

    // Get all deployed pools
    const poolDataResponse = await getDeployedPools();
    const deployedPools = poolDataResponse.pools;
    
    if (!deployedPools || deployedPools.length === 0) {
      console.warn('No deployed pools found for portfolio calculation');
      return createEmptyPortfolio(userAddress);
    }

    // Initialize portfolio data
    const positions: PortfolioPosition[] = [];
    let totalInvested = 0;
    let currentValue = 0;
    let activePositions = 0;

    // Process each pool
    for (const pool of deployedPools) {
      try {
        const position = await getPoolPosition(userAddress, pool);
        
        if (position) {
          positions.push(position);
          
          // Add to totals
          totalInvested += position.totalInvested;
          currentValue += position.currentValue;
          
          if (position.sharesOwned !== '0' || position.pendingAmount > 0 || position.claimableAmount > 0) {
            activePositions++;
          }
        }
      } catch (error) {
        console.error(`Error processing pool ${pool.id} for user ${userAddress}:`, error);
        // Continue with other pools even if one fails
      }
    }

    // Calculate portfolio summary
    const totalReturn = currentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const portfolio: PortfolioSummary = {
      userAddress,
      totalInvested,
      currentValue,
      totalReturn,
      returnPercentage,
      totalPositions: deployedPools.length,
      activePositions,
      positions,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    portfolioCache.set(userAddress, {
      data: portfolio,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    });

    console.info(`Portfolio calculated for user ${userAddress}: ${activePositions} active positions, $${currentValue.toFixed(2)} current value`);
    return portfolio;

  } catch (error: any) {
    console.error(`Error getting portfolio for user ${userAddress}:`, error);
    throw new Error(`Failed to get portfolio data: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get user's position in a specific pool
 * @param userAddress - User's wallet address
 * @param pool - Pool data
 * @returns Portfolio position or null if no position
 */
async function getPoolPosition(userAddress: string, pool: any): Promise<PortfolioPosition | null> {
  try {
    // Get user's deposit status from in-memory state
    const depositStatus = getUserDepositStatus(pool.id, userAddress);
    
    // Query user's share balance using Circle SDK
    const sharesOwned = await getShareBalance(userAddress, pool.vault);
    
    // Convert shares to current USD value
    const currentValue = await convertSharesToUSD(sharesOwned, pool.vault);
    
    // Calculate position metrics
    const totalInvested = depositStatus?.claimed || 0;
    const totalClaimed = depositStatus?.claimed || 0;
    const pendingAmount = depositStatus?.pending || 0;
    const claimableAmount = depositStatus?.claimable || 0;
    
    const returnAmount = currentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (returnAmount / totalInvested) * 100 : 0;

    return {
      poolId: pool.id,
      poolName: pool.name,
      vaultAddress: pool.vault,
      assetAddress: pool.asset,
      sharesOwned,
      currentValue,
      totalInvested,
      totalClaimed,
      pendingAmount,
      claimableAmount,
      returnAmount,
      returnPercentage,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error getting position for pool ${pool.id}, user ${userAddress}:`, error);
    return null;
  }
}

/**
 * Query user's share balance using Circle SDK
 * @param userAddress - User's wallet address
 * @param vaultAddress - Vault contract address
 * @returns Share balance as string
 */
async function getShareBalance(userAddress: string, vaultAddress: string): Promise<string> {
  try {
    const circleClient = new CircleContractClient();
    
    // Query balanceOf function on vault contract
    const balance = await circleClient.queryContract({
      contractAddress: vaultAddress,
      functionName: 'balanceOf',
      functionArgs: [userAddress]
    });

    return balance || '0';
  } catch (error) {
    console.error(`Error querying share balance for ${userAddress} on vault ${vaultAddress}:`, error);
    return '0';
  }
}

/**
 * Convert shares to current USD value using Circle SDK
 * @param shares - Share balance as string
 * @param vaultAddress - Vault contract address
 * @returns Current USD value
 */
async function convertSharesToUSD(shares: string, vaultAddress: string): Promise<number> {
  try {
    if (!shares || shares === '0') {
      return 0;
    }

    const circleClient = new CircleContractClient();
    
    // Use convertToAssets to get current USD value
    const assetsValue = await circleClient.queryContract({
      contractAddress: vaultAddress,
      functionName: 'convertToAssets',
      functionArgs: [shares]
    });

    // Convert from wei to USD (assuming 6 decimals for USDC)
    const valueInUSD = parseFloat(assetsValue || '0') / Math.pow(10, 6);
    return valueInUSD;

  } catch (error) {
    console.error(`Error converting shares to USD for vault ${vaultAddress}:`, error);
    return 0;
  }
}

/**
 * Create empty portfolio for users with no positions
 * @param userAddress - User's wallet address
 * @returns Empty portfolio summary
 */
function createEmptyPortfolio(userAddress: string): PortfolioSummary {
  return {
    userAddress,
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    returnPercentage: 0,
    totalPositions: 0,
    activePositions: 0,
    positions: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Clear portfolio cache for a specific user
 * @param userAddress - User's wallet address
 */
export function clearPortfolioCache(userAddress: string): void {
  portfolioCache.delete(userAddress);
  console.info(`Portfolio cache cleared for user: ${userAddress}`);
}

/**
 * Clear all portfolio cache
 */
export function clearAllPortfolioCache(): void {
  portfolioCache.clear();
  console.info('All portfolio cache cleared');
}

/**
 * Get cache statistics
 * @returns Cache statistics
 */
export function getPortfolioCacheStats(): { size: number; entries: Array<{ user: string; expiresAt: number }> } {
  const entries = Array.from(portfolioCache.entries()).map(([user, cache]) => ({
    user,
    expiresAt: cache.expiresAt
  }));

  return {
    size: portfolioCache.size,
    entries
  };
}

/**
 * Validate user address format
 * @param userAddress - User's wallet address
 * @returns True if valid
 */
export function isValidUserAddress(userAddress: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(userAddress);
}

/**
 * Format currency values
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values
 * @param value - Numeric percentage
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
} 