import { Paper, Typography, Button, Box } from "@mui/material";
import { styles } from "../../styles/styles";
import { LendingPool } from "../../types/pools";

interface PoolCardProps {
  pool: LendingPool;
  onBrowse: (poolId: string) => void;
}

export function PoolCard({ pool, onBrowse }: PoolCardProps) {
  return (
    <Paper sx={styles.pools.card}>
      <Box>
        <Typography variant="h6" sx={{ color: styles.metrics.label.color }}>
          {pool.name}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
          {pool.description}
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 2,
        mt: 2,
        alignItems: "flex-end" // Align items to bottom
      }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Interest Rate
          </Typography>
          <Typography variant="h6" sx={{ color: styles.metrics.value.color }}>
            {pool.rate}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Loan Term
          </Typography>
          <Typography variant="h6">
            {pool.loanTerm}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Available Liquidity
          </Typography>
          <Typography variant="h6">
            {pool.liquidity}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button 
            variant="contained"
            sx={styles.button.primary}
            onClick={() => onBrowse(pool.id)}
          >
            Browse Pool
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 