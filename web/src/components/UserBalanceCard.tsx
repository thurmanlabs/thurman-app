import React from "react";
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
  const { balance, currency, lastUpdated, loading, error, refreshBalance } = useUserBalance();

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
        <CardContent sx={styles.containers.cardContent}>
          <Typography variant="h6" gutterBottom sx={styles.header.cardTitle}>
            USDC Balance
          </Typography>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: "0.75em" }} />
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
        <CardContent sx={styles.containers.cardContent}>
          <Typography variant="h6" gutterBottom sx={styles.header.cardTitle}>
            USDC Balance
          </Typography>
          
          <Alert severity="error" sx={styles.containers.alert}>
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
        <CardContent sx={styles.containers.cardContent}>
          <Typography variant="h6" gutterBottom sx={styles.header.cardTitle}>
            USDC Balance
          </Typography>
          
          <Box sx={styles.containers.emptyState}>
            <AccountBalanceIcon sx={styles.containers.iconLarge} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              Connect Wallet
            </Typography>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
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
      <CardContent sx={styles.containers.cardContent}>
        <Box sx={styles.containers.flexBetween}>
          <Typography variant="h6" sx={styles.header.cardTitle}>
            USDC Balance
          </Typography>
          
          <Tooltip title="Refresh balance">
            <IconButton
              onClick={handleRefresh}
              sx={styles.button.iconButton}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Balance Display */}
        <Box sx={{ 
          p: 3, 
          backgroundColor: "#f8f9fa", 
          borderRadius: "1em",
          border: `2px solid ${balanceStatus?.color || "#D3D3D3"}`,
          position: "relative",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <Box sx={styles.containers.flexBetween}>
            <Box sx={styles.containers.flexCenter}>
              <StatusIcon sx={{ 
                color: balanceStatus?.color || "#666", 
                mr: 2,
                fontSize: 32
              }} />
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  color: "#29262a",
                  lineHeight: 1
                }}>
                  {formatCurrency(balance)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
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
              backgroundColor: balanceStatus.color,
              color: "white",
              borderRadius: "0.5em",
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
          <Box sx={{ mt: 2 }}>
            {balanceStatus.status === "empty" && (
              <Alert severity="warning" sx={{ borderRadius: "0.75em" }}>
                Your USDC balance is empty. Add funds to start investing.
              </Alert>
            )}
            {balanceStatus.status === "low" && (
              <Alert severity="info" sx={{ borderRadius: "0.75em" }}>
                Your balance is low. Consider adding more USDC for better investment opportunities.
              </Alert>
            )}
            {balanceStatus.status === "moderate" && (
              <Alert severity="success" sx={{ borderRadius: "0.75em" }}>
                Good balance! You're ready to make deposits.
              </Alert>
            )}
            {balanceStatus.status === "good" && (
              <Alert severity="success" sx={{ borderRadius: "0.75em" }}>
                Excellent balance! You have plenty of USDC for investments.
              </Alert>
            )}
          </Box>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "#999" }}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 