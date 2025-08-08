import { useState, useEffect, useRef, useCallback } from "react";
import useAccount from "./useAccount";
import axios from "axios";

// Types for the polling hook
export interface PollingOptions<T> {
  interval?: number; // Polling frequency in milliseconds (default: 5000)
  enabled?: boolean; // Whether polling is enabled (default: true)
  requiresAuth?: boolean; // Skip polling if not authenticated (default: false)
  requiresAdmin?: boolean; // Skip polling if not admin (default: false)
  onDataChange?: (prevData: T | null, currentData: T | null) => void; // Callback for data changes
  onError?: (error: Error) => void; // Callback for errors
  onNotification?: (message: string, type: "success" | "warning" | "error") => void; // Callback for notifications
  retryAttempts?: number; // Max retry attempts before exponential backoff (default: 3)
  maxBackoffInterval?: number; // Maximum backoff interval in milliseconds (default: 30000)
}

export interface PollingResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  isPolling: boolean;
}

/**
 * Generic polling hook for data fetching with advanced features
 * 
 * Features:
 * - Configurable polling interval with exponential backoff
 * - Automatic cleanup on unmount
 * - Pause/resume based on browser tab visibility
 * - Authentication and admin role checks
 * - Status change notifications via callbacks
 * - TypeScript generics for type safety
 * 
 * @param endpoint - API endpoint to poll
 * @param options - Polling configuration options
 * @returns PollingResult with data, loading state, error, and controls
 * 
 * @example
 * // User deposit status polling
 * const { data: depositStatus, loading, error } = usePolling<DepositStatus>(
 *   `/api/deposits/status/${poolId}/${userAddress}`,
 *   { interval: 5000, requiresAuth: true }
 * );
 * 
 * // Admin pending deposits polling
 * const { data: pendingDeposits } = usePolling<PendingDeposit[]>(
 *   "/api/admin/deposits/pending",
 *   { interval: 3000, requiresAdmin: true }
 * );
 * 
 * // Pool data with longer interval
 * const { data: poolData } = usePolling<PoolData>(
 *   `/api/pools/${poolId}`,
 *   { interval: 30000, onDataChange: handlePoolDataChange }
 * );
 */
export function usePolling<T>(
  endpoint: string,
  options: PollingOptions<T> = {}
): PollingResult<T> {
  const {
    interval = 5000,
    enabled = true,
    requiresAuth = false,
    requiresAdmin = false,
    onDataChange,
    onError,
    onNotification,
    retryAttempts = 3,
    maxBackoffInterval = 30000
  } = options;

  // State management
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Refs for cleanup and tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const previousDataRef = useRef<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hooks
  const { user, isAdmin } = useAccount();

  // Check if polling should be active
  const shouldPoll = useCallback(() => {
    if (!enabled) return false;
    if (requiresAuth && !user) return false;
    if (requiresAdmin && !isAdmin) return false;
    return true;
  }, [enabled, requiresAuth, requiresAdmin, user, isAdmin]);

  // Fetch data function
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!shouldPoll()) return;

    // Only set loading to true if we don't have data yet (initial load)
    const isInitialLoad = !data && !loading;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    setError(null);

    try {
      const response = await axios.get(endpoint, { signal });
      const newData = response.data;

      // Check if data has changed
      const hasChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(newData);
      
      if (hasChanged) {
        // Call onDataChange callback if provided
        if (onDataChange) {
          onDataChange(previousDataRef.current, newData);
        }

        // Show notification for important status changes
        if (previousDataRef.current && newData && onNotification) {
          const prev = previousDataRef.current as any;
          const current = newData as any;
          
          // Example: Notify when deposit becomes claimable
          if (prev.status === "pending" && current.status === "fulfilled") {
            onNotification("Your deposit has been fulfilled and is ready to claim!", "success");
          }
          
          // Example: Notify when deposit is claimed
          if (prev.status === "fulfilled" && current.status === "claimed") {
            onNotification("Shares claimed successfully!", "success");
          }
        }

        setData(newData);
        setLastUpdated(new Date());
        previousDataRef.current = newData;
      }

      // Reset retry count on successful request
      retryCountRef.current = 0;

    } catch (err: any) {
      // Don't set error if request was aborted
      if (err.name === "AbortError") return;

      const error = err instanceof Error ? err : new Error(err.message || "Unknown error");
      setError(error);
      
      // Call onError callback if provided
      if (onError) {
        onError(error);
      }

      // Increment retry count
      retryCountRef.current++;

      // Show error notification for network issues
          if (onNotification && (error.message.includes("Network Error") || error.message.includes("timeout"))) {
      onNotification("Connection lost. Retrying...", "warning");
      }
    } finally {
      // Only set loading to false if it was set to true in this request
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [endpoint, shouldPoll, onDataChange, onError, onNotification, data, loading]);

  // Calculate backoff interval
  const getBackoffInterval = useCallback(() => {
    if (retryCountRef.current <= retryAttempts) {
      return interval;
    }
    
    const backoffMultiplier = Math.pow(2, retryCountRef.current - retryAttempts);
    const backoffInterval = interval * backoffMultiplier;
    
    return Math.min(backoffInterval, maxBackoffInterval);
  }, [interval, retryAttempts, maxBackoffInterval]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!shouldPoll()) return;

    setIsPolling(true);
    
    // Cancel any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    const pollInterval = getBackoffInterval();
    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);

  }, [shouldPoll, fetchData, getBackoffInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Manual refetch function
  const refetch = useCallback(async () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    await fetchData(abortControllerRef.current.signal);
  }, [fetchData]);

  // Handle visibility change (pause/resume polling)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab is not visible
        stopPolling();
      } else {
        // Resume polling when tab becomes visible
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling, stopPolling]);

  // Main polling effect
  useEffect(() => {
    if (shouldPoll()) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount or dependency change
    return () => {
      stopPolling();
    };
  }, [endpoint, shouldPoll, startPolling, stopPolling]);

  // Reset retry count when endpoint changes
  useEffect(() => {
    retryCountRef.current = 0;
    previousDataRef.current = null;
  }, [endpoint]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isPolling
  };
}

// Convenience hooks for common use cases
export function useUserPolling<T>(
  endpoint: string,
  options: Omit<PollingOptions<T>, "requiresAuth"> = {}
): PollingResult<T> {
  return usePolling<T>(endpoint, { ...options, requiresAuth: true });
}

export function useAdminPolling<T>(
  endpoint: string,
  options: Omit<PollingOptions<T>, "requiresAdmin"> = {}
): PollingResult<T> {
  return usePolling<T>(endpoint, { ...options, requiresAdmin: true });
}

export function useFrequentPolling<T>(
  endpoint: string,
  options: Omit<PollingOptions<T>, "interval"> = {}
): PollingResult<T> {
  return usePolling<T>(endpoint, { ...options, interval: 3000 });
}

export function useSlowPolling<T>(
  endpoint: string,
  options: Omit<PollingOptions<T>, "interval"> = {}
): PollingResult<T> {
  return usePolling<T>(endpoint, { ...options, interval: 30000 });
} 