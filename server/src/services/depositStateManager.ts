/**
 * Functional In-Memory Deposit State Manager
 * 
 * Tracks deposit status across pools and users using Map-based storage.
 * Handles state transitions: REQUESTED → FULFILLED → CLAIMED
 */

// TypeScript Interfaces
export interface DepositStatus {
  pending: number;
  claimable: number;
  claimed: number;
  lastUpdated: Date;
}

export interface DepositEvent {
  type: 'REQUESTED' | 'FULFILLED' | 'CLAIMED';
  poolId: number;
  userAddress: string;
  amount: string;
  txHash: string;
  timestamp: Date;
}

export interface PendingDeposit {
  poolId: number;
  userAddress: string;
  amount: string;
  txHash: string;
  timestamp: Date;
}

export interface PoolDepositStats {
  totalPending: number;
  totalDeposited: number;
  uniqueDepositors: number;
  avgDepositSize: number;
}

// In-memory state storage
// Key format: "poolId-userAddress"
const depositStateMap = new Map<string, DepositStatus>();

// Helper Functions

/**
 * Generate consistent map key for user/pool combination
 */
export function getStateKey(poolId: number, userAddress: string): string {
  return `${poolId}-${userAddress.toLowerCase()}`;
}

/**
 * Validate deposit event data
 */
export function validateDepositEvent(event: DepositEvent): boolean {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Check required fields
  if (!event.type || !['REQUESTED', 'FULFILLED', 'CLAIMED'].includes(event.type)) {
    return false;
  }

  if (typeof event.poolId !== 'number' || event.poolId < 0) {
    return false;
  }

  if (!event.userAddress || typeof event.userAddress !== 'string') {
    return false;
  }

  if (!event.amount || typeof event.amount !== 'string') {
    return false;
  }

  if (!event.txHash || typeof event.txHash !== 'string') {
    return false;
  }

  if (!event.timestamp || !(event.timestamp instanceof Date)) {
    return false;
  }

  // Validate amount is positive number
  const amount = parseFloat(event.amount);
  if (isNaN(amount) || amount <= 0) {
    return false;
  }

  return true;
}

/**
 * Format deposit amounts for consistent number handling
 */
export function formatDepositAmounts(amount: string): number {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) {
    throw new Error(`Invalid deposit amount: ${amount}`);
  }
  // Round to 6 decimal places to handle floating point precision
  return Math.round(parsed * 1000000) / 1000000;
}

// Core State Management Functions

/**
 * Update deposit state when events arrive
 */
export function updateDepositState(event: DepositEvent): void {
  if (!validateDepositEvent(event)) {
    throw new Error('Invalid deposit event data');
  }

  const key = getStateKey(event.poolId, event.userAddress);
  const amount = formatDepositAmounts(event.amount);
  
  // Get existing state or create new one
  let currentState = depositStateMap.get(key);
  if (!currentState) {
    currentState = {
      pending: 0,
      claimable: 0,
      claimed: 0,
      lastUpdated: new Date()
    };
  }

  // Create new state object (immutable update)
  const newState: DepositStatus = {
    ...currentState,
    lastUpdated: event.timestamp
  };

  // Process event based on type
  switch (event.type) {
    case 'REQUESTED':
      newState.pending += amount;
      break;

    case 'FULFILLED':
      // Move amount from pending to claimable
      if (newState.pending < amount) {
        throw new Error(`Insufficient pending amount. Trying to fulfill ${amount}, but only ${newState.pending} pending`);
      }
      newState.pending -= amount;
      newState.claimable += amount;
      break;

    case 'CLAIMED':
      // Move amount from claimable to claimed
      if (newState.claimable < amount) {
        throw new Error(`Insufficient claimable amount. Trying to claim ${amount}, but only ${newState.claimable} claimable`);
      }
      newState.claimable -= amount;
      newState.claimed += amount;
      break;

    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }

  // Ensure all amounts are non-negative
  if (newState.pending < 0 || newState.claimable < 0 || newState.claimed < 0) {
    throw new Error('Deposit amounts cannot be negative');
  }

  // Update state in map
  depositStateMap.set(key, newState);
}

/**
 * Get user's current deposit status for a specific pool
 */
export function getUserDepositStatus(poolId: number, userAddress: string): DepositStatus {
  const key = getStateKey(poolId, userAddress);
  const state = depositStateMap.get(key);
  
  if (!state) {
    return {
      pending: 0,
      claimable: 0,
      claimed: 0,
      lastUpdated: new Date()
    };
  }

  // Return copy to prevent external mutations
  return {
    ...state
  };
}

/**
 * Get all deposits awaiting fulfillment (for admin interface)
 */
export function getAllPendingDeposits(): PendingDeposit[] {
  const pendingDeposits: PendingDeposit[] = [];

  for (const [key, status] of depositStateMap.entries()) {
    if (status.pending > 0) {
      const [poolIdStr, userAddress] = key.split('-');
      const poolId = parseInt(poolIdStr, 10);

      pendingDeposits.push({
        poolId,
        userAddress,
        amount: status.pending.toString(),
        txHash: '', // Note: We don't store individual tx hashes in this simple state
        timestamp: status.lastUpdated
      });
    }
  }

  // Sort by timestamp (oldest first)
  return pendingDeposits.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get aggregate deposit statistics for a specific pool
 */
export function getPoolDepositStats(poolId: number): PoolDepositStats {
  let totalPending = 0;
  let totalDeposited = 0;
  const uniqueDepositors = new Set<string>();
  const depositAmounts: number[] = [];

  for (const [key, status] of depositStateMap.entries()) {
    const [keyPoolId, userAddress] = key.split('-');
    
    if (parseInt(keyPoolId, 10) === poolId) {
      totalPending += status.pending;
      totalDeposited += status.claimed;
      
      // Track unique depositors (users with any activity)
      if (status.pending > 0 || status.claimable > 0 || status.claimed > 0) {
        uniqueDepositors.add(userAddress);
        
        // Collect all deposit amounts for average calculation
        if (status.claimed > 0) {
          depositAmounts.push(status.claimed);
        }
        if (status.claimable > 0) {
          depositAmounts.push(status.claimable);
        }
      }
    }
  }

  // Calculate average deposit size
  const avgDepositSize = depositAmounts.length > 0 
    ? depositAmounts.reduce((sum, amount) => sum + amount, 0) / depositAmounts.length
    : 0;

  return {
    totalPending: formatDepositAmounts(totalPending.toString()),
    totalDeposited: formatDepositAmounts(totalDeposited.toString()),
    uniqueDepositors: uniqueDepositors.size,
    avgDepositSize: formatDepositAmounts(avgDepositSize.toString())
  };
}

/**
 * Clear all deposit state (useful for testing)
 */
export function clearDepositState(): void {
  depositStateMap.clear();
}

/**
 * Get current state map size (for debugging/monitoring)
 */
export function getStateMapSize(): number {
  return depositStateMap.size;
}

/**
 * Get all state keys (for debugging)
 */
export function getAllStateKeys(): string[] {
  return Array.from(depositStateMap.keys());
}

/**
 * Check if user has any deposit activity in a pool
 */
export function hasUserActivity(poolId: number, userAddress: string): boolean {
  const status = getUserDepositStatus(poolId, userAddress);
  return status.pending > 0 || status.claimable > 0 || status.claimed > 0;
}

/**
 * Get total user activity across all pools
 */
export function getUserTotalActivity(userAddress: string): {
  totalPending: number;
  totalClaimable: number;
  totalClaimed: number;
  poolCount: number;
} {
  let totalPending = 0;
  let totalClaimable = 0;
  let totalClaimed = 0;
  let poolCount = 0;

  const normalizedAddress = userAddress.toLowerCase();

  for (const [key, status] of depositStateMap.entries()) {
    const [, keyUserAddress] = key.split('-');
    
    if (keyUserAddress === normalizedAddress) {
      if (status.pending > 0 || status.claimable > 0 || status.claimed > 0) {
        totalPending += status.pending;
        totalClaimable += status.claimable;
        totalClaimed += status.claimed;
        poolCount++;
      }
    }
  }

  return {
    totalPending: formatDepositAmounts(totalPending.toString()),
    totalClaimable: formatDepositAmounts(totalClaimable.toString()),
    totalClaimed: formatDepositAmounts(totalClaimed.toString()),
    poolCount
  };
} 