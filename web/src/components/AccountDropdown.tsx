import React, { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Chip
} from "@mui/material";
import { KeyboardArrowDown, Logout, Dashboard, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAccount from "../hooks/useAccount";
import { styles } from "../styles/styles";

export default function AccountDropdown(): JSX.Element | null {
  const { user, logout } = useAccount();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = async (): Promise<void> => {
    handleClose();
    await logout();
  };

  const handleNavigate = (path: string): void => {
    handleClose();
    navigate(path);
  };

  if (!user) return null;

  return (
    <Box>
      <Button
        onClick={handleClick}
        endIcon={<KeyboardArrowDown sx={{ 
          fontSize: "1rem",
          transition: "transform 0.15s ease-in-out",
          transform: open ? "rotate(180deg)" : "rotate(0deg)"
        }} />}
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          ...styles.button.text,
          display: "flex",
          alignItems: "center",
          gap: 1,
          textTransform: "none",
          color: "#29262a",
          "&:hover": {
            backgroundColor: "rgba(114, 90, 162, 0.08)",
            color: "#725aa2"
          }
        }}
      >
        <Avatar sx={{
          width: 32,
          height: 32,
          bgcolor: "#725aa2",
          fontSize: "0.875rem",
          fontWeight: 500
        }}>
          {user.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 500,
            fontSize: "0.9375rem",
            color: "#29262a"
          }}>
            {user.email}
          </Typography>
        </Box>
      </Button>
      
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 240,
            maxWidth: 320,
            boxShadow: "none",
            border: "1px solid #E9ECEF",
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 600, 
            fontSize: "0.875rem",
            color: "#29262a",
            mb: 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Account
          </Typography>
          <Typography variant="body2" sx={{ 
            fontSize: "0.9375rem",
            color: "#666",
            mb: 1.5,
            wordBreak: "break-word"
          }}>
            {user.email}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip 
              label={user.role} 
              size="small"
              sx={{
                backgroundColor: user.role === "ADMIN" ? "transparent" : "transparent",
                color: user.role === "ADMIN" ? "#725aa2" : "#666",
                border: user.role === "ADMIN" ? "1px solid #725aa2" : "1px solid #E9ECEF",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                height: "22px",
                "& .MuiChip-label": {
                  padding: "0 0.5rem"
                }
              }}
            />
            <Chip 
              label={user.status} 
              size="small"
              sx={{
                backgroundColor: user.status === "ACTIVE" ? "transparent" : user.status === "PENDING" ? "transparent" : "transparent",
                color: user.status === "ACTIVE" ? "#2E7D32" : user.status === "PENDING" ? "#F57C00" : "#666",
                border: user.status === "ACTIVE" ? "1px solid #2E7D32" : user.status === "PENDING" ? "1px solid #F57C00" : "1px solid #E9ECEF",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                height: "22px",
                "& .MuiChip-label": {
                  padding: "0 0.5rem"
                }
              }}
            />
          </Box>
        </Box>
        
        <Divider sx={{ borderColor: "#E9ECEF" }} />
        
        <MenuItem 
          onClick={() => handleNavigate("/manage/my-loan-pools")} 
          sx={{ 
            py: 1.25,
            px: 2,
            "&:hover": {
              backgroundColor: "rgba(114, 90, 162, 0.08)"
            }
          }}
        >
          <Dashboard sx={{ 
            mr: 1.5, 
            fontSize: "1.125rem",
            color: "#666"
          }} />
          <Typography variant="body2" sx={{
            fontSize: "0.9375rem",
            color: "#29262a",
            fontWeight: 500
          }}>
            My Loan Pools
          </Typography>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleNavigate("/manage/create-loan-pool")} 
          sx={{ 
            py: 1.25,
            px: 2,
            "&:hover": {
              backgroundColor: "rgba(114, 90, 162, 0.08)"
            }
          }}
        >
          <Add sx={{ 
            mr: 1.5, 
            fontSize: "1.125rem",
            color: "#666"
          }} />
          <Typography variant="body2" sx={{
            fontSize: "0.9375rem",
            color: "#29262a",
            fontWeight: 500
          }}>
            Create Loan Pool
          </Typography>
        </MenuItem>
        
        <Divider sx={{ borderColor: "#E9ECEF" }} />
        
        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            py: 1.25,
            px: 2,
            "&:hover": {
              backgroundColor: "rgba(198, 40, 40, 0.08)"
            }
          }}
        >
          <Logout sx={{ 
            mr: 1.5, 
            fontSize: "1.125rem",
            color: "#666"
          }} />
          <Typography variant="body2" sx={{
            fontSize: "0.9375rem",
            color: "#29262a",
            fontWeight: 500
          }}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
} 