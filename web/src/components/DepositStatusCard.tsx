import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Skeleton
} from '@mui/material';
import {
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { styles } from '../styles/styles';

interface DepositStatus {
  pending: number;
  claimable: number;
  claimed: number;
  lastUpdated: string;
  hasActivity: boolean;
}

interface DepositStatusCardProps {
  depositStatus: DepositStatus | null;
  loading?: boolean;
  poolId: number;
  poolName: string;
  onClaimSuccess?: (transactionId: string) => void;
  onClaimError?: (error: string) => void;
}

export default function DepositStatusCard({
  depositStatus,
  loading = false,
  poolId,
  poolName,
  onClaimSuccess,
  onClaimError
}: DepositStatusCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Handle claim shares
  const handleClaimShares = async () => {
    if (!depositStatus || depositStatus.claimable <= 0 || isClaiming) return;

    setIsClaiming(true);
    setNotification(null);

    try {
      const response = await axios.post('/api/deposits/claim', {
        poolId,
        amount: depositStatus.claimable.toString()
      });

      if (response.data.success) {
        const { transactionId } = response.data.data;
        
        setNotification({
          type: 'success',
          message: `Shares claimed successfully! Transaction ID: ${transactionId}`
        });

        if (onClaimSuccess) {
          onClaimSuccess(transactionId);
        }
      } else {
        throw new Error(response.data.error || 'Claim failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim shares';
      
      setNotification({
        type: 'error',
        message: errorMessage
      });

      if (onClaimError) {
        onClaimError(errorMessage);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (amount: number) => {
    if (amount > 0) return '#2e7d32'; // Green
    return '#666'; // Gray
  };

  // Loading state
  if (loading) {
    return (
      <Card sx={{ 
        borderRadius: '1.25em',
        backgroundColor: '#FFFFFE',
        boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#29262a' }}>
            Your Deposit Status
          </Typography>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '0.75em' }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '0.75em' }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '0.75em' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // No activity state
  if (!depositStatus || !depositStatus.hasActivity) {
    return (
      <Card sx={{ 
        borderRadius: '1.25em',
        backgroundColor: '#FFFFFE',
        boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#29262a' }}>
            Your Deposit Status
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 4,
            color: '#666'
          }}>
            <AccountBalanceIcon sx={{ fontSize: 48, mb: 2, color: '#D3D3D3' }} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              No deposits yet
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Make your first deposit to see your status here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      borderRadius: '1.25em',
      backgroundColor: '#FFFFFE',
      boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#29262a' }}>
          Your Deposit Status
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          Track your deposits in {poolName}
        </Typography>

        {/* Notification Alert */}
        {notification && (
          <Alert 
            severity={notification.type} 
            onClose={clearNotification}
            sx={{ mb: 3 }}
          >
            {notification.message}
          </Alert>
        )}

        {/* Status Items */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {/* Pending Deposits */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#fff3e0', 
            borderRadius: '0.75em',
            border: '1px solid #ffcc02'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PendingIcon sx={{ color: '#f57c00', mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#29262a' }}>
                  Pending
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: getStatusColor(depositStatus.pending)
              }}>
                {formatCurrency(depositStatus.pending)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Awaiting fulfillment by admin
            </Typography>
          </Box>

          {/* Claimable Shares */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#e8f5e8', 
            borderRadius: '0.75em',
            border: '1px solid #4caf50'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#29262a' }}>
                  Claimable
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: getStatusColor(depositStatus.claimable)
              }}>
                {formatCurrency(depositStatus.claimable)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Ready to claim your shares
            </Typography>
          </Box>

          {/* Claimed Shares */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#f3e5f5', 
            borderRadius: '0.75em',
            border: '1px solid #9c27b0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: '#7b1fa2', mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#29262a' }}>
                  Claimed
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: getStatusColor(depositStatus.claimed)
              }}>
                {formatCurrency(depositStatus.claimed)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Successfully claimed shares
            </Typography>
          </Box>
        </Stack>

        {/* Claim Button */}
        {depositStatus.claimable > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="contained"
              onClick={handleClaimShares}
              disabled={isClaiming}
              sx={{
                ...styles.button.primary,
                height: '48px',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(90deg, #4caf50 0%, #2e7d32 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #4caf50 20%, #2e7d32 100%)'
                }
              }}
            >
              {isClaiming ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#FFFFFE' }} />
                  Claiming Shares...
                </>
              ) : (
                `Claim ${formatCurrency(depositStatus.claimable)} in Shares`
              )}
            </Button>
          </>
        )}

        {/* Last Updated */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Last updated: {new Date(depositStatus.lastUpdated).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 