// Type definitions for polling hook usage examples

export interface DepositStatus {
  id: string;
  poolId: string;
  userAddress: string;
  amount: string;
  status: 'pending' | 'fulfilled' | 'claimed' | 'failed';
  requestedAt: string;
  fulfilledAt?: string;
  claimedAt?: string;
  transactionHash?: string;
  shares?: string;
  errorMessage?: string;
}

export interface PendingDeposit {
  id: string;
  poolId: string;
  userAddress: string;
  amount: string;
  requestedAt: string;
  userEmail: string;
  poolName: string;
}

export interface PoolData {
  id: string;
  name: string;
  description: string;
  totalAssets: string;
  totalShares: string;
  tvl: string;
  apy: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  config: {
    minDeposit: string;
    maxDeposit: string;
    lockPeriod: number;
  };
}

export interface UserPortfolio {
  totalDeposits: string;
  totalShares: string;
  totalValue: string;
  activePools: number;
  deposits: Array<{
    poolId: string;
    poolName: string;
    amount: string;
    shares: string;
    value: string;
    status: DepositStatus['status'];
  }>;
}

export interface AdminDashboard {
  totalPools: number;
  totalDeposits: string;
  totalTVL: string;
  pendingDeposits: number;
  recentActivity: Array<{
    type: 'deposit' | 'fulfill' | 'claim';
    poolId: string;
    userAddress: string;
    amount: string;
    timestamp: string;
  }>;
}

// Example usage patterns for the polling hook:

/*
// 1. User deposit status polling
const { data: depositStatus, loading, error } = usePolling<DepositStatus>(
  `/api/deposits/status/${poolId}/${userAddress}`,
  { 
    interval: 5000, 
    requiresAuth: true,
    onDataChange: (prev, current) => {
      if (prev?.status === 'pending' && current?.status === 'fulfilled') {
        console.log('Deposit fulfilled!');
      }
    }
  }
);

// 2. Admin pending deposits polling
const { data: pendingDeposits } = usePolling<PendingDeposit[]>(
  '/api/admin/deposits/pending',
  { 
    interval: 3000, 
    requiresAdmin: true 
  }
);

// 3. Pool data with longer interval
const { data: poolData } = usePolling<PoolData>(
  `/api/pools/${poolId}`,
  { 
    interval: 30000,
    onDataChange: (prev, current) => {
      if (prev && current && prev.tvl !== current.tvl) {
        console.log(`TVL changed from ${prev.tvl} to ${current.tvl}`);
      }
    }
  }
);

// 4. User portfolio polling
const { data: portfolio } = useUserPolling<UserPortfolio>(
  '/api/user/portfolio',
  { interval: 10000 }
);

// 5. Admin dashboard polling
const { data: dashboard } = useAdminPolling<AdminDashboard>(
  '/api/admin/dashboard',
  { interval: 5000 }
);

// 6. Frequent polling for real-time updates
const { data: realTimeData } = useFrequentPolling<DepositStatus>(
  `/api/deposits/status/${poolId}/${userAddress}`
);

// 7. Slow polling for static data
const { data: staticData } = useSlowPolling<PoolData>(
  `/api/pools/${poolId}`
);

// 8. Conditional polling
const { data: conditionalData } = usePolling<DepositStatus>(
  `/api/deposits/status/${poolId}/${userAddress}`,
  { 
    enabled: !!poolId && !!userAddress,
    requiresAuth: true 
  }
);

// 9. Error handling
const { data, error, refetch } = usePolling<DepositStatus>(
  `/api/deposits/status/${poolId}/${userAddress}`,
  {
    onError: (error) => {
      console.error('Polling error:', error);
      // Custom error handling logic
    }
  }
);

// 10. Manual refetch
const { data, refetch } = usePolling<DepositStatus>(
  `/api/deposits/status/${poolId}/${userAddress}`
);

// Trigger manual refetch on button click
const handleRefresh = () => {
  refetch();
};
*/ 