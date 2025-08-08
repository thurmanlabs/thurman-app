import { Grid, Box } from "@mui/material";
import { MetricCard } from "./MetricCard";
import { MetricsData } from "../../types/pools";

interface KeyMetricsSectionProps {
  metrics: MetricsData | null;
  loading?: boolean;
}

export function KeyMetricsSection({ metrics, loading }: KeyMetricsSectionProps) {
  return (
    <Box sx={{ mb: 10 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MetricCard 
            label="Active Loans"
            value={metrics?.activeLoans || "0"}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard 
            label="Loss Rate"
            value={metrics?.lossRate || "0%"}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard 
            label="Interest & Fees"
            value={metrics?.interestFees || "0"}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
} 