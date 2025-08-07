/**
 * Pool Data Service
 * 
 * Fetches deployed pool data from database instead of contract calls
 */

import { LoanPool } from "../prisma/models/loanPool";
import { formatUnits } from "ethers";

// Configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// TypeScript Interfaces
export interface PoolConfig {
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  maxDepositAmount: string;
  minDepositAmount: string;
  depositCap: string;
}

export interface PoolData {
  id: number;
  name: string;
  vault: string;
  asset: string;
  totalAssets: string;
  totalShares: string;
  availableCapacity: string;
  config: PoolConfig;
  lastUpdated: Date;
  status: string;
  description?: string;
  targetAmount?: string;
  minimumInvestment?: string;
  expectedReturn?: string;
  maturityDate?: Date;
  purpose?: string;
  geographicFocus?: string;
  borrowerProfile?: string;
  collateralType?: string;
  loanTermRange?: string;
  interestRateRange?: string;
  totalLoans: number;
  totalPrincipal: string;
  avgInterestRate: string;
  avgTermMonths: number;
  creator: {
    id: number;
    email: string | null;
    role: string;
  };
}

export interface PoolDataResponse {
  pools: PoolData[];
  totalPools: number;
  successfullyLoaded: number;
  failedToLoad: number;
  lastUpdated: Date;
  cached: boolean;
}

// Cache Management
interface CacheEntry {
  data: PoolDataResponse;
  timestamp: number;
}

let poolDataCache: CacheEntry | null = null;

/**
 * Clear the pool data cache
 */
export function clearPoolDataCache(): void {
  poolDataCache = null;
  console.log("Pool data cache cleared");
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry: CacheEntry): boolean {
  const now = Date.now();
  const cacheAge = now - cacheEntry.timestamp;
  return cacheAge < CACHE_DURATION_MS;
}

/**
 * Get cached pool data if valid
 */
function getCachedPoolData(): PoolDataResponse | null {
  if (!poolDataCache) {
    return null;
  }

  if (!isCacheValid(poolDataCache)) {
    console.log("Pool data cache expired, clearing");
    poolDataCache = null;
    return null;
  }

  console.log("Returning cached pool data");
  return {
    ...poolDataCache.data,
    cached: true
  };
}

/**
 * Cache pool data response
 */
function cachePoolData(data: PoolDataResponse): void {
  poolDataCache = {
    data: { ...data, cached: false },
    timestamp: Date.now()
  };
  console.log(`Cached pool data for ${data.pools.length} pools`);
}

// Data Processing Functions

/**
 * Format USDC amount (6 decimals) to human readable string
 */
function formatUSDCAmount(amount: string | number | null): string {
  try {
    if (!amount) return "0.00";
    const amountStr = amount.toString();
    const amountBN = BigInt(amountStr);
    const divisor = BigInt(10 ** 6);
    const dollars = Number(amountBN / divisor);
    const cents = Number((amountBN % divisor) * BigInt(100) / divisor);
    return (dollars + cents / 100).toFixed(2);
  } catch (error) {
    console.error("Error formatting USDC amount:", error);
    return "0.00";
  }
}

/**
 * Format share amount (18 decimals) to human readable string
 */
function formatShareAmount(amount: string | number | null): string {
  try {
    if (!amount) return "0.000000";
    const amountStr = amount.toString();
    const amountBN = BigInt(amountStr);
    const divisor = BigInt(10 ** 18);
    const shares = Number(amountBN) / Number(divisor);
    return shares.toFixed(6);
  } catch (error) {
    console.error("Error formatting share amount:", error);
    return "0.000000";
  }
}

/**
 * Calculate available deposit capacity
 */
function calculateAvailableCapacity(config: PoolConfig, totalAssets: string): string {
  try {
    const depositCap = BigInt(config.depositCap);
    const currentAssets = BigInt(totalAssets);
    const available = depositCap > currentAssets ? depositCap - currentAssets : BigInt(0);
    return available.toString();
  } catch (error) {
    console.error("Error calculating available capacity:", error);
    return "0";
  }
}

/**
 * Generate default pool configuration
 */
function getDefaultPoolConfig(): PoolConfig {
  return {
    depositsEnabled: true,
    withdrawalsEnabled: true,
    maxDepositAmount: "1000000000000", // 1M USDC (6 decimals)
    minDepositAmount: "1000000", // 1 USDC (6 decimals)
    depositCap: "100000000000000" // 100M USDC (6 decimals)
  };
}

/**
 * Convert database pool to PoolData format
 */
function convertDbPoolToPoolData(dbPool: any): PoolData {
  const config = getDefaultPoolConfig();
  
  // Use total_principal as totalAssets for now (since it represents the pool's value)
  const totalAssets = dbPool.total_principal?.toString() || "0";
  const availableCapacity = calculateAvailableCapacity(config, totalAssets);
  
  return {
    id: dbPool.id,
    name: dbPool.name || `Lending Pool #${dbPool.id}`,
    vault: dbPool.vault_address || `0x${dbPool.id.toString().padStart(40, '0')}`, // Generate mock vault address
    asset: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C8", // USDC address on Base
    totalAssets: formatUSDCAmount(totalAssets),
    totalShares: formatShareAmount(totalAssets), // Use same value for shares initially
    availableCapacity: formatUSDCAmount(availableCapacity),
    config,
    lastUpdated: dbPool.updated_at || dbPool.created_at,
    status: dbPool.status,
    description: dbPool.description,
    targetAmount: dbPool.target_amount ? formatUSDCAmount(dbPool.target_amount) : undefined,
    minimumInvestment: dbPool.minimum_investment ? formatUSDCAmount(dbPool.minimum_investment) : undefined,
    expectedReturn: dbPool.expected_return ? `${(Number(dbPool.expected_return) * 100).toFixed(2)}%` : undefined,
    maturityDate: dbPool.maturity_date,
    purpose: dbPool.purpose,
    geographicFocus: dbPool.geographic_focus,
    borrowerProfile: dbPool.borrower_profile,
    collateralType: dbPool.collateral_type,
    loanTermRange: dbPool.loan_term_range,
    interestRateRange: dbPool.interest_rate_range,
    totalLoans: dbPool.total_loans,
    totalPrincipal: formatUSDCAmount(dbPool.total_principal),
    avgInterestRate: `${(Number(dbPool.avg_interest_rate) * 100).toFixed(2)}%`,
    avgTermMonths: dbPool.avg_term_months,
    creator: {
      id: dbPool.creator.id,
      email: dbPool.creator.email,
      role: dbPool.creator.role
    }
  };
}

// Main Pool Data Fetching

/**
 * Fetch all deployed pools from database
 */
export async function getDeployedPools(): Promise<PoolDataResponse> {
  try {
    console.log("Starting to fetch deployed pools from database...");

    // Check cache first
    const cachedData = getCachedPoolData();
    if (cachedData) {
      return cachedData;
    }

    // Get active pools from database
    const dbPools = await LoanPool.findActivePools();
    console.log(`Found ${dbPools.length} active pools in database`);

    // Convert database pools to PoolData format
    const pools: PoolData[] = [];
    let failedCount = 0;

    for (const dbPool of dbPools) {
      try {
        const poolData = convertDbPoolToPoolData(dbPool);
        pools.push(poolData);
      } catch (error) {
        console.error(`Error converting pool ${dbPool.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Pool loading complete: ${pools.length} successful, ${failedCount} failed`);

    const response: PoolDataResponse = {
      pools,
      totalPools: dbPools.length,
      successfullyLoaded: pools.length,
      failedToLoad: failedCount,
      lastUpdated: new Date(),
      cached: false
    };

    // Cache the response
    cachePoolData(response);

    return response;

  } catch (error) {
    console.error("Error fetching deployed pools:", error);
    throw new Error(`Failed to fetch deployed pools: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get single pool data by ID from database
 */
export async function getPoolById(poolId: number): Promise<PoolData | null> {
  try {
    console.log(`Fetching single pool data for pool ${poolId} from database`);
    
    const dbPool = await LoanPool.getLoanPoolDetails(poolId, true);
    
    if (!dbPool) {
      console.log(`Pool ${poolId} not found in database`);
      return null;
    }

    const poolData = convertDbPoolToPoolData(dbPool);
    console.log(`Successfully loaded pool ${poolId} from database`);
    
    return poolData;

  } catch (error) {
    console.error(`Error fetching pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Refresh pool data cache (force refresh)
 */
export async function refreshPoolData(): Promise<PoolDataResponse> {
  console.log("Force refreshing pool data...");
  clearPoolDataCache();
  return await getDeployedPools();
}

/**
 * Get cache status and statistics
 */
export function getCacheStatus(): {
  cached: boolean;
  age: number;
  poolCount: number;
  lastUpdated?: Date;
} {
  if (!poolDataCache) {
    return {
      cached: false,
      age: 0,
      poolCount: 0
    };
  }

  const age = Date.now() - poolDataCache.timestamp;
  return {
    cached: isCacheValid(poolDataCache),
    age,
    poolCount: poolDataCache.data.pools.length,
    lastUpdated: poolDataCache.data.lastUpdated
  };
} 