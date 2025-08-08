import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import DepositInterface from "./DepositInterface";

// Example usage in PoolDetails page
export default function DepositInterfaceExample() {
  // Mock pool data - replace with actual pool data from your API
  const pool = {
    id: 1,
    name: "Spring 2024 Small Business Pool",
    description: "Supporting small businesses in California with flexible terms and competitive rates.",
    target_amount: 1000000,
    minimum_investment: 100,
    expected_return: 8.5,
    maturity_date: new Date('2025-12-31'),
    status: 'DEPLOYED',
    config: {
      depositsEnabled: true,
      withdrawalsEnabled: false,
      maxDepositAmount: '100000',
      minDepositAmount: '100',
      depositCap: '1000000'
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Pool Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#29262a' }}>
          {pool.name}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
          {pool.description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${pool.expected_return}% APY`} 
            color="primary" 
            icon={<TrendingUpIcon />}
            sx={{ borderRadius: '1em' }}
          />
          <Chip 
            label={`Min: $${pool.minimum_investment.toLocaleString()}`} 
            variant="outlined"
            icon={<AccountBalanceIcon />}
            sx={{ borderRadius: '1em' }}
          />
          <Chip 
            label={`Matures: ${pool.maturity_date.toLocaleDateString()}`} 
            variant="outlined"
            icon={<ScheduleIcon />}
            sx={{ borderRadius: '1em' }}
          />
        </Box>
      </Box>

      {/* Pool Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: '1.25em',
            backgroundColor: '#FFFFFE',
            boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Target Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#29262a' }}>
                ${pool.target_amount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: '1.25em',
            backgroundColor: '#FFFFFE',
            boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Expected Return
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {pool.expected_return}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: '1.25em',
            backgroundColor: '#FFFFFE',
            boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Min Investment
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#29262a' }}>
                ${pool.minimum_investment.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: '1.25em',
            backgroundColor: '#FFFFFE',
            boxShadow: '0 0.125em 0.25em rgba(0, 0, 0, 0.08)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Status
              </Typography>
              <Chip 
                label={pool.status} 
                color={pool.status === 'DEPLOYED' ? 'success' : 'warning'}
                sx={{ borderRadius: '1em', fontWeight: 600 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Deposit Interface */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#29262a', mb: 3 }}>
          Invest in This Pool
        </Typography>
        
        <DepositInterface
          poolId={pool.id}
          poolName={pool.name}
          minDeposit={parseFloat(pool.config.minDepositAmount)}
          maxDeposit={parseFloat(pool.config.maxDepositAmount)}
        />
      </Box>
    </Box>
  );
} 