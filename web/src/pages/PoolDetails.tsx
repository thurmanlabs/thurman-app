import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Button,
  Alert,
  Divider,
  Paper,
  Stack,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import DepositInterface from "../components/DepositInterface";
import UserBalanceCard from "../components/UserBalanceCard";
import useAccount from "../hooks/useAccount";
import { usePolling } from "../hooks/usePolling";
import { styles } from "../styles/styles";
import axios from "axios";

// Types
interface PoolConfig {
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  maxDepositAmount: string;
  minDepositAmount: string;
  depositCap: string;
}

interface PoolData {
  id: number;
  name: string;
  vault: string;
  asset: string;
  totalAssets: string;
  totalShares: string;
  availableCapacity: string;
  config: PoolConfig;
  lastUpdated: Date;
}

interface DepositStatus {
  poolId: number;
  userAddress: string;
  pending: number;
  claimable: number;
  claimed: number;
  lastUpdated: string;
  hasActivity: boolean;
}

interface PoolResponse {
  success: boolean;
  data: {
    pool: PoolData;
    metadata: {
      poolId: number;
      lastUpdated: Date;
      cached: boolean;
      cacheAge: number;
      timestamp: string;
    };
  };
}

// Loading skeleton components
const PoolHeaderSkeleton = (): JSX.Element => (
  <Box sx={styles.containers.sectionHeader}>
    <Skeleton variant="text" width="60%" height={48} sx={styles.containers.skeletonLarge} />
    <Box sx={styles.containers.filterChips}>
      <Skeleton variant="rectangular" width={120} height={32} />
      <Skeleton variant="rectangular" width={100} height={32} />
      <Skeleton variant="rectangular" width={80} height={32} />
    </Box>
  </Box>
);

const PoolStatsSkeleton = (): JSX.Element => (
  <Card sx={styles.metrics.card}>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={styles.containers.skeletonLarge} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="100%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="100%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const UserStatusSkeleton = (): JSX.Element => (
  <Card sx={styles.metrics.card}>
    <CardContent>
      <Skeleton variant="text" width="50%" height={32} sx={styles.containers.skeletonLarge} />
      <Box sx={styles.containers.filterChips}>
        <Skeleton variant="rectangular" width={100} height={32} />
        <Skeleton variant="rectangular" width={100} height={32} />
        <Skeleton variant="rectangular" width={100} height={32} />
      </Box>
      <Skeleton variant="text" width="100%" height={20} />
    </CardContent>
  </Card>
);

// Pool Stats Card Component
interface PoolStatsCardProps {
  pool: PoolData;
  loading: boolean;
}

const PoolStatsCard: React.FC<PoolStatsCardProps> = ({ pool, loading }) => {
  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatMinDeposit = (minAmount: string): string => {
    const num = parseFloat(minAmount);
    if (isNaN(num)) return "No minimum";
    return `${formatCurrency(minAmount)} minimum`;
  };

  if (loading) {
    return <PoolStatsSkeleton />;
  }

  return (
    <Card sx={{
      ...styles.metrics.card,
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <CardContent sx={styles.containers.cardContent}>
        <Typography variant="h6" gutterBottom sx={styles.header.cardTitle}>
          Pool Statistics
        </Typography>
        
        <Grid container spacing={3} sx={styles.containers.gridContainer}>
          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <TrendingUpIcon sx={styles.containers.iconMedium} />
              <Typography variant="body2" color="text.secondary">
                Total Value Locked
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {formatCurrency(pool.totalAssets || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <AccountBalanceIcon sx={styles.containers.iconMedium} />
              <Typography variant="body2" color="text.secondary">
                Minimum Deposit
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {formatMinDeposit(pool.config?.minDepositAmount || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <ScheduleIcon sx={styles.containers.iconMedium} />
              <Typography variant="body2" color="text.secondary">
                Available Capacity
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {formatCurrency(pool.availableCapacity || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <CheckCircleIcon sx={styles.containers.iconMedium} />
              <Typography variant="body2" color="text.secondary">
                Deposit Status
              </Typography>
            </Box>
            <Chip
              label={pool.config?.depositsEnabled ? "Open for Deposits" : "Closed"}
              color={pool.config?.depositsEnabled ? "success" : "default"}
              size="small"
              variant={pool.config?.depositsEnabled ? "filled" : "outlined"}
            />
          </Grid>
        </Grid>

        <Divider sx={styles.containers.divider} />
        
        <Typography variant="body2" color="text.secondary" sx={styles.typography.bodyTextSecondary}>
          Last updated: {pool.lastUpdated ? new Date(pool.lastUpdated).toLocaleString() : "Unknown"}
        </Typography>
      </CardContent>
    </Card>
  );
};



// Main PoolDetails Component
export default function PoolDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAccount();
  
  const [pool, setPool] = useState<PoolData | null>(null);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  const poolId = id ? parseInt(id, 10) : null;
  const userAddress = user?.account || null;

  // Fetch pool data
  const fetchPool = useCallback(async (): Promise<void> => {
    if (!poolId) return;

    try {
      setPoolLoading(true);
      setPoolError(null);

      const response = await axios.get<PoolResponse>(`/api/loan-pools/pools/${poolId}`);
      
      if (response.data.success) {
        setPool(response.data.data.pool);
      } else {
        setPoolError("Failed to fetch pool data");
      }
    } catch (err: any) {
      console.error("Error fetching pool:", err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setPoolError("Pool not found");
        } else {
          setPoolError(err.response?.data?.message || "Failed to fetch pool data");
        }
      } else {
        setPoolError("An unexpected error occurred");
      }
    } finally {
      setPoolLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  // Note: Deposit status polling is now handled by the DepositInterface component

  // Update document title
  useEffect(() => {
    if (pool) {
      document.title = `${pool.name} - Pool Details - Thurman`;
    } else {
      document.title = "Pool Details - Thurman";
    }
  }, [pool]);

  // Handle back navigation
  const handleBack = (): void => {
    navigate("/pools");
  };

  // Error state
  if (poolError) {
    return (
      <BackgroundContainer>
        <ContentContainer>
          <Box sx={styles.containers.pageContainer}>
            <Box sx={styles.containers.flexCenter}>
              <IconButton onClick={handleBack} sx={styles.containers.backButton}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" sx={styles.header.pageTitle}>
                Pool Details
              </Typography>
            </Box>

            <Alert 
              severity="error" 
              sx={styles.containers.alert}
              action={
                <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              }
            >
              {poolError}
            </Alert>

            <Button 
              variant="outlined" 
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={styles.button.outlined}
            >
              Back to Pools
            </Button>
          </Box>
        </ContentContainer>
      </BackgroundContainer>
    );
  }

  return (
    <BackgroundContainer>
      <ContentContainer>
        <Box sx={styles.containers.pageContainer}>
          {/* Header */}
          <Box sx={styles.containers.flexCenter}>
            <IconButton onClick={handleBack} sx={styles.containers.backButton}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              {poolLoading ? (
                <Skeleton variant="text" width="60%" height={48} />
              ) : pool ? (
                <Typography variant="h4" component="h1" sx={styles.header.pageTitle}>
                  {pool.name || `Pool ${pool.id}`}
                </Typography>
              ) : (
                <Typography variant="h4" component="h1" sx={styles.header.pageTitle}>
                  Pool Details
                </Typography>
              )}
            </Box>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => window.location.reload()}
                sx={styles.button.iconButton}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Pool Status */}
          {pool && (
            <Box sx={{ ...styles.containers.chipContainer, mb: 8 }}>
              <Chip
                label={pool.config?.depositsEnabled ? "Open for Deposits" : "Closed"}
                color={pool.config?.depositsEnabled ? "success" : "default"}
                variant={pool.config?.depositsEnabled ? "filled" : "outlined"}
              />
              <Chip
                label={`Pool ID: ${pool.id}`}
                variant="outlined"
                size="small"
              />
            </Box>
          )}

          {/* Main Content Grid */}
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {/* Pool Statistics */}
            <Grid item xs={12} lg={8} sx={{ display: "flex" }}>
              {pool && <PoolStatsCard pool={pool} loading={poolLoading} />}
            </Grid>

            {/* USDC Balance Card - Only show for open pools */}
            {pool?.config?.depositsEnabled && (
              <Grid item xs={12} lg={4} sx={{ display: "flex" }}>
                <UserBalanceCard
                  userAddress={user?.account}
                  onBalanceUpdate={() => {}}
                />
              </Grid>
            )}
          </Grid>

          {/* Deposit Interface - Only show for open pools */}
          {pool?.config?.depositsEnabled && (
            <Box sx={{ mb: 8 }}>
              <DepositInterface
                poolId={pool.id}
                poolName={pool.name}
                minDeposit={parseFloat(pool.config.minDepositAmount)}
                maxDeposit={parseFloat(pool.config.maxDepositAmount)}
                hideBalanceCard={true} // Hide the balance card since it's now in the main grid
              />
            </Box>
          )}

          {/* Closed Pool Message */}
          {pool && !pool.config?.depositsEnabled && (
            <Box sx={{ mb: 8 }}>
              <Card sx={styles.metrics.card}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={styles.header.cardTitle}>
                    Pool Status
                  </Typography>
                  <Alert severity="info" sx={styles.containers.alert}>
                    This pool is currently closed for new deposits.
                  </Alert>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </ContentContainer>
    </BackgroundContainer>
  );
} 