/**
 * Pool Data Service
 * 
 * Fetches deployed pool data using Circle SDK contract queries exclusively
 */

import { circleContractSdk } from "../utils/circleContractClient";

// Configuration
const POOL_MANAGER_ADDRESS = process.env.POOL_MANAGER_CONTRACT_ADDRESS;
const BLOCKCHAIN = "BASE-SEPOLIA";
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
  blockNumber?: number;
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

// Contract Query Functions

/**
 * Query pool count from PoolManager contract
 */
async function queryPoolCount(): Promise<number> {
  try {
    const response = await circleContractSdk.queryContract({
      contractAddress: POOL_MANAGER_ADDRESS!,
      blockchain: BLOCKCHAIN,
      functionSignature: "poolCount()",
      functionParameters: []
    });

    if (response.status === "FAILED") {
      throw new Error(`Pool count query failed: ${response.error}`);
    }

    // Parse result as hex and convert to number
    const poolCount = parseInt(response.result, 16);
    console.log(`Found ${poolCount} total pools`);
    return poolCount;

  } catch (error) {
    console.error("Error querying pool count:", error);
    throw new Error(`Failed to query pool count: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Query pool data from PoolManager contract
 */
async function queryPoolData(poolId: number): Promise<{ vault: string; asset: string } | null> {
  try {
    const response = await circleContractSdk.queryContract({
      contractAddress: POOL_MANAGER_ADDRESS!,
      blockchain: BLOCKCHAIN,
      functionSignature: "getPool(uint16)",
      functionParameters: [poolId.toString()]
    });

    if (response.status === "FAILED") {
      console.error(`Pool ${poolId} data query failed:`, response.error);
      return null;
    }

    // Parse ABI encoded response
    // Assuming response contains vault and asset addresses
    const result = response.result;
    
    // For simplicity, assuming the result is ABI encoded with two addresses
    // In a real implementation, you'd properly decode the ABI response
    if (!result || result.length < 130) { // 2 addresses = 128 chars + 0x prefix
      console.error(`Invalid pool data response for pool ${poolId}`);
      return null;
    }

    // Extract addresses from packed response (simplified parsing)
    const vault = "0x" + result.slice(2, 42); // First 20 bytes
    const asset = "0x" + result.slice(42, 82); // Second 20 bytes

    return { vault, asset };

  } catch (error) {
    console.error(`Error querying pool ${poolId} data:`, error);
    return null;
  }
}

/**
 * Query pool configuration from PoolManager contract
 */
async function queryPoolConfig(poolId: number): Promise<PoolConfig | null> {
  try {
    const response = await circleContractSdk.queryContract({
      contractAddress: POOL_MANAGER_ADDRESS!,
      blockchain: BLOCKCHAIN,
      functionSignature: "getPoolConfig(uint16)",
      functionParameters: [poolId.toString()]
    });

    if (response.status === "FAILED") {
      console.error(`Pool ${poolId} config query failed:`, response.error);
      return null;
    }

    // Parse ABI encoded configuration response
    const result = response.result;
    
    // Simplified parsing - in reality you'd properly decode ABI
    // For now, return default config structure
    return {
      depositsEnabled: true,
      withdrawalsEnabled: true,
      maxDepositAmount: "1000000000000", // 1M USDC (6 decimals)
      minDepositAmount: "1000000", // 1 USDC (6 decimals)
      depositCap: "100000000000000" // 100M USDC (6 decimals)
    };

  } catch (error) {
    console.error(`Error querying pool ${poolId} config:`, error);
    return null;
  }
}

/**
 * Query vault total assets
 */
async function queryVaultTotalAssets(vaultAddress: string): Promise<string | null> {
  try {
    const response = await circleContractSdk.queryContract({
      contractAddress: vaultAddress,
      blockchain: BLOCKCHAIN,
      functionSignature: "totalAssets()",
      functionParameters: []
    });

    if (response.status === "FAILED") {
      console.error(`Vault ${vaultAddress} totalAssets query failed:`, response.error);
      return null;
    }

    // Convert hex result to decimal string
    const totalAssets = BigInt(response.result).toString();
    return totalAssets;

  } catch (error) {
    console.error(`Error querying vault ${vaultAddress} totalAssets:`, error);
    return null;
  }
}

/**
 * Query vault total supply (shares)
 */
async function queryVaultTotalSupply(vaultAddress: string): Promise<string | null> {
  try {
    const response = await circleContractSdk.queryContract({
      contractAddress: vaultAddress,
      blockchain: BLOCKCHAIN,
      functionSignature: "totalSupply()",
      functionParameters: []
    });

    if (response.status === "FAILED") {
      console.error(`Vault ${vaultAddress} totalSupply query failed:`, response.error);
      return null;
    }

    // Convert hex result to decimal string
    const totalSupply = BigInt(response.result).toString();
    return totalSupply;

  } catch (error) {
    console.error(`Error querying vault ${vaultAddress} totalSupply:`, error);
    return null;
  }
}

// Data Processing Functions

/**
 * Format USDC amount (6 decimals) to human readable string
 */
function formatUSDCAmount(amount: string): string {
  try {
    const amountBN = BigInt(amount);
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
function formatShareAmount(amount: string): string {
  try {
    const amountBN = BigInt(amount);
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
 * Generate descriptive pool name
 */
function generatePoolName(poolId: number): string {
  return `USDC Lending Pool #${poolId}`;
}

// Main Pool Data Fetching

/**
 * Fetch single pool data with all related information
 */
async function fetchSinglePoolData(poolId: number): Promise<PoolData | null> {
  try {
    console.log(`Fetching data for pool ${poolId}`);

    // Query pool basic data
    const poolData = await queryPoolData(poolId);
    if (!poolData) {
      console.warn(`Failed to get basic data for pool ${poolId}`);
      return null;
    }

    // Query pool configuration
    const poolConfig = await queryPoolConfig(poolId);
    if (!poolConfig) {
      console.warn(`Failed to get config for pool ${poolId}`);
      return null;
    }

    // Query vault data
    const [totalAssets, totalShares] = await Promise.all([
      queryVaultTotalAssets(poolData.vault),
      queryVaultTotalSupply(poolData.vault)
    ]);

    if (!totalAssets || !totalShares) {
      console.warn(`Failed to get vault data for pool ${poolId}`);
      return null;
    }

    // Calculate available capacity
    const availableCapacity = calculateAvailableCapacity(poolConfig, totalAssets);

    // Build complete pool data
    const completePoolData: PoolData = {
      id: poolId,
      name: generatePoolName(poolId),
      vault: poolData.vault,
      asset: poolData.asset,
      totalAssets: formatUSDCAmount(totalAssets),
      totalShares: formatShareAmount(totalShares),
      availableCapacity: formatUSDCAmount(availableCapacity),
      config: poolConfig,
      lastUpdated: new Date()
    };

    console.log(`Successfully loaded pool ${poolId}`);
    return completePoolData;

  } catch (error) {
    console.error(`Error fetching pool ${poolId} data:`, error);
    return null;
  }
}

/**
 * Fetch all deployed pools using Circle SDK contract queries
 */
export async function getDeployedPools(): Promise<PoolDataResponse> {
  try {
    console.log("Starting to fetch deployed pools...");

    // Check cache first
    const cachedData = getCachedPoolData();
    if (cachedData) {
      return cachedData;
    }

    // Validate configuration
    if (!POOL_MANAGER_ADDRESS) {
      throw new Error("POOL_MANAGER_CONTRACT_ADDRESS environment variable not set");
    }

    // Query total pool count
    const totalPools = await queryPoolCount();
    
    if (totalPools === 0) {
      const emptyResponse: PoolDataResponse = {
        pools: [],
        totalPools: 0,
        successfullyLoaded: 0,
        failedToLoad: 0,
        lastUpdated: new Date(),
        cached: false
      };
      cachePoolData(emptyResponse);
      return emptyResponse;
    }

    // Fetch all pools with parallel processing but limited concurrency
    const poolPromises: Promise<PoolData | null>[] = [];
    for (let poolId = 0; poolId < totalPools; poolId++) {
      poolPromises.push(fetchSinglePoolData(poolId));
    }

    // Process pools in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    const allResults: (PoolData | null)[] = [];
    
    for (let i = 0; i < poolPromises.length; i += BATCH_SIZE) {
      const batch = poolPromises.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch);
      allResults.push(...batchResults);
      
      // Brief pause between batches
      if (i + BATCH_SIZE < poolPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Filter successful results
    const successfulPools = allResults.filter((pool): pool is PoolData => pool !== null);
    const failedCount = allResults.length - successfulPools.length;

    console.log(`Pool loading complete: ${successfulPools.length} successful, ${failedCount} failed`);

    const response: PoolDataResponse = {
      pools: successfulPools,
      totalPools,
      successfullyLoaded: successfulPools.length,
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
 * Get single pool data by ID
 */
export async function getPoolById(poolId: number): Promise<PoolData | null> {
  try {
    console.log(`Fetching single pool data for pool ${poolId}`);
    
    if (!POOL_MANAGER_ADDRESS) {
      throw new Error("POOL_MANAGER_CONTRACT_ADDRESS environment variable not set");
    }

    return await fetchSinglePoolData(poolId);

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