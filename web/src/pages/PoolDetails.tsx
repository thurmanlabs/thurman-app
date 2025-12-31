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
      <CardContent sx={{ p: "2rem" }}>
        <Typography variant="h6" sx={{
          ...styles.header.cardTitle,
          fontSize: "1rem",
          mb: 2.5
        }}>
          Pool Statistics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <TrendingUpIcon sx={styles.metrics.icon} />
              <Typography variant="body2" sx={{
                fontSize: "0.875rem",
                color: "#666",
                fontWeight: 500
              }}>
                Total Value Locked
              </Typography>
            </Box>
            <Typography sx={styles.metrics.value}>
              {formatCurrency(pool.totalAssets || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <AccountBalanceIcon sx={styles.metrics.icon} />
              <Typography variant="body2" sx={{
                fontSize: "0.875rem",
                color: "#666",
                fontWeight: 500
              }}>
                Minimum Deposit
              </Typography>
            </Box>
            <Typography sx={{
              ...styles.metrics.value,
              fontSize: "1.125rem"
            }}>
              {formatMinDeposit(pool.config?.minDepositAmount || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <ScheduleIcon sx={styles.metrics.icon} />
              <Typography variant="body2" sx={{
                fontSize: "0.875rem",
                color: "#666",
                fontWeight: 500
              }}>
                Available Capacity
              </Typography>
            </Box>
            <Typography sx={styles.metrics.value}>
              {formatCurrency(pool.availableCapacity || "0")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={styles.containers.iconContainer}>
              <CheckCircleIcon sx={styles.metrics.icon} />
              <Typography variant="body2" sx={{
                fontSize: "0.875rem",
                color: "#666",
                fontWeight: 500
              }}>
                Deposit Status
              </Typography>
            </Box>
            <Chip
              label={pool.config?.depositsEnabled ? "Open for Deposits" : "Closed"}
              size="small"
              sx={{
                backgroundColor: pool.config?.depositsEnabled ? "transparent" : "transparent",
                color: pool.config?.depositsEnabled ? "#725aa2" : "#666",
                border: pool.config?.depositsEnabled ? "1px solid #725aa2" : "1px solid #E9ECEF",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "24px",
                "& .MuiChip-label": {
                  padding: "0 0.5rem"
                }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ 
          my: 2.5,
          borderColor: "#E9ECEF"
        }} />
        
        <Typography variant="body2" sx={{
          fontSize: "0.875rem",
          color: "#666"
        }}>
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
            <Box sx={{
              display: "flex",
              alignItems: "center",
              mb: 3
            }}>
              <IconButton 
                onClick={handleBack} 
                sx={{
                  mr: 2,
                  color: "#29262a",
                  "&:hover": {
                    backgroundColor: "rgba(41, 38, 42, 0.08)"
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="h1" sx={{
                color: "#29262a",
                fontWeight: 600,
                fontSize: "1.5rem"
              }}>
                Pool Details
              </Typography>
            </Box>

            <Alert 
              severity="error" 
              sx={{
                borderRadius: "0.625rem",
                fontSize: "0.9375rem",
                mb: 3
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => window.location.reload()}
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500
                  }}
                >
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
          <Box sx={{
            display: "flex",
            alignItems: "center",
            mb: 3
          }}>
            <IconButton 
              onClick={handleBack} 
              sx={{
                mr: 2,
                color: "#29262a",
                "&:hover": {
                  backgroundColor: "rgba(41, 38, 42, 0.08)"
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              {poolLoading ? (
                <Skeleton variant="text" width="60%" height={32} />
              ) : pool ? (
                <Typography variant="h6" component="h1" sx={{
                  color: "#29262a",
                  fontWeight: 600,
                  fontSize: "1.5rem"
                }}>
                  {pool.name || `Pool ${pool.id}`}
                </Typography>
              ) : (
                <Typography variant="h6" component="h1" sx={{
                  color: "#29262a",
                  fontWeight: 600,
                  fontSize: "1.5rem"
                }}>
                  Pool Details
                </Typography>
              )}
            </Box>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => window.location.reload()}
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

          {/* Pool Status */}
          {pool && (
            <Box sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 4
            }}>
              <Chip
                label={pool.config?.depositsEnabled ? "Open for Deposits" : "Closed"}
                size="small"
                sx={{
                  backgroundColor: pool.config?.depositsEnabled ? "transparent" : "transparent",
                  color: pool.config?.depositsEnabled ? "#725aa2" : "#666",
                  border: pool.config?.depositsEnabled ? "1px solid #725aa2" : "1px solid #E9ECEF",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  height: "24px",
                  "& .MuiChip-label": {
                    padding: "0 0.5rem"
                  }
                }}
              />
              <Chip
                label={`Pool ID: ${pool.id}`}
                size="small"
                sx={{
                  backgroundColor: "transparent",
                  color: "#666",
                  border: "1px solid #E9ECEF",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  height: "24px",
                  "& .MuiChip-label": {
                    padding: "0 0.5rem"
                  }
                }}
              />
            </Box>
          )}

          {/* Main Content Grid */}
          <Grid container spacing={3.5} sx={{ mb: 6 }}>
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
            <Box sx={{ mt: 8, mb: 6 }}>
              <DepositInterface
                poolId={pool.id}
                poolName={pool.name}
                minDeposit={Math.min(parseFloat(pool.config.minDepositAmount || "1000000"), 0.001)} // Override for testing
                maxDeposit={parseFloat(pool.config.maxDepositAmount)}
                hideBalanceCard={true} // Hide the balance card since it's now in the main grid
              />
            </Box>
          )}

          {/* Closed Pool Message */}
          {pool && !pool.config?.depositsEnabled && (
            <Box sx={{ mb: 6 }}>
              <Card sx={styles.metrics.card}>
                <CardContent sx={{ p: "2rem" }}>
                  <Typography variant="h6" sx={{
                    ...styles.header.cardTitle,
                    fontSize: "1rem",
                    mb: 2
                  }}>
                    Pool Status
                  </Typography>
                  <Alert 
                    severity="info" 
                    sx={{
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem"
                    }}
                  >
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