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

import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
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

  return (
    <BackgroundContainer>
      <ContentContainer>
        <Box sx={styles.containers.pageContainer}>
          <Typography variant="h5" sx={{ 
            ...styles.header.pageTitle, 
            fontSize: "1.5rem", 
            fontWeight: 600, 
            mb: 4 
          }}>
            Admin Dashboard
          </Typography>

        {/* User Management Section */}
        <Box sx={{ ...styles.containers.sectionHeader, mb: 5 }}>
          <Typography variant="h6" sx={{ ...styles.header.sectionTitle, fontSize: "1.125rem", fontWeight: 600, mb: 3 }}>
            User Management
          </Typography>
          <Paper 
            elevation={0} 
            sx={{
              ...styles.table.container,
              boxShadow: "none !important"
            }}
          >
            <TableContainer sx={{ boxShadow: "none" }}>
              <Table>
                <TableHead 
                  sx={{
                    ...styles.table.header,
                    backgroundColor: "transparent",
                    "& .MuiTableCell-head": {
                      padding: "0.875rem 1.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "1px solid #E9ECEF"
                    }
                  }}
                >
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow 
                      key={user.id} 
                      sx={{
                        ...styles.table.row,
                        "& .MuiTableCell-body": {
                          padding: "0.875rem 1.25rem",
                          fontSize: "0.8125rem",
                          borderBottom: "1px solid #E9ECEF"
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Avatar 
                            sx={{ 
                              width: "32px", 
                              height: "32px", 
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              bgcolor: "#725aa2",
                              color: "#FFFFFE"
                            }}
                          >
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography 
                            sx={{ 
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              color: "#29262a",
                              letterSpacing: "0.01em"
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: user.role === "ADMIN" ? "transparent" : "transparent",
                            color: user.role === "ADMIN" ? "#725aa2" : "#666",
                            border: user.role === "ADMIN" ? "1px solid #725aa2" : "1px solid #E9ECEF",
                            height: "22px",
                            "& .MuiChip-label": {
                              padding: "0 0.5rem"
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          sx={{
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: user.status === "ACTIVE" ? "#E8F5E9" : user.status === "PENDING" ? "#FFF3E0" : "transparent",
                            color: user.status === "ACTIVE" ? "#2E7D32" : user.status === "PENDING" ? "#F57C00" : "#666",
                            border: user.status === "ACTIVE" ? "1px solid #C8E6C9" : user.status === "PENDING" ? "1px solid #FFE0B2" : "1px solid #E9ECEF",
                            height: "22px",
                            "& .MuiChip-label": {
                              padding: "0 0.5rem"
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          sx={{ 
                            fontSize: "0.8125rem",
                            color: "#666",
                            fontFeatureSettings: '"tnum"'
                          }}
                        >
                          {user.createdAt}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              sx={{
                                width: "28px",
                                height: "28px",
                                color: "#666",
                                "&:hover": {
                                  backgroundColor: "rgba(114, 90, 162, 0.08)",
                                  color: "#725aa2"
                                }
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small"
                              sx={{
                                width: "28px",
                                height: "28px",
                                color: "#2E7D32",
                                "&:hover": {
                                  backgroundColor: "#E8F5E9",
                                  color: "#1B5E20"
                                }
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small"
                              sx={{
                                width: "28px",
                                height: "28px",
                                color: "#C62828",
                                "&:hover": {
                                  backgroundColor: "#FFEBEE",
                                  color: "#B71C1C"
                                }
                              }}
                            >
                              <CancelIcon sx={{ fontSize: "1rem" }} />
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
        <Box sx={{ ...styles.containers.sectionHeader, mb: 5 }}>
          <Typography variant="h6" sx={{ ...styles.header.sectionTitle, fontSize: "1.125rem", fontWeight: 600, mb: 3 }}>
            Loan Pool Approvals
          </Typography>
          <PendingApprovalsTable />
        </Box>

        {/* Deposit Management Section */}
        <Box sx={{ ...styles.containers.sectionHeader, mb: 5 }}>
          <Typography variant="h6" sx={{ ...styles.header.sectionTitle, fontSize: "1.125rem", fontWeight: 600, mb: 3 }}>
            Deposit Management
          </Typography>
          <PendingDepositsTable />
        </Box>
        </Box>
      </ContentContainer>
    </BackgroundContainer>
  );
} 