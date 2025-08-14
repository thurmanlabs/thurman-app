import { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface BalanceData {
  balance: number;
  lastUpdated: string;
  currency: string;
}

export default function useUserBalance() {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance data
  const fetchBalance = useCallback(async (showLoading = true) => {
    setLoading(showLoading);
    setError(null);

    try {
      // Call the real balance API endpoint
      const response = await axios.get("/api/user/balance", {
        withCredentials: true // Include cookies for authentication
      });

      if (response.data.success) {
        const newBalanceData: BalanceData = {
          balance: response.data.data.balance,
          lastUpdated: response.data.data.lastUpdated,
          currency: response.data.data.currency
        };

        setBalanceData(newBalanceData);
        setError(null);
        return newBalanceData;
      } else {
        throw new Error(response.data.message || "Failed to fetch balance");
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch balance";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Refresh balance
  const refreshBalance = useCallback(() => {
    return fetchBalance(false);
  }, [fetchBalance]);

  return {
    balance: balanceData?.balance || 0,
    currency: balanceData?.currency || "USDC",
    lastUpdated: balanceData?.lastUpdated,
    loading,
    error,
    fetchBalance,
    refreshBalance
  };
} 