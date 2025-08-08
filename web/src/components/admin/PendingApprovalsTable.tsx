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

export default function PendingApprovalsTable() {
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

  const handleApprove = async () => {
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
      console.error("Error approving pool:", err);
      setError(err.response?.data?.message || "Failed to approve pool");
    }
  };

  const handleRetryStep = async (poolId: number, step: string) => {
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
      console.error(`Error retrying ${step}:`, err);
      setError(err.response?.data?.message || `Failed to retry ${step}`);
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
      case "POOL_CREATED":
      case "CONFIGURING_POOL":
      case "POOL_CONFIGURED":
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

  const getStatusCategory = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DEPLOYING_POOL":
      case "POOL_CREATED":
      case "CONFIGURING_POOL":
      case "POOL_CONFIGURED":
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

  // Enhanced Deployment Progress Indicator Component
  const DeploymentProgressIndicator = ({ pool }: { pool: PendingPool }) => {
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

  // Helper function to get deployment summary
  const getDeploymentSummary = (pool: PendingPool): string => {
    const currentStatus = deploymentStatus[pool.id] || pool.status;
    
    if (currentStatus === "DEPLOYED") {
      return "✓ Fully Deployed";
    }
    
    if (currentStatus === "FAILED") {
      const completedSteps = [
        pool.pool_creation_tx_id ? 1 : 0,
        pool.pool_config_tx_id ? 1 : 0,
        pool.loans_creation_tx_id ? 1 : 0
      ].reduce((sum, step) => sum + step, 0);
      
      return `✗ Failed at step ${completedSteps + 1}/3`;
    }
    
    if (currentStatus === "PENDING") {
      return "⏳ Awaiting Approval";
    }
    
    // For in-progress deployments
    const completedSteps = [
      pool.pool_creation_tx_id ? 1 : 0,
      pool.pool_config_tx_id ? 1 : 0,
      pool.loans_creation_tx_id ? 1 : 0
    ].reduce((sum, step) => sum + step, 0);
    
    return `⟳ Step ${completedSteps + 1}/3`;
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
      <Paper sx={{
        ...styles.containers.form,
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
      }}>
        {/* Status Filter */}
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#29262a" }}>
            Pool Approvals & Deployments
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`All (${pools.length})`}
              color={statusFilter === "all" ? "primary" : "default"}
              onClick={() => setStatusFilter("all")}
              clickable
            />
            <Chip
              label={`Pending (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "pending").length})`}
              color={statusFilter === "pending" ? "warning" : "default"}
              onClick={() => setStatusFilter("pending")}
              clickable
            />
            <Chip
              label={`Deploying (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "deploying").length})`}
              color={statusFilter === "deploying" ? "info" : "default"}
              onClick={() => setStatusFilter("deploying")}
              clickable
            />
            <Chip
              label={`Failed (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "failed").length})`}
              color={statusFilter === "failed" ? "error" : "default"}
              onClick={() => setStatusFilter("failed")}
              clickable
            />
            <Chip
              label={`Completed (${pools.filter(p => getStatusCategory(deploymentStatus[p.id] || p.status) === "completed").length})`}
              color={statusFilter === "completed" ? "success" : "default"}
              onClick={() => setStatusFilter("completed")}
              clickable
            />
          </Box>
        </Box>
        
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
              {filteredPools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="#29262a">
                      {statusFilter === "all" ? "No pools found" : 
                       `No ${statusFilter} pools found`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPools.map((pool) => {
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
                        <DeploymentProgressIndicator pool={pool} />
                        
                        {/* Smart retry buttons for failed deployments */}
                        {pool.status === "FAILED" && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="error" sx={{ display: "block", mb: 1 }}>
                              Failed steps (click to retry):
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              {!pool.pool_creation_tx_id && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRetryStep(pool.id, "pool_creation")}
                                  sx={{ fontSize: "0.75rem" }}
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
                                  sx={{ fontSize: "0.75rem" }}
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
                                  sx={{ fontSize: "0.75rem" }}
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
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
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