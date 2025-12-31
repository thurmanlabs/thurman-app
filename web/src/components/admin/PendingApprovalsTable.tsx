import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  ThumbDown as ThumbDownIcon
} from "@mui/icons-material";
import axios from "axios";
import { styles } from "../../styles/styles";
import { useForm, Controller, SubmitHandler } from "react-hook-form";

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
  pool_config_tx_id?: string;
  loans_creation_tx_id?: string;
}

interface DeploymentStatus {
  [poolId: number]: string;
}

interface WebhookEvent {
  type: string;
  poolId?: number;
  status: string;
  txHash?: string;
  error?: string;
  transactionId?: string;
  notification?: {
    id: string;
    state: string;
    txHash?: string;
    error?: string;
  };
}

interface RejectionFormData {
  rejectionReason: string;
}

export default function PendingApprovalsTable(): JSX.Element {
  const [pools, setPools] = useState<PendingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({});
  const [selectedPool, setSelectedPool] = useState<PendingPool | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, pending, deploying, failed, completed
  
  // Modal states
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  
  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // React Hook Form for rejection reason
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RejectionFormData>({
    defaultValues: {
      rejectionReason: ""
    },
    mode: "onChange"
  });

  useEffect(() => {
    fetchPendingPools();
    setupSSEConnection();
    
    return () => {
      cleanupSSEConnection();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingPools = async (): Promise<void> => {
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
      setError(err.response?.data?.message || "Failed to fetch pending pools");
    } finally {
      setLoading(false);
    }
  };

  const setupSSEConnection = (): void => {
    try {
      eventSourceRef.current = new EventSource("/api/webhooks/circle");
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const webhookEvent: WebhookEvent = JSON.parse(event.data);
          handleWebhookEvent(webhookEvent);
        } catch (parseError) {
          // Error parsing webhook event
        }
      };

      eventSourceRef.current.onerror = (error) => {
        // SSE connection error
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            setupSSEConnection();
          }
        }, 5000);
      };
    } catch (error) {
      // Error setting up SSE connection
    }
  };

  const cleanupSSEConnection = (): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleWebhookEvent = (event: WebhookEvent): void => {
    console.log("Received webhook event:", event);
    
    if (event.type === "deployment_update" || event.type === "deployment_complete" || event.type === "deployment_failed" || event.type === "pool_configured") {
      if (event.poolId) {
        // Update pools array with new status
        setPools(prev => prev.map(pool => 
          pool.id === event.poolId 
            ? { ...pool, status: event.status }
            : pool
        ));

        // Update deployment status tracking
        setDeploymentStatus(prev => ({
          ...prev,
          [event.poolId!]: event.status
        }));

        // Show notification for major updates
        if (event.type === "deployment_complete") {
          console.log(`Pool ${event.poolId} deployment completed!`);
        } else if (event.type === "deployment_failed") {
          console.log(`Pool ${event.poolId} deployment failed:`, event.error);
        }
      }
    } else {
      // Handle legacy webhook format (backward compatibility)
      const transactionId = event.transactionId || event.notification?.id;
      const status = event.status || event.notification?.state;
      
      if (transactionId && status) {
        const poolToUpdate = pools.find(pool => 
          pool.pool_creation_tx_id === transactionId || 
          pool.loans_creation_tx_id === transactionId
        );

        if (poolToUpdate) {
          setDeploymentStatus(prev => ({
            ...prev,
            [poolToUpdate.id]: status
          }));

          setPools(prev => prev.map(pool => 
            pool.id === poolToUpdate.id 
              ? { ...pool, status: status }
              : pool
          ));
        }
      }
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (!selectedPool) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/loan-pools/${selectedPool.id}/approve`,
        {}, // No walletId needed - server will use authenticated user's wallet
        { withCredentials: true }
      );

      if (response.data.success) {
        setApprovalDialog(false);
        setSelectedPool(null);
        fetchPendingPools(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve pool");
    }
  };

  const handleRetryStep = async (poolId: number, step: string): Promise<void> => {
    try {
      const response = await axios.post(
        `/api/loan-pools/${poolId}/retry-step`,
        { step },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`Retrying ${step} for pool ${poolId}`);
        fetchPendingPools(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to retry ${step}`);
    }
  };


  const onSubmitRejection: SubmitHandler<RejectionFormData> = async (data): Promise<void> => {
    if (!selectedPool) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/loan-pools/${selectedPool.id}/reject`,
        { reason: data.rejectionReason },
        { withCredentials: true }
      );

      if (response.data.success) {
        setRejectionDialog(false);
        reset(); // Reset form
        setSelectedPool(null);
        fetchPendingPools(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject pool");
    }
  };

  const handleViewDetails = (pool: PendingPool): void => {
    setSelectedPool(pool);
    setDetailsDialog(true);
  };

  const getStatusCategory = (status: string): "pending" | "deploying" | "completed" | "failed" | "rejected" | "other" => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "DEPLOYING_POOL":
      case "POOL_CREATED":
      case "CONFIGURING_POOL":
      case "POOL_CONFIGURED":
      case "DEPLOYING_LOANS":
        return "deploying";
      case "DEPLOYED":
        return "completed";
      case "FAILED":
        return "failed";
      case "REJECTED":
        return "rejected";
      default:
        return "other";
    }
  };


  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Enhanced Deployment Progress Indicator Component
  const DeploymentProgressIndicator = ({ pool }: { pool: PendingPool }): JSX.Element => {
    const currentStatus = deploymentStatus[pool.id] || pool.status;
    const { progress, message, color } = getDeploymentProgress(currentStatus);
    
    // Determine which steps have succeeded or failed
    const steps = [
      {
        name: "Pool Creation",
        status: getStepStatus(pool, "pool_creation_tx_id", currentStatus, "DEPLOYING_POOL", "POOL_CREATED"),
        txId: pool.pool_creation_tx_id
      },
      {
        name: "Pool Configuration",
        status: getStepStatus(pool, "pool_config_tx_id", currentStatus, "CONFIGURING_POOL", "POOL_CONFIGURED"),
        txId: pool.pool_config_tx_id
      },
      {
        name: "Loan Deployment",
        status: getStepStatus(pool, "loans_creation_tx_id", currentStatus, "DEPLOYING_LOANS", "DEPLOYED"),
        txId: pool.loans_creation_tx_id
      }
    ];
    
    return (
      <Box sx={{ width: "100%" }}>
        {/* Overall Progress Bar */}
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: "#f0f0f0",
            mb: 1
          }}
          color={color as any}
        />
        
        {/* Overall Status Message */}
        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
          {message}
        </Typography>
        
        {/* Step-by-Step Progress */}
        <Box sx={{ mt: 1 }}>
          {steps.map((step, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: "50%", 
                mr: 1,
                backgroundColor: getStepColor(step.status)
              }} />
              <Typography variant="caption" sx={{ 
                fontSize: "0.7rem",
                color: getStepColor(step.status),
                fontWeight: step.status === "success" ? 600 : 400
              }}>
                {step.name}: {getStepStatusText(step.status)}
              </Typography>
              {step.txId && (
                <Typography variant="caption" sx={{ 
                  ml: 1, 
                  fontSize: "0.65rem",
                  color: "#666",
                  fontFamily: "monospace"
                }}>
                  ({step.txId.substring(0, 8)}...)
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Helper function to determine step status
  const getStepStatus = (
    pool: PendingPool, 
    txIdField: keyof PendingPool, 
    currentStatus: string, 
    inProgressStatus: string, 
    successStatus: string
  ): "pending" | "in-progress" | "success" | "failed" => {
    const txId = pool[txIdField] as string | undefined;
    
    if (currentStatus === "FAILED") {
      // If overall status is failed, check if this step has a transaction ID
      // If it has a tx ID, it likely succeeded but a later step failed
      // If it doesn't have a tx ID, this step likely failed
      return txId ? "success" : "failed";
    }
    
    if (txId) {
      return "success"; // Has transaction ID, so it succeeded
    }
    
    if (currentStatus === inProgressStatus) {
      return "in-progress";
    }
    
    if (currentStatus === successStatus || 
        (successStatus === "DEPLOYED" && currentStatus === "DEPLOYED")) {
      return "success";
    }
    
    return "pending";
  };

  // Helper function to get step color
  const getStepColor = (status: "pending" | "in-progress" | "success" | "failed"): string => {
    switch (status) {
      case "success":
        return "#4caf50"; // Green
      case "in-progress":
        return "#2196f3"; // Blue
      case "failed":
        return "#f44336"; // Red
      case "pending":
      default:
        return "#9e9e9e"; // Gray
    }
  };

  // Helper function to get step status text
  const getStepStatusText = (status: "pending" | "in-progress" | "success" | "failed"): string => {
    switch (status) {
      case "success":
        return "✓ Completed";
      case "in-progress":
        return "⟳ In Progress";
      case "failed":
        return "✗ Failed";
      case "pending":
      default:
        return "⏳ Pending";
    }
  };


  const getDeploymentProgress = (status: string): { progress: number; message: string; color: string } => {
    switch (status) {
      case "PENDING":
        return { progress: 0, message: "Awaiting approval", color: "warning" };
      case "DEPLOYING_POOL":
        return { progress: 20, message: "Creating pool on blockchain...", color: "info" };
      case "POOL_CREATED":
        return { progress: 40, message: "Pool created successfully", color: "info" };
      case "CONFIGURING_POOL":
        return { progress: 60, message: "Configuring pool settings...", color: "info" };
      case "POOL_CONFIGURED":
        return { progress: 80, message: "Pool configured successfully", color: "info" };
      case "DEPLOYING_LOANS":
        return { progress: 90, message: "Deploying loans to pool...", color: "info" };
      case "DEPLOYED":
        return { progress: 100, message: "Deployment completed", color: "success" };
      case "FAILED":
        return { progress: 0, message: "Deployment failed", color: "error" };
      default:
        return { progress: 0, message: status, color: "default" };
    }
  };

  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{
          ...styles.table.container,
          boxShadow: "none !important"
        }}
      >
        <Box sx={styles.containers.loadingState}>
          <CircularProgress sx={styles.containers.circularProgressLarge} />
          <Typography variant="body2" color="#29262a">
            Loading pending approvals...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{
          ...styles.table.container,
          boxShadow: "none !important"
        }}
      >
        <Box sx={styles.containers.errorState}>
          <Alert severity="error" sx={styles.containers.alertRounded}>
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

  // Filter pools based on status
  const filteredPools = pools.filter(pool => {
    const currentStatus = deploymentStatus[pool.id] || pool.status;
    const category = getStatusCategory(currentStatus);
    
    switch (statusFilter) {
      case "pending":
        return category === "pending";
      case "deploying":
        return category === "deploying";
      case "failed":
        return category === "failed";
      case "completed":
        return category === "completed";
      default:
        return true; // "all"
    }
  });

  return (
    <>
      <Paper 
        elevation={0} 
        sx={{
          ...styles.table.container,
          boxShadow: "none !important"
        }}
      >
        {/* Status Filter */}
        <Box sx={{ ...styles.containers.filterContainer, borderBottom: "1px solid #E9ECEF" }}>
          <Typography variant="h6" sx={{ ...styles.header.sectionTitle, fontSize: "1.125rem", fontWeight: 600, mb: 2 }}>
            Pool Approvals & Deployments
          </Typography>
          <Box sx={styles.containers.filterChips}>
            <Chip
              label={`All (${pools.length})`}
              onClick={() => setStatusFilter("all")}
              sx={{
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "28px",
                backgroundColor: statusFilter === "all" ? "rgba(114, 90, 162, 0.08)" : "transparent",
                color: statusFilter === "all" ? "#725aa2" : "#666",
                border: statusFilter === "all" ? "1px solid #725aa2" : "1px solid #E9ECEF",
                cursor: "pointer"
              }}
            />
            <Chip
              label={`Pending (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "pending").length})`}
              onClick={() => setStatusFilter("pending")}
              sx={{
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "28px",
                backgroundColor: statusFilter === "pending" ? "#FFF3E0" : "transparent",
                color: statusFilter === "pending" ? "#F57C00" : "#666",
                border: statusFilter === "pending" ? "1px solid #FFE0B2" : "1px solid #E9ECEF",
                cursor: "pointer"
              }}
            />
            <Chip
              label={`Deploying (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "deploying").length})`}
              onClick={() => setStatusFilter("deploying")}
              sx={{
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "28px",
                backgroundColor: statusFilter === "deploying" ? "#E3F2FD" : "transparent",
                color: statusFilter === "deploying" ? "#1976D2" : "#666",
                border: statusFilter === "deploying" ? "1px solid #BBDEFB" : "1px solid #E9ECEF",
                cursor: "pointer"
              }}
            />
            <Chip
              label={`Failed (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "failed").length})`}
              onClick={() => setStatusFilter("failed")}
              sx={{
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "28px",
                backgroundColor: statusFilter === "failed" ? "#FFEBEE" : "transparent",
                color: statusFilter === "failed" ? "#C62828" : "#666",
                border: statusFilter === "failed" ? "1px solid #FFCDD2" : "1px solid #E9ECEF",
                cursor: "pointer"
              }}
            />
            <Chip
              label={`Completed (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "completed").length})`}
              onClick={() => setStatusFilter("completed")}
              sx={{
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                height: "28px",
                backgroundColor: statusFilter === "completed" ? "#E8F5E9" : "transparent",
                color: statusFilter === "completed" ? "#2E7D32" : "#666",
                border: statusFilter === "completed" ? "1px solid #C8E6C9" : "1px solid #E9ECEF",
                cursor: "pointer"
              }}
            />
          </Box>
        </Box>
        
        <TableContainer sx={{ boxShadow: "none" }}>
          <Table>
            <TableHead sx={styles.table.header}>
              <TableRow>
                <TableCell>Pool Name</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Total Loans</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ ...styles.containers.textCenter, py: 4 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.9375rem", color: "#666" }}>
                      {statusFilter === "all" ? "No pools found" : 
                       `No ${statusFilter} pools found`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPools.map((pool) => {
                  return (
                    <TableRow key={pool.id} sx={styles.table.row}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#29262a", fontSize: "0.9375rem", mb: 0.5 }}>
                          {pool.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: "0.8125rem", color: "#666" }}>
                          {pool.description.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                        {pool.creator?.email}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                        {pool.total_loans}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", color: "#29262a", fontWeight: 500 }}>
                        {formatCurrency(pool.total_principal)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9375rem", color: "#666" }}>
                        {new Date(pool.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DeploymentProgressIndicator pool={pool} />
                        
                        {/* Smart retry buttons for failed deployments */}
                        {pool.status === "FAILED" && (
                          <Box sx={styles.containers.retryContainer}>
                            <Typography variant="caption" color="error" sx={styles.typography.captionTextError}>
                              Failed steps (click to retry):
                            </Typography>
                            <Box sx={styles.containers.retryButtons}>
                              {!pool.pool_creation_tx_id && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRetryStep(pool.id, "pool_creation")}
                                  sx={styles.button.retryButton}
                                >
                                  Retry Pool Creation
                                </Button>
                              )}
                              {pool.pool_creation_tx_id && !pool.pool_config_tx_id && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRetryStep(pool.id, "pool_config")}
                                  sx={styles.button.retryButton}
                                >
                                  Retry Pool Config
                                </Button>
                              )}
                              {pool.pool_config_tx_id && !pool.loans_creation_tx_id && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRetryStep(pool.id, "loan_deployment")}
                                  sx={styles.button.retryButton}
                                >
                                  Retry Loan Deployment
                                </Button>
                              )}
                            </Box>
                          </Box>
                        )}
                        
                        {/* Success summary for completed deployments */}
                        {pool.status === "DEPLOYED" && (
                          <Box sx={{ mt: 1, p: 1, backgroundColor: "#e8f5e8", borderRadius: 1 }}>
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              ✓ All steps completed successfully
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={styles.containers.actionButtons}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              sx={styles.button.iconButton}
                              onClick={() => handleViewDetails(pool)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {(deploymentStatus[pool.id] || pool.status) === "PENDING" && (
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
                                  <ThumbDownIcon />
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
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            border: "1px solid #E9ECEF",
            boxShadow: "none"
          }
        }}
      >
        <DialogTitle sx={{ ...styles.header.dialogTitle, fontSize: "1.125rem", fontWeight: 600 }}>
          Pool Details: {selectedPool?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPool && (
            <Box sx={styles.containers.dialogContent}>
              <Typography variant="h6" sx={{ ...styles.header.sectionTitle, fontSize: "1rem", fontWeight: 600, mb: 2 }}>
                Pool Information
              </Typography>
              <Box sx={styles.containers.dialogGrid}>
                <Box>
                  <Typography variant="body2" sx={{ ...styles.header.cardTitle, fontSize: "0.875rem", mb: 0.5 }}>
                    Creator
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                    {selectedPool.creator?.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#29262a", mb: 0.5 }}>
                    Total Loans
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                    {selectedPool.total_loans}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#29262a", mb: 0.5 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a", fontWeight: 500 }}>
                    {formatCurrency(selectedPool.total_principal)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#29262a", mb: 0.5 }}>
                    Average Interest Rate
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                    {formatPercentage(selectedPool.avg_interest_rate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#29262a", mb: 0.5 }}>
                    Average Term
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                    {selectedPool.avg_term_months} months
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#29262a", mb: 0.5 }}>
                    Created Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a" }}>
                    {new Date(selectedPool.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 1.5, color: "#29262a", fontSize: "1rem", fontWeight: 600, mt: 3 }}>
                Description
              </Typography>
              <Typography variant="body1" sx={{ fontSize: "0.9375rem", color: "#29262a", mb: 3 }}>
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
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            border: "1px solid #E9ECEF",
            boxShadow: "none"
          }
        }}
      >
        <DialogTitle sx={{ color: "#29262a", fontSize: "1.125rem", fontWeight: 600 }}>
          Approve Loan Pool
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "#29262a", fontSize: "0.9375rem" }}>
            Are you sure you want to approve "{selectedPool?.name}"?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, fontSize: "0.9375rem", color: "#666" }}>
            This will deploy the pool using your authenticated Circle wallet.
          </Typography>
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
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            border: "1px solid #E9ECEF",
            boxShadow: "none"
          }
        }}
      >
        <DialogTitle sx={{ color: "#29262a", fontSize: "1.125rem", fontWeight: 600 }}>
          Reject Loan Pool
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "#29262a", fontSize: "0.9375rem" }}>
            Are you sure you want to reject "{selectedPool?.name}"?
          </Typography>
          <Controller
            name="rejectionReason"
            control={control}
            rules={{ required: "Rejection reason is required" }}
            render={({ field }) => (
              <TextField
                fullWidth
                label="Rejection Reason"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.rejectionReason}
                helperText={errors.rejectionReason?.message}
                placeholder="Enter reason for rejection"
                multiline
                rows={3}
                sx={{ 
                  mt: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.625rem"
                  }
                }}
              />
            )}
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
            onClick={handleSubmit(onSubmitRejection)} 
            sx={styles.button.rejectButton}
            disabled={!control._formState.isValid}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 