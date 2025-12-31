import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Skeleton
} from "@mui/material";
import {
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import axios from "axios";
import { styles } from "../styles/styles";

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
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Handle claim shares
  const handleClaimShares = async () => {
    if (!depositStatus || depositStatus.claimable <= 0 || isClaiming) return;

    setIsClaiming(true);
    setNotification(null);

    try {
      const response = await axios.post("/api/deposits/claim", {
        poolId,
        amount: depositStatus.claimable.toString()
      });

      if (response.data.success) {
        const { transactionId } = response.data.data;
        
        setNotification({
          type: "success",
          message: `Shares claimed successfully! Transaction ID: ${transactionId}`
        });

        if (onClaimSuccess) {
          onClaimSuccess(transactionId);
        }
      } else {
        throw new Error(response.data.error || "Claim failed");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to claim shares";
      
              setNotification({
          type: "error",
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
  const clearNotification = (): void => {
    setNotification(null);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <Card sx={styles.metrics.card}>
        <CardContent sx={{ p: "2rem" }}>
          <Typography variant="h6" sx={{
            ...styles.header.cardTitle,
            fontSize: "1rem",
            mb: 2.5
          }}>
            Your Deposit Status
          </Typography>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: "0.625rem" }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: "0.625rem" }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: "0.625rem" }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // No activity state
  if (!depositStatus || !depositStatus.hasActivity) {
    return (
      <Card sx={styles.metrics.card}>
        <CardContent sx={{ p: "2rem" }}>
          <Typography variant="h6" sx={{
            ...styles.header.cardTitle,
            fontSize: "1rem",
            mb: 2.5
          }}>
            Your Deposit Status
          </Typography>
          
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            py: 4,
            color: "#666"
          }}>
            <AccountBalanceIcon sx={{ fontSize: 48, mb: 2, color: "#D3D3D3" }} />
            <Typography variant="body1" sx={{ 
              mb: 1, 
              fontWeight: 500,
              fontSize: "0.9375rem",
              color: "#29262a"
            }}>
              No deposits yet
            </Typography>
            <Typography variant="body2" sx={{ 
              textAlign: "center",
              fontSize: "0.9375rem",
              color: "#666"
            }}>
              Make your first deposit to see your status here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={styles.metrics.card}>
      <CardContent sx={{ p: "2rem" }}>
        <Typography variant="h6" sx={{
          ...styles.header.cardTitle,
          fontSize: "1rem",
          mb: 1.5
        }}>
          Your Deposit Status
        </Typography>
        
        <Typography variant="body2" sx={{ 
          mb: 3, 
          fontSize: "0.9375rem",
          color: "#666"
        }}>
          Track your deposits in {poolName}
        </Typography>

        {/* Notification Alert */}
        {notification && (
          <Alert 
            severity={notification.type} 
            onClose={clearNotification}
            sx={{ 
              mb: 3,
              borderRadius: "0.625rem",
              fontSize: "0.9375rem"
            }}
          >
            {notification.message}
          </Alert>
        )}

        {/* Status Items */}
        <Stack spacing={2.5} sx={{ mb: 3 }}>
          {/* Pending Deposits */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: "#FAFAFA", 
            borderRadius: "0.625rem",
            border: "1px solid #E9ECEF"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PendingIcon sx={{ color: "#666", mr: 1, fontSize: "1.25rem" }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  fontSize: "0.9375rem",
                  color: "#29262a" 
                }}>
                  Pending
                </Typography>
              </Box>
              <Typography sx={styles.metrics.value}>
                {formatCurrency(depositStatus.pending)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              mt: 1, 
              fontSize: "0.875rem",
              color: "#666" 
            }}>
              Awaiting fulfillment by admin
            </Typography>
          </Box>

          {/* Claimable Shares */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: "#FAFAFA", 
            borderRadius: "0.625rem",
            border: "1px solid #E9ECEF"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUpIcon sx={{ color: "#666", mr: 1, fontSize: "1.25rem" }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  fontSize: "0.9375rem",
                  color: "#29262a" 
                }}>
                  Claimable
                </Typography>
              </Box>
              <Typography sx={styles.metrics.value}>
                {formatCurrency(depositStatus.claimable)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              mt: 1, 
              fontSize: "0.875rem",
              color: "#666" 
            }}>
              Ready to claim your shares
            </Typography>
          </Box>

          {/* Claimed Shares */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: "#FAFAFA", 
            borderRadius: "0.625rem",
            border: "1px solid #E9ECEF"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon sx={{ color: "#666", mr: 1, fontSize: "1.25rem" }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  fontSize: "0.9375rem",
                  color: "#29262a" 
                }}>
                  Claimed
                </Typography>
              </Box>
              <Typography sx={styles.metrics.value}>
                {formatCurrency(depositStatus.claimed)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              mt: 1, 
              fontSize: "0.875rem",
              color: "#666" 
            }}>
              Successfully claimed shares
            </Typography>
          </Box>
        </Stack>

        {/* Claim Button */}
        {depositStatus.claimable > 0 && (
          <>
            <Divider sx={{ 
              my: 2.5,
              borderColor: "#E9ECEF"
            }} />
            <Button
              fullWidth
              variant="contained"
              onClick={handleClaimShares}
              disabled={isClaiming}
              sx={styles.button.primary}
            >
              {isClaiming ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "#FFFFFE" }} />
                  Claiming Shares...
                </>
              ) : (
                `Claim ${formatCurrency(depositStatus.claimable)} in Shares`
              )}
            </Button>
          </>
        )}

        {/* Last Updated */}
        <Box sx={{ mt: 2.5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ 
            fontSize: "0.875rem",
            color: "#666" 
          }}>
            Last updated: {new Date(depositStatus.lastUpdated).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 