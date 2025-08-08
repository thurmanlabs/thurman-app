import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Divider,
  Grid
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon
} from "@mui/icons-material";
import { useSnackbar, closeSnackbar } from "notistack";
import { useAdminPolling } from "../../hooks/usePolling";
import axios from "axios";

// Types
interface PendingDeposit {
  id: string;
  userAddress: string;
  poolId: number;
  poolName: string;
  amount: number;
  timestamp: string;
  status: "pending" | "fulfilling" | "fulfilled" | "failed";
}

interface PendingDepositsResponse {
  success: boolean;
  data: {
    deposits: PendingDeposit[];
    summary: {
      totalPending: number;
      totalAmount: number;
      count: number;
    };
  };
}

interface PendingDepositsTableProps {
  onDataChange?: (newData: PendingDeposit[], oldData: PendingDeposit[]) => void;
}

// Utility functions
const formatAddress = (address: string): string => {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
};

// Loading skeleton component
const TableSkeleton = (): JSX.Element => (
  <TableContainer component={Paper} sx={{ borderRadius: "1.25em", overflow: "hidden" }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>User Address</TableCell>
          <TableCell>Pool</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Time</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton width={120} /></TableCell>
            <TableCell><Skeleton width={100} /></TableCell>
            <TableCell><Skeleton width={80} /></TableCell>
            <TableCell><Skeleton width={100} /></TableCell>
            <TableCell><Skeleton width={80} height={32} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Summary stats component
interface SummaryStatsProps {
  summary: {
    totalPending: number;
    totalAmount: number;
    count: number;
  };
  loading: boolean;
}

const SummaryStats: React.FC<SummaryStatsProps> = React.memo(({ summary, loading }) => {
  if (loading) {
    return (
      <Stack spacing={2} sx={{ mb: 3 }}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: "1em" }} />
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: "1em" }} />
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: "1em" }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
            <Card sx={{ 
        borderRadius: "1em",
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
      }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <ScheduleIcon sx={{ fontSize: 20, color: "warning.main" }} />
            <Typography variant="body2" color="text.secondary">
              Pending Requests
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={600}>
            {summary.count}
          </Typography>
        </CardContent>
      </Card>
      
            <Card sx={{ 
        borderRadius: "1em",
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
      }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AccountBalanceIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="body2" color="text.secondary">
              Total Amount
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={600}>
            {formatCurrency(summary.totalAmount)}
          </Typography>
        </CardContent>
      </Card>
      
            <Card sx={{ 
        borderRadius: "1em",
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
      }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 20, color: "success.main" }} />
            <Typography variant="body2" color="text.secondary">
              Average Amount
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={600}>
            {summary.count > 0 ? formatCurrency(summary.totalAmount / summary.count) : "$0"}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
});

// Main component
const PendingDepositsTable: React.FC<PendingDepositsTableProps> = ({ onDataChange }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fulfillingDeposits, setFulfillingDeposits] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    deposit: PendingDeposit | null;
  }>({ open: false, deposit: null });
  
  // Manual polling state to reduce conflicts
  const [depositsData, setDepositsData] = useState<PendingDepositsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<PendingDepositsResponse | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTimeRef = useRef<number>(0);

  // Manual polling function
  const fetchPendingDeposits = useCallback(async (): Promise<void> => {
    if (isPolling) return;
    
    try {
      setIsPolling(true);
      setError(null);
      
      const response = await axios.get("/api/admin/deposits/pending");
      const newData = response.data;
      
      // Check if data has changed
      const hasChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(newData);
      
      if (hasChanged) {
        if (onDataChange) {
          onDataChange(newData?.data?.deposits || [], previousDataRef.current?.data?.deposits || []);
        }
        
        // Show notification for new deposits
        const newCount = newData?.data?.deposits?.length || 0;
        const oldCount = previousDataRef.current?.data?.deposits?.length || 0;
        
        if (newCount > oldCount && oldCount > 0) {
          const now = Date.now();
          const timeSinceLastNotification = now - lastNotificationTimeRef.current;
          
          if (timeSinceLastNotification > 10000) {
            if (notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
            }
            
            notificationTimeoutRef.current = setTimeout(() => {
              const newDeposits = newData?.data?.deposits?.slice(0, newCount - oldCount) || [];
              newDeposits.forEach((deposit: PendingDeposit) => {
                enqueueSnackbar(
                  `New deposit request: ${formatCurrency(deposit.amount)} from ${formatAddress(deposit.userAddress)}`,
                  { 
                    variant: "info",
                    autoHideDuration: 5000,
                    anchorOrigin: { vertical: "top", horizontal: "right" }
                  }
                );
              });
              lastNotificationTimeRef.current = Date.now();
            }, 2000);
          }
        }
        
        setDepositsData(newData);
        previousDataRef.current = newData;
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching pending deposits:", err);
      setError(err);
      setLoading(false);
    } finally {
      setIsPolling(false);
    }
  }, [onDataChange, enqueueSnackbar, isPolling]);

  // Manual refetch function
  const refetch = useCallback((): void => {
    fetchPendingDeposits();
  }, [fetchPendingDeposits]);

  // Setup polling on mount
  React.useEffect(() => {
    fetchPendingDeposits();
    
    // Start polling every 30 seconds
    intervalRef.current = setInterval(fetchPendingDeposits, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [fetchPendingDeposits]);

  const deposits = depositsData?.data?.deposits || [];
  const summary = depositsData?.data?.summary || { totalPending: 0, totalAmount: 0, count: 0 };

  // Sort deposits by timestamp (newest first)
  const sortedDeposits = useMemo(() => {
    return [...deposits].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [deposits]);

  // Handle fulfill deposit
  const handleFulfill = useCallback(async (deposit: PendingDeposit): Promise<void> => {
    if (fulfillingDeposits.has(deposit.id)) return;

    try {
      setFulfillingDeposits(prev => new Set(prev).add(deposit.id));
      
      const response = await axios.post("/api/admin/deposits/fulfill", {
        depositId: deposit.id,
        userAddress: deposit.userAddress,
        poolId: deposit.poolId,
        amount: deposit.amount
      });

      if (response.data.success) {
        enqueueSnackbar(
          `Fulfilled ${formatCurrency(deposit.amount)} deposit for ${formatAddress(deposit.userAddress)}`,
          { 
            variant: "success",
            autoHideDuration: 4000,
            anchorOrigin: { vertical: "top", horizontal: "right" }
          }
        );
        
        // Refresh data to get updated status
        refetch();
      } else {
        throw new Error(response.data.message || "Failed to fulfill deposit");
      }
    } catch (err: any) {
      console.error("Error fulfilling deposit:", err);
      
      const errorMessage = err.response?.data?.message || err.message || "Failed to fulfill deposit";
      enqueueSnackbar(
        `Error: ${errorMessage}`,
        { 
          variant: "error",
          autoHideDuration: 6000,
          anchorOrigin: { vertical: "top", horizontal: "right" },
          action: (key) => (
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                closeSnackbar(key);
                handleFulfill(deposit);
              }}
            >
              Retry
            </Button>
          )
        }
      );
    } finally {
      setFulfillingDeposits(prev => {
        const newSet = new Set(prev);
        newSet.delete(deposit.id);
        return newSet;
      });
    }
  }, [fulfillingDeposits, enqueueSnackbar, refetch]);

  // Handle copy address
  const handleCopyAddress = useCallback(async (address: string): Promise<void> => {
    const success = await copyToClipboard(address);
    if (success) {
      enqueueSnackbar("Address copied to clipboard", { 
        variant: "success",
        autoHideDuration: 2000,
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } else {
      enqueueSnackbar("Failed to copy address", { 
        variant: "error",
        autoHideDuration: 2000,
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    }
  }, [enqueueSnackbar]);

  // Handle confirm dialog
  const handleConfirmFulfill = useCallback((): void => {
    if (confirmDialog.deposit) {
      handleFulfill(confirmDialog.deposit);
    }
    setConfirmDialog({ open: false, deposit: null });
  }, [confirmDialog.deposit, handleFulfill]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* Summary Stats */}
      <SummaryStats summary={summary} loading={loading} />

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#29262a" }}>
          Pending Deposits
        </Typography>
        <Tooltip title="Refresh">
          <IconButton 
            onClick={refetch}
            disabled={loading}
            sx={{ color: "primary.main" }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          Failed to load pending deposits: {error.message}
        </Alert>
      )}

      {/* Table */}
      {loading && !deposits.length ? (
        <TableSkeleton />
      ) : sortedDeposits.length === 0 ? (
        <Card sx={{ 
          borderRadius: "1.25em",
          backgroundColor: "#FFFFFE",
          boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
        }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Pending Deposits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All deposit requests have been processed
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "1.25em", overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600 }}>User Address</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pool</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDeposits.map((deposit) => {
                const isFulfilling = fulfillingDeposits.has(deposit.id);
                
                return (
                  <TableRow key={deposit.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {formatAddress(deposit.userAddress)}
                        </Typography>
                        <Tooltip title="Copy address">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyAddress(deposit.userAddress)}
                            sx={{ p: 0.5 }}
                          >
                            <CopyIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={deposit.poolName || `Pool ${deposit.poolId}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(deposit.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatRelativeTime(deposit.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        disabled={isFulfilling}
                        onClick={() => setConfirmDialog({ open: true, deposit })}
                        sx={{ 
                          minWidth: 100,
                          backgroundColor: isFulfilling ? "grey.400" : "success.main",
                          "&:hover": {
                            backgroundColor: isFulfilling ? "grey.400" : "success.dark"
                          }
                        }}
                      >
                        {isFulfilling ? "Fulfilling..." : "Fulfill"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, deposit: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Deposit Fulfillment
        </DialogTitle>
        <DialogContent>
          {confirmDialog.deposit && (
            <Stack spacing={2}>
              <Typography variant="body1">
                Are you sure you want to fulfill this deposit request?
              </Typography>
              <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>User:</strong> {formatAddress(confirmDialog.deposit.userAddress)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Pool:</strong> {confirmDialog.deposit.poolName || `Pool ${confirmDialog.deposit.poolId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Amount:</strong> {formatCurrency(confirmDialog.deposit.amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Time:</strong> {formatRelativeTime(confirmDialog.deposit.timestamp)}
                </Typography>
              </Box>
              <Alert severity="warning" icon={<WarningIcon />}>
                This action will process the deposit on-chain and cannot be undone.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, deposit: null })}
            disabled={fulfillingDeposits.has(confirmDialog.deposit?.id || "")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmFulfill}
            variant="contained"
            color="success"
            disabled={fulfillingDeposits.has(confirmDialog.deposit?.id || "")}
            startIcon={<CheckCircleIcon />}
          >
            {fulfillingDeposits.has(confirmDialog.deposit?.id || "") ? "Fulfilling..." : "Confirm Fulfill"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingDepositsTable; 