import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Typography,
  Skeleton,
  Paper,
  Alert,
  Container
} from "@mui/material";
import { Visibility, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { styles } from "../styles/styles";

// TypeScript interfaces
interface LoanPool {
  id: number;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'DEPLOYING_POOL' | 'POOL_CREATED' | 'DEPLOYING_LOANS' | 'DEPLOYED' | 'REJECTED' | 'FAILED';
  total_loans: number;
  total_principal: number;
  created_at: string;
  description?: string;
  target_amount?: number;
  minimum_investment?: number;
  expected_return?: number;
  maturity_date?: string;
}

interface MyLoanPoolsProps {
  // Currently no props needed
}

export default function MyLoanPools({}: MyLoanPoolsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pools, setPools] = useState<LoanPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );

  // Fetch user's pools on component mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/loan-pools/drafts', {
          withCredentials: true
        });

        if (response.data.success) {
          setPools(response.data.data || []);
        } else {
          setError("Failed to fetch loan pools");
        }
      } catch (err: any) {
        console.error("Error fetching pools:", err);
        
        if (axios.isAxiosError(err)) {
          const errorMessage = err.response?.data?.message || 
                             err.response?.data?.error || 
                             err.message || 
                             "Failed to fetch loan pools";
          setError(errorMessage);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  // Get status badge color
  const getStatusColor = (status: LoanPool['status']) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'info';
      case 'DEPLOYING_POOL':
      case 'DEPLOYING_LOANS':
        return 'secondary';
      case 'DEPLOYED':
        return 'success';
      case 'REJECTED':
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status display text
  const getStatusText = (status: LoanPool['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'DEPLOYING_POOL':
        return 'Deploying Pool';
      case 'POOL_CREATED':
        return 'Pool Created';
      case 'DEPLOYING_LOANS':
        return 'Deploying Loans';
      case 'DEPLOYED':
        return 'Deployed';
      case 'REJECTED':
        return 'Rejected';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle view details
  const handleViewDetails = (poolId: number) => {
    // TODO: Implement pool details view
    console.log('View details for pool:', poolId);
  };

  // Handle create new pool
  const handleCreatePool = () => {
    navigate('/manage/create-loan-pool');
  };

  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          My Loan Pools
        </Typography>
        
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pool Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Loans</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3].map((index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" width={120} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={60} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={80} height={32} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          My Loan Pools
        </Typography>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={styles.button.primary}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  // Empty state
  if (pools.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          My Loan Pools
        </Typography>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            You haven't created any loan pools yet.
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Loan pools allow you to bundle multiple loans together for investors. 
            Create your first pool to get started.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePool}
            sx={styles.button.primary}
          >
            Create Your First Pool
          </Button>
        </Paper>
      </Container>
    );
  }

  // Main content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Loan Pools
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreatePool}
          sx={styles.button.primary}
        >
          Create Pool
        </Button>
      </Box>

      {/* Success message */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Pool Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Loans</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pools.map((pool) => (
                <TableRow key={pool.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {pool.name}
                      </Typography>
                      {pool.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {pool.description.length > 50 
                            ? `${pool.description.substring(0, 50)}...` 
                            : pool.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(pool.status)}
                      color={getStatusColor(pool.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {pool.total_loans.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(pool.total_principal)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(pool.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(pool.id)}
                      sx={{
                        textTransform: 'none',
                        minWidth: 'auto'
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
} 