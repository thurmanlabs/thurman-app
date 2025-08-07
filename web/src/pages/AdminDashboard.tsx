import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from "@mui/icons-material";

import useAccount from "../hooks/useAccount";
import PendingApprovalsTable from "../components/admin/PendingApprovalsTable";
import PendingDepositsTable from "../components/admin/PendingDepositsTable";
import { styles } from "../styles/styles";

interface User {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAccount();

  // Mock data for user management - replace with actual API calls
  const users: User[] = [
    {
      id: 1,
      email: "john@example.com",
      role: "USER",
      status: "ACTIVE",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      email: "jane@example.com", 
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "2024-01-10"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "warning";
      case "SUSPENDED":
        return "error";
      default:
        return "default";
    }
  };

  const getRoleColor = (role: string) => {
    return role === "ADMIN" ? "primary" : "default";
  };

  return (
    <Box sx={styles.containers.backgroundContainer}>
      <Box sx={styles.containers.content}>
        <Typography variant="h4" sx={{ mb: 4, color: "#29262a" }}>
          Admin Dashboard
        </Typography>

        {/* User Management Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, color: "#29262a" }}>
            User Management
          </Typography>
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
                      User
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                      Created
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#29262a" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={styles.avatar.small}>
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ ml: 2, color: "#29262a" }}>
                            {user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ borderRadius: "0.25em" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                          sx={{ borderRadius: "0.25em" }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#29262a" }}>
                        {user.createdAt}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              sx={{ color: "#725aa2" }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small" 
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Loan Pool Approvals Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, color: "#29262a" }}>
            Loan Pool Approvals
          </Typography>
          <PendingApprovalsTable />
        </Box>

        {/* Deposit Management Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, color: "#29262a" }}>
            Deposit Management
          </Typography>
          <PendingDepositsTable />
        </Box>
      </Box>
    </Box>
  );
} 