import { Paper, Typography } from "@mui/material";
import { styles } from "../../styles/styles";

interface MetricCardProps {
  label: string;
  value: string;
  loading?: boolean;
}

export function MetricCard({ label, value, loading }: MetricCardProps) {
  return (
    <Paper sx={styles.metrics.card}>
      <Typography variant="h6" sx={styles.metrics.label}>
        {label}
      </Typography>
      <Typography variant="h4" sx={styles.metrics.value}>
        {loading ? "..." : value}
      </Typography>
    </Paper>
  );
} 