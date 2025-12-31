import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon
} from "@mui/icons-material";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import { styles } from "../styles/styles";
import axios from "axios";

// Types for pool data
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

interface PoolsResponse {
  success: boolean;
  message: string;
  data: {
    pools: PoolData[];
    metadata: {
      totalPools: number;
      successfullyLoaded: number;
      failedToLoad: number;
      lastUpdated: Date;
      cached: boolean;
      cacheAge: number;
      timestamp: string;
    };
  };
}

// Loading skeleton component
const PoolCardSkeleton = (): JSX.Element => (
  <Card sx={styles.metrics.card}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={100} height={32} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    </CardContent>
  </Card>
);

// Pool card component
interface PoolCardProps {
  pool: PoolData;
  onClick: () => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onClick }) => {
  // Format currency values
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

  // Format minimum deposit
  const formatMinDeposit = (minAmount: string): string => {
    const num = parseFloat(minAmount);
    if (isNaN(num)) return "No minimum";
    return `${formatCurrency(minAmount)} minimum`;
  };

  // Get status color and text
  const getStatusInfo = (): { color: "success" | "default"; text: string } => {
    if (pool.config?.depositsEnabled) {
      return { color: "success" as const, text: "Open for Deposits" };
    }
    return { color: "default" as const, text: "Closed" };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card 
      sx={{ 
        ...styles.metrics.card,
        cursor: "pointer",
        transition: "background-color 0.15s ease-in-out",
        "&:hover": {
          backgroundColor: "rgba(114, 90, 162, 0.015)"
        }
      }}
    >
      <Box 
        onClick={onClick}
        sx={{ 
          height: "100%", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "stretch",
          cursor: "pointer"
        }}
      >
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {/* Pool Name */}
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: "1.125rem", mb: 1.5, color: "#29262a" }}>
            {pool.name || `Pool ${pool.id}`}
          </Typography>

          {/* Status Chip */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={statusInfo.text}
              size="small"
              sx={{
                backgroundColor: statusInfo.color === "success" ? "transparent" : "transparent",
                color: statusInfo.color === "success" ? "#725aa2" : "#666",
                border: statusInfo.color === "success" ? "1px solid #725aa2" : "1px solid #E9ECEF",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "24px"
              }}
            />
          </Box>

          {/* Key Metrics */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1.75, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: "#666", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: "0.9375rem", color: "#29262a", fontWeight: 500 }}>
                TVL: <Box component="span" sx={{ fontWeight: 600 }}>{formatCurrency(pool.totalAssets || "0")}</Box>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <AccountBalanceIcon sx={{ fontSize: 18, color: "#666", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: "0.9375rem", color: "#29262a", fontWeight: 500 }}>
                Min: <Box component="span" sx={{ fontWeight: 600 }}>{formatMinDeposit(pool.config?.minDepositAmount || "0")}</Box>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <ScheduleIcon sx={{ fontSize: 18, color: "#666", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: "0.9375rem", color: "#666" }}>
                Updated: {pool.lastUpdated ? new Date(pool.lastUpdated).toLocaleDateString() : "Unknown"}
              </Typography>
            </Box>
          </Box>

          {/* Available Capacity */}
          {pool.config?.depositsEnabled && (
            <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid #E9ECEF" }}>
              <Typography variant="caption" display="block" sx={{ fontSize: "0.75rem", mb: 0.75, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                Available Capacity
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "1rem", color: "#29262a", fontWeight: 600 }}>
                {formatCurrency(pool.availableCapacity || "0")}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Box>
    </Card>
  );
};

// Main Pools component
export default function Pools() {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Update document title
  useEffect(() => {
    document.title = "Available Lending Pools - Thurman";
  }, []);

  const fetchPools = async (isRefresh = false): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get<PoolsResponse>("/api/loan-pools");
      
      if (response.data.success) {
        setPools(response.data.data.pools);
      } else {
        setError(response.data.message || "Failed to fetch pools");
      }
    } catch (err: any) {
      console.error("Error fetching pools:", err);
      
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           "Failed to fetch pools";
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handlePoolClick = (poolId: number): void => {
    navigate(`/pools/${poolId}`);
  };

  const handleRefresh = (): void => {
    fetchPools(true);
  };

  // Loading state
  if (loading) {
    return (
      <BackgroundContainer>
        <ContentContainer>
          <Box sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: "1.5rem", color: "#29262a" }}>
                Available Lending Pools
              </Typography>
              <Skeleton variant="rectangular" width={120} height={40} />
            </Box>

            {/* Loading skeleton grid */}
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <PoolCardSkeleton />
                </Grid>
              ))}
            </Grid>
          </Box>
        </ContentContainer>
      </BackgroundContainer>
    );
  }

  return (
    <BackgroundContainer>
      <ContentContainer>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: "1.5rem", color: "#29262a" }}>
              Available Lending Pools
            </Typography>
            <Tooltip title="Refresh pools">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={styles.button.iconButton}
              >
                <RefreshIcon sx={{ transform: refreshing ? "rotate(360deg)" : "none", transition: "transform 0.5s" }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Error state */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* Empty state */}
          {!loading && !error && pools.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: "#D3D3D3", mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#29262a", mb: 1, fontSize: "1.125rem" }}>
                No pools available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: "0.9375rem" }}>
                There are currently no lending pools available for investment.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                sx={styles.button.outlined}
              >
                Refresh
              </Button>
            </Box>
          )}

          {/* Pools grid */}
          {!loading && !error && pools.length > 0 && (
            <>
              {/* Summary stats */}
              <Box sx={{ mb: 4, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Chip 
                  label={`${pools.length} Total Pools`} 
                  variant="outlined"
                  sx={{ 
                    borderRadius: "0.5rem", 
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    borderColor: "#E9ECEF",
                    color: "#29262a",
                    height: "28px"
                  }}
                />
                <Chip 
                  label={`${pools.filter(p => p.config?.depositsEnabled).length} Open for Deposits`} 
                  sx={{ 
                    borderRadius: "0.5rem", 
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    backgroundColor: "transparent",
                    color: "#725aa2",
                    border: "1px solid #725aa2",
                    height: "28px"
                  }}
                />
                <Chip 
                  label={`${pools.filter(p => !p.config?.depositsEnabled).length} Closed`} 
                  variant="outlined"
                  sx={{ 
                    borderRadius: "0.5rem", 
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    borderColor: "#E9ECEF",
                    color: "#666",
                    height: "28px"
                  }}
                />
              </Box>

              {/* Pools grid */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {pools.map((pool) => (
                  <Grid item xs={12} sm={6} md={4} key={pool.id} sx={{ mb: 5 }}>
                    <PoolCard 
                      pool={pool} 
                      onClick={() => handlePoolClick(pool.id)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Last updated info */}
              {pools.length > 0 && (
                <Box sx={{ mt: 5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
                    Last updated: {new Date().toLocaleString()}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </ContentContainer>
    </BackgroundContainer>
  );
} 