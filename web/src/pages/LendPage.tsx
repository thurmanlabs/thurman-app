import { Container } from '@mui/material';
import { KeyMetricsSection } from '../components/metrics/KeyMetricsSection';
import { LendingPoolsSection } from '../components/pools/LendingPoolsSection';
import { usePoolsData } from '../hooks/usePoolsData';
import BackgroundContainer from '../components/BackgroundContainer';

export default function LendPage() {
  const { metrics, pools, loading, error } = usePoolsData();

  console.log(pools);

  return (
    <BackgroundContainer>
      <Container maxWidth="lg">
        <KeyMetricsSection metrics={metrics} loading={loading} />
        <LendingPoolsSection 
          pools={pools} 
          loading={loading}
          error={error}
        />
      </Container>
    </BackgroundContainer>
  );
} 