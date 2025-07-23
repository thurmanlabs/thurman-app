import React, { useState, useEffect, useRef } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  LinearProgress
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon
} from "@mui/icons-material";

import axios from "axios";
import { styles } from "../../styles/styles";

interface PendingPool {
  id: number;
  name: string;
  description: string;
  creator: {
    email: string | null;
    id: number;
    role: string;
    status: string;
  };
  total_loans: number;
  total_principal: number;
  avg_interest_rate: number;
  avg_term_months: number;
  created_at: string;
  status: string;
  pool_creation_tx_id?: string;
  loans_creation_tx_id?: string;
}

interface DeploymentStatus {
  [poolId: number]: string;
}

interface WebhookEvent {
  transactionId: string;
  status: string;
  txHash?: string;
  error?: string;
}

export default function PendingApprovalsTable() {
  const [pools, setPools] = useState<PendingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({});
  const [selectedPool, setSelectedPool] = useState<PendingPool | null>(null);
  
  // Modal states
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [walletId, setWalletId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchPendingPools();
    setupSSEConnection();
    
    return () => {
      cleanupSSEConnection();
    };
  }, []);

  const fetchPendingPools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get("/api/loan-pools/admin/pending-approvals", {
        withCredentials: true
      });
      
      if (response.data.success) {
        setPools(response.data.data);
        
        // Initialize deployment status for pools with transaction IDs
        const initialStatus: DeploymentStatus = {};
        response.data.data.forEach((pool: PendingPool) => {
          if (pool.pool_creation_tx_id || pool.loans_creation_tx_id) {
            initialStatus[pool.id] = pool.status;
          }
        });
        setDeploymentStatus(initialStatus);
      } else {
        setError("Failed to fetch pending pools");
      }
    } catch (err: any) {
      console.error("Error fetching pending pools:", err);
      setError(err.response?.data?.message || "Failed to fetch pending pools");
    } finally {
      setLoading(false);
    }
  };

  const setupSSEConnection = () => {
    try {
      eventSourceRef.current = new EventSource("/api/webhooks/circle");
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const webhookEvent: WebhookEvent = JSON.parse(event.data);
          handleWebhookEvent(webhookEvent);
        } catch (parseError) {
          console.error("Error parsing webhook event:", parseError);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error("SSE connection error:", error);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            setupSSEConnection();
          }
        }, 5000);
      };
    } catch (error) {
      console.error("Error setting up SSE connection:", error);
    }
  };

  const cleanupSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleWebhookEvent = (event: WebhookEvent) => {
    // Find pool by transaction ID and update status
    const poolToUpdate = pools.find(pool => 
      pool.pool_creation_tx_id === event.transactionId || 
      pool.loans_creation_tx_id === event.transactionId
    );

    if (poolToUpdate) {
      setDeploymentStatus(prev => ({
        ...prev,
        [poolToUpdate.id]: event.status
      }));

      // Update pool status in the pools array
      setPools(prev => prev.map(pool => 
        pool.id === poolToUpdate.id 
          ? { ...pool, status: event.status }
          : pool
      ));
    }
  };

  const handleApprove = async () => {
    if (!selectedPool || !walletId.trim()) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/loan-pools/${selectedPool.id}/approve`,
        { walletId },
        { withCredentials: true }
      );

      if (response.data.success) {
        setApprovalDialog(false);
        setWalletId("");
        setSelectedPool(null);
        fetchPendingPools(); // Refresh the list
      }
    } catch (err: any) {
      console.error("Error approving pool:", err);
      setError(err.response?.data?.message || "Failed to approve pool");
    }
  };

  const handleReject = async () => {
    if (!selectedPool || !rejectionReason.trim()) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/loan-pools/${selectedPool.id}/reject`,
        { reason: rejectionReason },
        { withCredentials: true }
      );

      if (response.data.success) {
        setRejectionDialog(false);
        setRejectionReason("");
        setSelectedPool(null);
        fetchPendingPools(); // Refresh the list
      }
    } catch (err: any) {
      console.error("Error rejecting pool:", err);
      setError(err.response?.data?.message || "Failed to reject pool");
    }
  };

  const handleViewDetails = (pool: PendingPool) => {
    setSelectedPool(pool);
    setDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "DEPLOYING_POOL":
      case "DEPLOYING_LOANS":
        return "info";
      case "DEPLOYED":
        return "success";
      case "FAILED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DEPLOYING_POOL":
      case "DEPLOYING_LOANS":
        return <HourglassIcon />;
      case "FAILED":
        return <ErrorIcon />;
      case "DEPLOYED":
        return <CheckCircleIcon />;
      default:
        return undefined;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getDeploymentProgress = (status: string) => {
    switch (status) {
      case "DEPLOYING_POOL":
        return { value: 25, label: "Creating Pool" };
      case "POOL_CREATED":
        return { value: 50, label: "Pool Created" };
      case "DEPLOYING_LOANS":
        return { value: 75, label: "Deploying Loans" };
      case "DEPLOYED":
        return { value: 100, label: "Deployed" };
      case "FAILED":
        return { value: 0, label: "Failed" };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Paper sx={{
        ...styles.containers.form,
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
      }}>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#725aa2", mb: 2 }} />
          <Typography variant="body2" color="#29262a">
            Loading pending approvals...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{
        ...styles.containers.form,
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
      }}>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: "1.25em" }}>
            {error}
          </Alert>
          <Button 
            onClick={fetchPendingPools} 
            sx={styles.button.primary}
          >
            Retry
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{
        ...styles.containers.form,
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Pool Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Creator
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Total Loans
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Total Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="#29262a">
                      No pending approvals
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pools.map((pool) => {
                  const currentStatus = deploymentStatus[pool.id] || pool.status;
                  const progress = getDeploymentProgress(currentStatus);
                  
                  return (
                    <TableRow key={pool.id}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium" color="#29262a">
                          {pool.name}
                        </Typography>
                        <Typography variant="caption" color="#29262a">
                          {pool.description.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "#29262a" }}>
                        {pool.creator?.email}
                      </TableCell>
                      <TableCell sx={{ color: "#29262a" }}>
                        {pool.total_loans}
                      </TableCell>
                      <TableCell sx={{ color: "#29262a" }}>
                        {formatCurrency(pool.total_principal)}
                      </TableCell>
                      <TableCell sx={{ color: "#29262a" }}>
                        {new Date(pool.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Chip
                            label={currentStatus}
                            color={getStatusColor(currentStatus) ?? 'default'}
                            size="small"
                            icon={getStatusIcon(currentStatus)}
                            sx={{ borderRadius: "0.25em" }}
                          />
                          {progress && (
                            <Box sx={{ width: "100%" }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress.value}
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2,
                                  backgroundColor: "#e0e0e0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: "#725aa2"
                                  }
                                }}
                              />
                              <Typography variant="caption" color="#29262a" sx={{ mt: 0.5 }}>
                                {progress.label}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              sx={{ color: "#725aa2" }}
                              onClick={() => handleViewDetails(pool)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {currentStatus === "PENDING" && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => {
                                    setSelectedPool(pool);
                                    setApprovalDialog(true);
                                  }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => {
                                    setSelectedPool(pool);
                                    setRejectionDialog(true);
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pool Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE"
          }
        }}
      >
        <DialogTitle sx={{ color: "#29262a" }}>
          Pool Details: {selectedPool?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPool && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#29262a" }}>
                Pool Information
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Creator
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {selectedPool.creator?.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Total Loans
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {selectedPool.total_loans}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Total Amount
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {formatCurrency(selectedPool.total_principal)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Average Interest Rate
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {formatPercentage(selectedPool.avg_interest_rate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Average Term
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {selectedPool.avg_term_months} months
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="#29262a" fontWeight={600}>
                    Created Date
                  </Typography>
                  <Typography variant="body1" color="#29262a">
                    {new Date(selectedPool.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2, color: "#29262a" }}>
                Description
              </Typography>
              <Typography variant="body1" color="#29262a" sx={{ mb: 3 }}>
                {selectedPool.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDetailsDialog(false)}
            sx={styles.button.text}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialog} 
        onClose={() => setApprovalDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE"
          }
        }}
      >
        <DialogTitle sx={{ color: "#29262a" }}>
          Approve Loan Pool
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "#29262a" }}>
            Are you sure you want to approve "{selectedPool?.name}"?
          </Typography>
          <TextField
            fullWidth
            label="Circle Wallet ID"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Enter Circle wallet ID for deployment"
            sx={{ 
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "1.25em"
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApprovalDialog(false)}
            sx={styles.button.text}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            sx={styles.button.primary}
            disabled={!walletId.trim()}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectionDialog} 
        onClose={() => setRejectionDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE"
          }
        }}
      >
        <DialogTitle sx={{ color: "#29262a" }}>
          Reject Loan Pool
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "#29262a" }}>
            Are you sure you want to reject "{selectedPool?.name}"?
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection"
            multiline
            rows={3}
            sx={{ 
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "1.25em"
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectionDialog(false)}
            sx={styles.button.text}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            sx={{
              ...styles.button.primary,
              background: "linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)"
            }}
            disabled={!rejectionReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 