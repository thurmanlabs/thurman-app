import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { usePolling } from "../hooks/usePolling";
import useAccount from "../hooks/useAccount";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";

// Thurman brand colors
const THURMAN_COLORS = {
  primary: "#725aa2",
  secondary: "#29262a",
  background: "#eff6fd",
  white: "#FFFFFE",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336"
};

// Types
interface PortfolioPosition {
  poolId: number;
  poolName: string;
  vaultAddress: string;
  assetAddress: string;
  sharesOwned: string;
  currentValue: number;
  totalInvested: number;
  totalClaimed: number;
  pendingAmount: number;
  claimableAmount: number;
  returnAmount: number;
  returnPercentage: number;
  lastUpdated: string;
}

interface PortfolioSummary {
  userAddress: string;
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  totalPositions: number;
  activePositions: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
}

interface PortfolioResponse {
  success: boolean;
  data: PortfolioSummary;
  message: string;
}

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatShares = (shares: string): string => {
  const num = parseFloat(shares);
  if (isNaN(num)) return "0";
  return num.toLocaleString();
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

// Loading skeleton components
const SummaryCardSkeleton = (): JSX.Element => (
  <Card sx={{ 
    borderRadius: "1.25em",
    backgroundColor: THURMAN_COLORS.white,
    boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
  }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={32} />
    </CardContent>
  </Card>
);

const TableSkeleton = (): JSX.Element => (
  <TableContainer component={Paper} sx={{ borderRadius: "1.25em", overflow: "hidden" }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Pool Name</TableCell>
          <TableCell>Shares Owned</TableCell>
          <TableCell>Current Value</TableCell>
          <TableCell>Performance</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton width={120} /></TableCell>
            <TableCell><Skeleton width={80} /></TableCell>
            <TableCell><Skeleton width={100} /></TableCell>
            <TableCell><Skeleton width={80} /></TableCell>
            <TableCell><Skeleton width={100} height={32} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Thurman branded button component interface
interface ThurmanButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  startIcon?: React.ReactNode;
  [key: string]: any; // For other Button props
}

const ThurmanButton = ({ children, onClick, variant = "contained", size = "medium", startIcon, ...props }: ThurmanButtonProps): JSX.Element => (
  <Button
    variant={variant}
    size={size}
    startIcon={startIcon}
    onClick={onClick}
    sx={{
      background: variant === "contained" ? "linear-gradient(90deg, #725aa2 0%, #29262a 100%)" : "transparent",
      color: variant === "contained" ? THURMAN_COLORS.white : THURMAN_COLORS.primary,
      borderRadius: "1.25em",
      textTransform: "none",
      fontWeight: 700,
      padding: size === "large" ? "0.75em 3em" : "0.325em 2.5em",
      border: variant === "outlined" ? `2px solid ${THURMAN_COLORS.primary}` : "none",
      "&:hover": {
        background: variant === "contained" 
          ? "linear-gradient(90deg, #725aa2 20%, #29262a 100%)"
          : "rgba(114, 90, 162, 0.1)",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(114, 90, 162, 0.3)",
      },
      "&:disabled": {
        background: "#E0E0E0",
        color: "#A0A0A0",
        transform: "none",
        boxShadow: "none"
      },
      transition: "all 0.2s ease-in-out",
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Button>
);

// Main Home component
export default function Home() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAccount();

  const userAddress = user?.account;

  // Portfolio data polling
  const {
    data: portfolioData,
    loading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio
  } = usePolling<PortfolioResponse>(`/api/user/portfolio/${userAddress}`, {
    interval: 30000, // 30 seconds
    enabled: !!userAddress,
    requiresAuth: true,
    onDataChange: (newData: PortfolioResponse | null, oldData: PortfolioResponse | null) => {
      if (newData?.data && oldData?.data) {
        const newValue = newData.data.currentValue;
        const oldValue = oldData.data.currentValue;
        const change = newValue - oldValue;
        const changePercent = oldValue > 0 ? (change / oldValue) * 100 : 0;

        // Show notification for significant changes (>1% or >$10)
        if (Math.abs(changePercent) > 1 || Math.abs(change) > 10) {
          const sign = change >= 0 ? "+" : "";
          enqueueSnackbar(
            `Portfolio ${change >= 0 ? "increased" : "decreased"} by ${sign}${formatCurrency(change)} (${sign}${changePercent.toFixed(2)}%)`,
            {
              variant: change >= 0 ? "success" : "warning",
              autoHideDuration: 5000,
              anchorOrigin: { vertical: "top", horizontal: "right" }
            }
          );
        }
      }
    }
  });

  const portfolio = portfolioData?.data;

  // Calculate pending and claimable totals
  const pendingTotal = portfolio?.positions.reduce((sum, pos) => sum + pos.pendingAmount, 0) || 0;
  const claimableTotal = portfolio?.positions.reduce((sum, pos) => sum + pos.claimableAmount, 0) || 0;

  // Handle refresh
  const handleRefresh = useCallback((): void => {
    refetchPortfolio();
    enqueueSnackbar("Portfolio data refreshed", {
      variant: "info",
      autoHideDuration: 2000,
      anchorOrigin: { vertical: "top", horizontal: "right" }
    });
  }, [refetchPortfolio, enqueueSnackbar]);

  // Handle pool navigation
  const handlePoolClick = useCallback((poolId: number): void => {
    navigate(`/pools/${poolId}`);
  }, [navigate]);

  // Handle browse pools
  const handleBrowsePools = useCallback((): void => {
    navigate("/pools");
  }, [navigate]);

  // Handle quick deposit
  const handleQuickDeposit = useCallback((poolId: number): void => {
    navigate(`/pools/${poolId}`);
  }, [navigate]);

  // Get performance color
  const getPerformanceColor = (percentage: number): "success" | "primary" | "error" => {
    if (percentage >= 5) return "success";
    if (percentage >= 0) return "primary";
    return "error";
  };

  // Get performance icon
  const getPerformanceIcon = (percentage: number): JSX.Element => {
    if (percentage >= 5) return <TrendingUpIcon />;
    if (percentage >= 0) return <ChartIcon />;
    return <ErrorIcon />;
  };

  return (
    <BackgroundContainer>
      <ContentContainer>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: THURMAN_COLORS.secondary, mb: 1 }}>
                Portfolio Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {userAddress ? `Welcome back, ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Connect your wallet to view your portfolio"}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {portfolio && (
                <Typography variant="body2" color="text.secondary">
                  Last updated: {formatRelativeTime(portfolio.lastUpdated)}
                </Typography>
              )}
              <Tooltip title="Refresh portfolio">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={portfolioLoading}
                  sx={{ color: THURMAN_COLORS.primary }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Authentication Required */}
          {!userAddress && (
            <Alert severity="info" sx={{ mb: 4 }}>
              Please connect your wallet to view your portfolio and start investing in lending pools.
            </Alert>
          )}

          {/* Error State */}
          {portfolioError && (
            <Alert 
              severity="error" 
              sx={{ mb: 4 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              Failed to load portfolio data: {portfolioError.message}
            </Alert>
          )}

          {/* Portfolio Overview */}
          {userAddress && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  {portfolioLoading ? (
                    <SummaryCardSkeleton />
                  ) : (
                    <Card sx={{ 
                      borderRadius: "1.25em",
                      backgroundColor: THURMAN_COLORS.white,
                      boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
                    }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <MoneyIcon sx={{ fontSize: 20, color: THURMAN_COLORS.primary }} />
                          <Typography variant="body2" color="text.secondary">
                            Total Invested
                          </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={600}>
                          {portfolio ? formatCurrency(portfolio.totalInvested) : "$0"}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  {portfolioLoading ? (
                    <SummaryCardSkeleton />
                  ) : (
                    <Card sx={{ 
                      borderRadius: "1.25em",
                      backgroundColor: THURMAN_COLORS.white,
                      boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
                    }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <AccountBalanceIcon sx={{ fontSize: 20, color: THURMAN_COLORS.success }} />
                          <Typography variant="body2" color="text.secondary">
                            Current Value
                          </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={600}>
                          {portfolio ? formatCurrency(portfolio.currentValue) : "$0"}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  {portfolioLoading ? (
                    <SummaryCardSkeleton />
                  ) : (
                    <Card sx={{ 
                      borderRadius: "1.25em",
                      backgroundColor: THURMAN_COLORS.white,
                      boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
                    }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <TrendingUpIcon sx={{ fontSize: 20, color: THURMAN_COLORS.success }} />
                          <Typography variant="body2" color="text.secondary">
                            Total Return
                          </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={600} color={(portfolio?.returnPercentage ?? 0) >= 0 ? THURMAN_COLORS.success : THURMAN_COLORS.error}>
                          {portfolio ? formatPercentage(portfolio.returnPercentage ?? 0) : "0%"}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  {portfolioLoading ? (
                    <SummaryCardSkeleton />
                  ) : (
                    <Card sx={{ 
                      borderRadius: "1.25em",
                      backgroundColor: THURMAN_COLORS.white,
                      boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
                    }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <ChartIcon sx={{ fontSize: 20, color: THURMAN_COLORS.primary }} />
                          <Typography variant="body2" color="text.secondary">
                            Active Positions
                          </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={600}>
                          {portfolio ? portfolio.activePositions : 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>

              {/* Pending & Claimable Summary */}
              {(pendingTotal > 0 || claimableTotal > 0) && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {pendingTotal > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ 
                        borderRadius: "1.25em",
                        backgroundColor: THURMAN_COLORS.white,
                        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
                        border: `2px solid ${THURMAN_COLORS.warning}`
                      }}>
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 20, color: THURMAN_COLORS.warning }} />
                                <Typography variant="body2" color="text.secondary">
                                  Pending Deposits
                                </Typography>
                              </Box>
                              <Typography variant="h6" fontWeight={600} color={THURMAN_COLORS.warning}>
                                {formatCurrency(pendingTotal)}
                              </Typography>
                            </Box>
                            <ThurmanButton
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate("/pools")}
                            >
                              View Pools
                            </ThurmanButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {claimableTotal > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ 
                        borderRadius: "1.25em",
                        backgroundColor: THURMAN_COLORS.white,
                        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
                        border: `2px solid ${THURMAN_COLORS.success}`
                      }}>
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 20, color: THURMAN_COLORS.success }} />
                                <Typography variant="body2" color="text.secondary">
                                  Claimable Amount
                                </Typography>
                              </Box>
                              <Typography variant="h6" fontWeight={600} color={THURMAN_COLORS.success}>
                                {formatCurrency(claimableTotal)}
                              </Typography>
                            </Box>
                            <ThurmanButton
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => navigate("/pools")}
                            >
                              Claim All
                            </ThurmanButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Positions Table */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: THURMAN_COLORS.secondary }}>
                    Your Positions
                  </Typography>
                  <ThurmanButton
                    startIcon={<AddIcon />}
                    onClick={handleBrowsePools}
                  >
                    Browse Pools
                  </ThurmanButton>
                </Box>

                {portfolioLoading ? (
                  <TableSkeleton />
                ) : portfolio?.positions && portfolio.positions.length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: "1.25em", overflow: "hidden" }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Pool Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Shares Owned</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Current Value</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portfolio.positions.map((position) => (
                          <TableRow key={position.poolId} hover>
                            <TableCell>
                              <Button
                                variant="text"
                                onClick={() => handlePoolClick(position.poolId)}
                                sx={{ 
                                  textTransform: "none", 
                                  fontWeight: 600,
                                  color: THURMAN_COLORS.primary,
                                  p: 0,
                                  minWidth: "auto"
                                }}
                              >
                                {position.poolName}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatShares(position.sharesOwned)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(position.currentValue)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getPerformanceIcon(position.returnPercentage)}
                                label={formatPercentage(position.returnPercentage)}
                                color={getPerformanceColor(position.returnPercentage)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Tooltip title="View Pool Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePoolClick(position.poolId)}
                                    sx={{ color: THURMAN_COLORS.primary }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Quick Deposit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQuickDeposit(position.poolId)}
                                    sx={{ color: THURMAN_COLORS.success }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                          <Card sx={{ 
          borderRadius: "1.25em",
          backgroundColor: THURMAN_COLORS.white,
          boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
        }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <AccountBalanceIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Positions Yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Start investing in lending pools to build your portfolio
                      </Typography>
                      <ThurmanButton
                        size="large"
                        onClick={handleBrowsePools}
                        startIcon={<AddIcon />}
                      >
                        Browse Available Pools
                      </ThurmanButton>
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Recent Activity Section */}
              {portfolio?.positions && portfolio.positions.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: THURMAN_COLORS.secondary, mb: 2 }}>
                    Recent Activity
                  </Typography>
                          <Card sx={{ 
          borderRadius: "1.25em",
          backgroundColor: THURMAN_COLORS.white,
          boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
        }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                        Recent activity will be displayed here once transaction history is implemented.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </>
          )}

          {/* Welcome Section for Non-Authenticated Users */}
          {!userAddress && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: THURMAN_COLORS.primary, mb: 3 }} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: THURMAN_COLORS.secondary, mb: 2 }}>
                Welcome to Thurman
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
                Connect your wallet to start investing in lending pools and track your portfolio performance in real-time.
              </Typography>
              <ThurmanButton
                size="large"
                onClick={handleBrowsePools}
                startIcon={<AddIcon />}
              >
                Browse Lending Pools
              </ThurmanButton>
            </Box>
          )}
        </Box>
      </ContentContainer>
    </BackgroundContainer>
  );
}
