import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Skeleton
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import { styles } from "../styles/styles";
import useUserBalance from "../hooks/useUserBalance";

interface UserBalanceCardProps {
  userAddress?: string;
  onBalanceUpdate?: (balance: number) => void;
}

export default function UserBalanceCard({
  userAddress,
  onBalanceUpdate
}: UserBalanceCardProps) {
  const { balance, lastUpdated, loading, error, refreshBalance } = useUserBalance();

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      const newBalanceData = await refreshBalance();
      if (onBalanceUpdate && newBalanceData) {
        onBalanceUpdate(newBalanceData.balance);
      }
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get balance status
  const getBalanceStatus = (balance: number) => {
      if (balance === 0) return { status: "empty", color: "#d32f2f", icon: WarningIcon };
  if (balance < 100) return { status: "low", color: "#ed6c02", icon: WarningIcon };
  if (balance < 1000) return { status: "moderate", color: "#f57c00", icon: TrendingUpIcon };
  return { status: "good", color: "#2e7d32", icon: TrendingUpIcon };
  };

  // Loading state
  if (loading) {
    return (
      <Card sx={{
        ...styles.metrics.card,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
      <CardContent sx={{ p: "2rem" }}>
        <Typography variant="h6" sx={{
          ...styles.header.cardTitle,
          fontSize: "1rem",
          mb: 2.5
        }}>
          USDC Balance
        </Typography>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: "0.625rem" }} />
      </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{
        ...styles.metrics.card,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
        <CardContent sx={{ p: "2rem" }}>
          <Typography variant="h6" sx={{
            ...styles.header.cardTitle,
            fontSize: "1rem",
            mb: 2
          }}>
            USDC Balance
          </Typography>
          
          <Alert severity="error" sx={{
            borderRadius: "0.625rem",
            fontSize: "0.9375rem"
          }}>
            {error}
          </Alert>
          
          <Button
            variant="outlined"
            onClick={handleRefresh}
            sx={styles.button.outlined}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No user address state
  if (!userAddress) {
    return (
      <Card sx={{
        ...styles.metrics.card,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
        <CardContent sx={{ p: "2rem" }}>
          <Typography variant="h6" sx={{
            ...styles.header.cardTitle,
            fontSize: "1rem",
            mb: 2.5
          }}>
            USDC Balance
          </Typography>
          
          <Box sx={styles.containers.emptyState}>
            <AccountBalanceIcon sx={styles.containers.iconLarge} />
            <Typography variant="body1" sx={{ 
              mb: 1, 
              fontWeight: 500,
              fontSize: "0.9375rem",
              color: "#29262a"
            }}>
              Connect Wallet
            </Typography>
            <Typography variant="body2" sx={{ 
              textAlign: "center",
              fontSize: "0.9375rem",
              color: "#666"
            }}>
              Connect your wallet to view your USDC balance
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const balanceStatus = getBalanceStatus(balance);
  const StatusIcon = balanceStatus?.icon || AccountBalanceIcon;

  return (
    <Card sx={{
      ...styles.metrics.card,
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <CardContent sx={{ p: "2rem" }}>
        <Box sx={styles.containers.flexBetween}>
          <Typography variant="h6" sx={{
            ...styles.header.cardTitle,
            fontSize: "1rem"
          }}>
            USDC Balance
          </Typography>
          
          <Tooltip title="Refresh balance">
            <IconButton
              onClick={handleRefresh}
              sx={{
                color: "#29262a",
                "&:hover": {
                  backgroundColor: "rgba(41, 38, 42, 0.08)"
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Balance Display */}
        <Box sx={{ 
          p: 3, 
          backgroundColor: "#FAFAFA", 
          borderRadius: "0.625rem",
          border: `1px solid #E9ECEF`,
          position: "relative",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          mt: 2.5
        }}>
          <Box sx={styles.containers.flexBetween}>
            <Box sx={styles.containers.flexCenter}>
              <StatusIcon sx={{ 
                color: balanceStatus?.color || "#666", 
                mr: 2,
                fontSize: 32
              }} />
              <Box>
                <Typography sx={styles.metrics.value}>
                  {formatCurrency(balance)}
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: "0.875rem",
                  color: "#666", 
                  mt: 0.5 
                }}>
                  Available for deposits
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Balance Status Indicator */}
          {balanceStatus && (
            <Box sx={{ 
              position: "absolute",
              top: 8,
              right: 8,
              px: 1.5,
              py: 0.5,
              backgroundColor: "transparent",
              color: balanceStatus.color,
              border: `1px solid ${balanceStatus.color}`,
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase"
            }}>
              {balanceStatus.status}
            </Box>
          )}
        </Box>

        {/* Balance Status Message */}
        {balanceStatus && (
          <Box sx={{ mt: 2.5 }}>
            {balanceStatus.status === "empty" && (
              <Alert severity="warning" sx={{ 
                borderRadius: "0.625rem",
                fontSize: "0.9375rem"
              }}>
                Your USDC balance is empty. Add funds to start investing.
              </Alert>
            )}
            {balanceStatus.status === "low" && (
              <Alert severity="info" sx={{ 
                borderRadius: "0.625rem",
                fontSize: "0.9375rem"
              }}>
                Your balance is low. Consider adding more USDC for better investment opportunities.
              </Alert>
            )}
            {balanceStatus.status === "moderate" && (
              <Alert severity="success" sx={{ 
                borderRadius: "0.625rem",
                fontSize: "0.9375rem"
              }}>
                Good balance! You're ready to make deposits.
              </Alert>
            )}
            {balanceStatus.status === "good" && (
              <Alert severity="success" sx={{ 
                borderRadius: "0.625rem",
                fontSize: "0.9375rem"
              }}>
                Excellent balance! You have plenty of USDC for investments.
              </Alert>
            )}
          </Box>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <Box sx={{ mt: 2.5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ 
              fontSize: "0.875rem",
              color: "#666" 
            }}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 