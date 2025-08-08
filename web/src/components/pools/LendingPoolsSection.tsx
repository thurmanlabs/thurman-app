import { Box, Typography, Alert, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PoolCard } from "./PoolCard";
import { LendingPool } from "../../types/pools";
import { styles } from "../../styles/styles";

interface LendingPoolsSectionProps {
  pools: LendingPool[];
  loading?: boolean;
  error?: Error | null;
}

export function LendingPoolsSection({ pools, loading, error }: LendingPoolsSectionProps) {
  const navigate = useNavigate();

  const handleBrowsePool = (poolId: string) => {
    navigate(`/pool/${poolId}`);
  };

  if (error) {
    return (
      <Box sx={styles.pools.section}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading pools: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={styles.pools.section}>
      <Typography variant="h6" sx={{ mb: 1, color: styles.metrics.label.color }}>
        Available Lending Pools
      </Typography>
      
      {loading ? (
        [...Array(2)].map((_, i) => (
          <Skeleton 
            key={i}
            variant="rectangular" 
            sx={{ ...styles.pools.card, height: '200px' }}
          />
        ))
      ) : (
        pools.map(pool => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onBrowse={handleBrowsePool}
          />
        ))
      )}
      
      {!loading && pools.length === 0 && (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
          No lending pools available at this time.
        </Typography>
      )}
    </Box>
  );
} 