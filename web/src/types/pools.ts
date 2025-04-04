export interface MetricsData {
  activeLoans: string;
  lossRate: string;
  interestFees: string;
}

export interface LendingPool {
  id: string;
  name: string;
  description: string;
  rate: string | number;
  loanTerm: string;
  liquidity: string;
} 