import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
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
const PoolCardSkeleton = () => (
  <Card sx={{ 
    height: "100%", 
    transition: "transform 0.2s ease-in-out",
    borderRadius: "1.25em",
    backgroundColor: "#FFFFFE",
    boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
  }}>
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
  const formatCurrency = (value: string) => {
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
  const formatMinDeposit = (minAmount: string) => {
    const num = parseFloat(minAmount);
    if (isNaN(num)) return "No minimum";
    return `${formatCurrency(minAmount)} minimum`;
  };

  // Get status color and text
  const getStatusInfo = () => {
    if (pool.config?.depositsEnabled) {
      return { color: "success" as const, text: "Open for Deposits" };
    }
    return { color: "default" as const, text: "Closed" };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card 
      sx={{ 
        height: "100%", 
        transition: "all 0.2s ease-in-out",
        borderRadius: "1.25em",
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 0.25em 0.5em rgba(0, 0, 0, 0.12)",
        }
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {/* Pool Name */}
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            {pool.name || `Pool ${pool.id}`}
          </Typography>

          {/* Status Chip */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={statusInfo.text}
              color={statusInfo.color}
              size="small"
              variant={statusInfo.color === "success" ? "filled" : "outlined"}
            />
          </Box>

          {/* Key Metrics */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                TVL: {formatCurrency(pool.totalAssets || "0")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Min: {formatMinDeposit(pool.config?.minDepositAmount || "0")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Updated: {pool.lastUpdated ? new Date(pool.lastUpdated).toLocaleDateString() : "Unknown"}
              </Typography>
            </Box>
          </Box>

          {/* Available Capacity */}
          {pool.config?.depositsEnabled && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Available Capacity
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatCurrency(pool.availableCapacity || "0")}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
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

  const fetchPools = async (isRefresh = false) => {
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

  const handlePoolClick = (poolId: number) => {
    navigate(`/pools/${poolId}`);
  };

  const handleRefresh = () => {
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
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
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
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Available Lending Pools
            </Typography>
            <Tooltip title="Refresh pools">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{ 
                  color: "primary.main",
                  "&:hover": { backgroundColor: "primary.light", color: "white" }
                }}
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
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No pools available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                There are currently no lending pools available for investment.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
          )}

          {/* Pools grid */}
          {!loading && !error && pools.length > 0 && (
            <>
              {/* Summary stats */}
              <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Chip 
                  label={`${pools.length} Total Pools`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`${pools.filter(p => p.config?.depositsEnabled).length} Open for Deposits`} 
                  color="success" 
                  variant="outlined"
                />
                <Chip 
                  label={`${pools.filter(p => !p.config?.depositsEnabled).length} Closed`} 
                  color="default" 
                  variant="outlined"
                />
              </Box>

              {/* Pools grid */}
              <Grid container spacing={3}>
                {pools.map((pool) => (
                  <Grid item xs={12} sm={6} md={4} key={pool.id}>
                    <PoolCard 
                      pool={pool} 
                      onClick={() => handlePoolClick(pool.id)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Last updated info */}
              {pools.length > 0 && (
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
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