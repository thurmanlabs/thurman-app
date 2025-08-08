import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from "axios";
import { styles } from "../styles/styles";

interface UserBalanceCardProps {
  userAddress?: string;
  onBalanceUpdate?: (balance: number) => void;
}

interface BalanceData {
  balance: number;
  lastUpdated: string;
  currency: string;
}

export default function UserBalanceCard({
  userAddress,
  onBalanceUpdate
}: UserBalanceCardProps) {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch balance data
  const fetchBalance = async (showLoading = true) => {
    if (!userAddress) return;

    if (showLoading) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);

    try {
      // TODO: Replace with actual balance API endpoint
      // For now, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock balance data - replace with actual API call
      const mockBalance = Math.random() * 10000; // Random balance between 0-10k
      const newBalanceData: BalanceData = {
        balance: mockBalance,
        lastUpdated: new Date().toISOString(),
        currency: 'USDC'
      };

      setBalanceData(newBalanceData);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(newBalanceData.balance);
      }

      // Clear any previous errors
      setError(null);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch balance';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userAddress) {
      fetchBalance();
    }
  }, [userAddress]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchBalance(false);
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

  // Get balance status
  const getBalanceStatus = (balance: number) => {
    if (balance === 0) return { status: 'empty', color: '#d32f2f', icon: WarningIcon };
    if (balance < 100) return { status: 'low', color: '#ed6c02', icon: WarningIcon };
    if (balance < 1000) return { status: 'moderate', color: '#f57c00', icon: TrendingUpIcon };
    return { status: 'good', color: '#2e7d32', icon: TrendingUpIcon };
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
            USDC Balance
          </Typography>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '0.75em' }} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ 
        borderRadius: '1.25em',
        backgroundColor: '#FFFFFE',
        boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#29262a' }}>
            USDC Balance
          </Typography>
          
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={isRefreshing}
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{
              borderColor: '#d32f2f',
              color: '#d32f2f',
              '&:hover': {
                borderColor: '#b71c1c',
                backgroundColor: 'rgba(211, 47, 47, 0.04)'
              }
            }}
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No user address state
  if (!userAddress) {
    return (
      <Card sx={{ 
        borderRadius: '1.25em',
        backgroundColor: '#FFFFFE',
        boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#29262a' }}>
            USDC Balance
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 3,
            color: '#666'
          }}>
            <AccountBalanceIcon sx={{ fontSize: 48, mb: 2, color: '#D3D3D3' }} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              Connect Wallet
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Connect your wallet to view your USDC balance
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const balanceStatus = balanceData ? getBalanceStatus(balanceData.balance) : null;
  const StatusIcon = balanceStatus?.icon || AccountBalanceIcon;

  return (
    <Card sx={{ 
      borderRadius: '1.25em',
      backgroundColor: '#FFFFFE',
      boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#29262a' }}>
            USDC Balance
          </Typography>
          
          <Tooltip title="Refresh balance">
            <IconButton
              onClick={handleRefresh}
              disabled={isRefreshing}
              sx={{ 
                color: '#725aa2',
                '&:hover': { backgroundColor: 'rgba(114, 90, 162, 0.04)' }
              }}
            >
              {isRefreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Balance Display */}
        <Box sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa', 
          borderRadius: '1em',
          border: `2px solid ${balanceStatus?.color || '#D3D3D3'}`,
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StatusIcon sx={{ 
                color: balanceStatus?.color || '#666', 
                mr: 2,
                fontSize: 32
              }} />
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  color: '#29262a',
                  lineHeight: 1
                }}>
                  {formatCurrency(balanceData?.balance || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                  Available for deposits
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Balance Status Indicator */}
          {balanceStatus && (
            <Box sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              px: 1.5,
              py: 0.5,
              backgroundColor: balanceStatus.color,
              color: 'white',
              borderRadius: '0.5em',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {balanceStatus.status}
            </Box>
          )}
        </Box>

        {/* Balance Status Message */}
        {balanceStatus && (
          <Box sx={{ mt: 2 }}>
            {balanceStatus.status === 'empty' && (
              <Alert severity="warning" sx={{ borderRadius: '0.75em' }}>
                Your USDC balance is empty. Add funds to start investing.
              </Alert>
            )}
            {balanceStatus.status === 'low' && (
              <Alert severity="info" sx={{ borderRadius: '0.75em' }}>
                Your balance is low. Consider adding more USDC for better investment opportunities.
              </Alert>
            )}
            {balanceStatus.status === 'moderate' && (
              <Alert severity="success" sx={{ borderRadius: '0.75em' }}>
                Good balance! You're ready to make deposits.
              </Alert>
            )}
            {balanceStatus.status === 'good' && (
              <Alert severity="success" sx={{ borderRadius: '0.75em' }}>
                Excellent balance! You have plenty of USDC for investments.
              </Alert>
            )}
          </Box>
        )}

        {/* Last Updated */}
        {balanceData && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Last updated: {new Date(balanceData.lastUpdated).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 