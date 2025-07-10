// React
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// External libraries
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
  Container,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Visibility, Add } from "@mui/icons-material";
import axios from "axios";

// Project utilities and hooks
import { styles } from "../../styles/styles";

// TypeScript interfaces
interface LoanPool {
  id: number;
  name: string;
  status: "PENDING" | "APPROVED" | "DEPLOYING_POOL" | "POOL_CREATED" | "DEPLOYING_LOANS" | "DEPLOYED" | "REJECTED" | "FAILED";
  total_loans: number;
  total_principal: number;
  created_at: string;
  description?: string;
  target_amount?: number;
  minimum_investment?: number;
  expected_return?: number;
  maturity_date?: string;
}

// Constants
const STATUS_CONFIG = {
  PENDING: { color: "warning", text: "Pending" },
  APPROVED: { color: "info", text: "Approved" },
  DEPLOYING_POOL: { color: "secondary", text: "Deploying Pool" },
  POOL_CREATED: { color: "secondary", text: "Pool Created" },
  DEPLOYING_LOANS: { color: "secondary", text: "Deploying Loans" },
  DEPLOYED: { color: "success", text: "Deployed" },
  REJECTED: { color: "error", text: "Rejected" },
  FAILED: { color: "error", text: "Failed" }
} as const;

const TABLE_HEADERS = [
  { id: "name", label: "Pool Name", width: "25%" },
  { id: "status", label: "Status", width: "15%" },
  { id: "loans", label: "Total Loans", width: "15%" },
  { id: "amount", label: "Total Amount", width: "20%" },
  { id: "date", label: "Created Date", width: "15%" },
  { id: "actions", label: "Actions", width: "10%" }
] as const;

// Custom hooks
const useLoanPools = () => {
  const [pools, setPools] = useState<LoanPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get("/api/loan-pools/drafts", {
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
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, error, refetch: fetchPools };
};

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const getStatusConfig = (status: LoanPool["status"]) => {
  return STATUS_CONFIG[status] || { color: "default", text: status };
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <Box sx={styles.containers.backgroundContainer}>
    <Container maxWidth="lg" sx={styles.containers.content}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        My Loan Pools
      </Typography>
      
      <Paper sx={styles.table.container}>
        <TableContainer>
          <Table>
            <TableHead sx={styles.table.header}>
              <TableRow>
                {TABLE_HEADERS.map((header) => (
                  <TableCell key={header.id} sx={styles.table.cell}>
                    {header.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3].map((index) => (
                <TableRow key={index} sx={styles.table.row}>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="text" width={120} />
                  </TableCell>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </TableCell>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="text" width={60} />
                  </TableCell>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                  <TableCell sx={styles.table.cell}>
                    <Skeleton variant="rectangular" width={80} height={32} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  </Box>
);

// Error state component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Box sx={styles.containers.backgroundContainer}>
    <Container maxWidth="lg" sx={styles.containers.content}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        My Loan Pools
      </Typography>
      
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
      
      <Button
        variant="contained"
        onClick={onRetry}
        sx={styles.button.primary}
      >
        Try Again
      </Button>
    </Container>
  </Box>
);

// Empty state component
const EmptyState = ({ onCreatePool }: { onCreatePool: () => void }) => (
  <Box sx={styles.containers.backgroundContainer}>
    <Container maxWidth="lg" sx={styles.containers.content}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        My Loan Pools
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: "center", ...styles.containers.formContainer }}>
        <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
          You haven't created any loan pools yet.
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          Loan pools allow you to bundle multiple loans together for investors. 
          Create your first pool to get started.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreatePool}
          sx={styles.button.primary}
        >
          Create Your First Pool
        </Button>
      </Paper>
    </Container>
  </Box>
);

// Table row component
const PoolTableRow = ({ 
  pool, 
  onViewDetails 
}: { 
  pool: LoanPool; 
  onViewDetails: (id: number) => void;
}) => {
  const statusConfig = getStatusConfig(pool.status);
  
  return (
    <TableRow sx={styles.table.row}>
      <TableCell sx={styles.table.cell}>
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
      <TableCell sx={styles.table.cell}>
        <Chip
          label={statusConfig.text}
          color={statusConfig.color as any}
          size="small"
          variant="outlined"
          sx={styles.table.statusChip}
        />
      </TableCell>
      <TableCell sx={styles.table.cell}>
        <Typography variant="body2">
          {pool.total_loans.toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell sx={styles.table.cell}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {formatCurrency(pool.total_principal)}
        </Typography>
      </TableCell>
      <TableCell sx={styles.table.cell}>
        <Typography variant="body2">
          {formatDate(pool.created_at)}
        </Typography>
      </TableCell>
      <TableCell sx={styles.table.cell}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Visibility />}
          onClick={() => onViewDetails(pool.id)}
          sx={{
            textTransform: "none",
            minWidth: "auto",
            borderRadius: "0.5em",
            borderColor: "#725aa2",
            color: "#725aa2",
            "&:hover": {
              borderColor: "#29262a",
              backgroundColor: "#f8f9fa"
            }
          }}
        >
          View Details
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Mobile card component
const PoolCard = ({ 
  pool, 
  onViewDetails 
}: { 
  pool: LoanPool; 
  onViewDetails: (id: number) => void;
}) => {
  const statusConfig = getStatusConfig(pool.status);
  
  return (
    <Card sx={styles.pools.card}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {pool.name}
            </Typography>
            {pool.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {pool.description.length > 80 
                  ? `${pool.description.substring(0, 80)}...` 
                  : pool.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={statusConfig.text}
            color={statusConfig.color as any}
            size="small"
            variant="outlined"
            sx={styles.table.statusChip}
          />
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Loans
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {pool.total_loans.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatCurrency(pool.total_principal)}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Created {formatDate(pool.created_at)}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={() => onViewDetails(pool.id)}
            sx={{
              textTransform: "none",
              borderRadius: "0.5em",
              borderColor: "#725aa2",
              color: "#725aa2",
              "&:hover": {
                borderColor: "#29262a",
                backgroundColor: "#f8f9fa"
              }
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main component
export default function MyLoanPools() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { pools, loading, error, refetch } = useLoanPools();
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );

  // Memoized handlers
  const handleViewDetails = useCallback((poolId: number) => {
    // TODO: Implement pool details view
    console.log("View details for pool:", poolId);
  }, []);

  const handleCreatePool = useCallback(() => {
    navigate("/manage/create-loan-pool");
  }, [navigate]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Empty state
  if (pools.length === 0) {
    return <EmptyState onCreatePool={handleCreatePool} />;
  }

  // Main content
  return (
    <Box sx={styles.containers.backgroundContainer}>
      <Container maxWidth="lg" sx={styles.containers.content}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
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

        {/* Mobile Card View */}
        {isMobile ? (
          <Grid container spacing={2}>
            {pools.map((pool) => (
              <Grid item xs={12} key={pool.id}>
                <PoolCard 
                  pool={pool} 
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Desktop Table View */
          <Paper sx={styles.table.container}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead sx={styles.table.header}>
                  <TableRow>
                    {TABLE_HEADERS.map((header) => (
                      <TableCell 
                        key={header.id} 
                        sx={{ 
                          ...styles.table.cell,
                          width: header.width 
                        }}
                      >
                        {header.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pools.map((pool) => (
                    <PoolTableRow 
                      key={pool.id} 
                      pool={pool} 
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Box>
  );
} 