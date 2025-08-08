import { useState, useEffect } from "react";
import { MetricsData, LendingPool } from "../types/pools";

const MOCK_POOLS: LendingPool[] = [
  {
    id: "1",
    name: "Stablecoin Lending Pool",
    description: "Earn yield by providing stablecoin liquidity to borrowers",
    rate: "4.5%",
    loanTerm: "30-90 days",
    liquidity: "$2.4M"
  },
  {
    id: "2",
    name: "ETH Lending Pool",
    description: "Provide ETH liquidity for DeFi lending",
    rate: "3.2%",
    loanTerm: "14-60 days",
    liquidity: "$5.1M"
  }
];

export function usePoolsData() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Always show mock data for now
    setMetrics({
      activeLoans: "$58.81M",
      lossRate: "3.43%",
      interestFees: "$11.24M"
    });
    setPools(MOCK_POOLS);
    setLoading(false);
  }, []); // Empty dependency array since we're just loading mock data

  return { metrics, pools, loading, error };
} 