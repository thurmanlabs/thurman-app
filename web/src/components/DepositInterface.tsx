import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Alert,
  Snackbar
} from "@mui/material";
import { usePolling } from "../hooks/usePolling";
import useAccount from "../hooks/useAccount";
import DepositSection from "./DepositSection";
import DepositStatusCard from "./DepositStatusCard";
import UserBalanceCard from "./UserBalanceCard";

interface DepositInterfaceProps {
  poolId: number;
  poolName: string;
  minDeposit?: number;
  maxDeposit?: number;
  hideBalanceCard?: boolean; // Option to hide the balance card if it's shown elsewhere
}

interface DepositStatus {
  pending: number;
  claimable: number;
  claimed: number;
  lastUpdated: string;
  hasActivity: boolean;
}

export default function DepositInterface({
  poolId,
  poolName,
  minDeposit = 0.01,
  maxDeposit = 1000000,
  hideBalanceCard = false
}: DepositInterfaceProps) {
  const { user } = useAccount();
  const userAddress = user?.account; // Get wallet address from user account
  const [userBalance, setUserBalance] = useState<number>(0);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Memoize the endpoint to prevent unnecessary polling restarts
  const depositStatusEndpoint = useMemo(() => {
    if (!userAddress || !poolId) return '';
    return `/api/deposits/status/${poolId}/${userAddress}`;
  }, [userAddress, poolId]);

  // Memoize polling options to prevent unnecessary re-renders
  const pollingOptions = useMemo(() => ({
    interval: 5000,
    enabled: !!userAddress && !!poolId,
    requiresAuth: true,
    onDataChange: (prev: DepositStatus | null, current: DepositStatus | null) => {
      if (prev && current) {
        // Notify when deposit becomes claimable
        if (prev.claimable === 0 && current.claimable > 0) {
          setNotification({
            type: 'success',
            message: `Your deposit of $${current.claimable.toLocaleString()} is ready to claim!`
          });
        }
        
        // Notify when shares are claimed
        if (current.claimed > prev.claimed) {
          setNotification({
            type: 'success',
            message: `Successfully claimed $${(current.claimed - prev.claimed).toLocaleString()} in shares!`
          });
        }

        // Notify when new pending deposits are added
        if (current.pending > prev.pending) {
          setNotification({
            type: 'info',
            message: `New deposit of $${(current.pending - prev.pending).toLocaleString()} submitted and pending fulfillment.`
          });
        }
      }
    },
    onError: (error: Error) => {
      console.error('Deposit status polling error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update deposit status. Please refresh the page.'
      });
    }
  }), [userAddress, poolId]);

  // Real-time deposit status polling
  const { 
    data: depositStatus, 
    loading: depositLoading,
    error: depositError,
    refetch: refetchDepositStatus
  } = usePolling<DepositStatus>(depositStatusEndpoint, pollingOptions);

  // Handle deposit success
  const handleDepositSuccess = (transactionId: string) => {
    setNotification({
      type: 'success',
      message: `Deposit request submitted successfully! Transaction ID: ${transactionId}`
    });
    
    // Refetch deposit status after a short delay
    setTimeout(() => {
      refetchDepositStatus();
    }, 2000);
  };

  // Handle deposit error
  const handleDepositError = (error: string) => {
    setNotification({
      type: 'error',
      message: `Deposit failed: ${error}`
    });
  };

  // Handle claim success
  const handleClaimSuccess = (transactionId: string) => {
    setNotification({
      type: 'success',
      message: `Shares claimed successfully! Transaction ID: ${transactionId}`
    });
    
    // Refetch deposit status after a short delay
    setTimeout(() => {
      refetchDepositStatus();
    }, 2000);
  };

  // Handle claim error
  const handleClaimError = (error: string) => {
    setNotification({
      type: 'error',
      message: `Claim failed: ${error}`
    });
  };

  // Handle balance update
  const handleBalanceUpdate = (balance: number) => {
    setUserBalance(balance);
  };

  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };

  // Show error if polling fails
  if (depositError && userAddress) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: '1.25em' }}>
          <Typography variant="h6" gutterBottom>
            Connection Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Unable to load deposit information. Please check your connection and try again.
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Error: {depositError.message}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Global Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={clearNotification} 
          severity={notification?.type} 
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* User Balance Card - Only show if not hidden */}
        {!hideBalanceCard && (
          <Grid item xs={12} md={4}>
            <UserBalanceCard
              userAddress={userAddress}
              onBalanceUpdate={handleBalanceUpdate}
            />
          </Grid>
        )}

        {/* Deposit Status Card - Adjust width based on balance card visibility */}
        <Grid item xs={12} md={hideBalanceCard ? 12 : 8}>
          <DepositStatusCard
            depositStatus={depositStatus}
            loading={depositLoading}
            poolId={poolId}
            poolName={poolName}
            onClaimSuccess={handleClaimSuccess}
            onClaimError={handleClaimError}
          />
        </Grid>

        {/* Deposit Section - Only show for authenticated users */}
        {user && (
          <Grid item xs={12}>
            <DepositSection
              poolId={poolId}
              poolName={poolName}
              minDeposit={minDeposit}
              maxDeposit={maxDeposit}
              userBalance={userBalance}
              onDepositSuccess={handleDepositSuccess}
              onDepositError={handleDepositError}
            />
          </Grid>
        )}

        {/* Unauthenticated User Message */}
        {!user && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: '1.25em' }}>
              <Typography variant="h6" gutterBottom>
                Sign in to Deposit
              </Typography>
              <Typography variant="body2">
                Please sign in to your account to make deposits and track your investment status.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
} 