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
import { KeyboardArrowDown, Logout } from "@mui/icons-material";
import useAccount from "../hooks/useAccount";
import { styles } from "../styles/styles";

export default function AccountDropdown() {
  const { user, logout } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  if (!user) return null;

  return (
    <Box>
      <Button
        onClick={handleClick}
        endIcon={<KeyboardArrowDown />}
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          ...styles.button.text,
          display: "flex",
          alignItems: "center",
          gap: 1,
          textTransform: "none",
          color: "white",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)"
          }
        }}
      >
        <Avatar sx={{
          width: 32,
          height: 32,
          bgcolor: "#725aa2",
          fontSize: "0.875rem"
        }}>
          {user.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            mt: 1,
            minWidth: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user.email}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip 
              label={user.role} 
              size="small"
              color={user.role === "ADMIN" ? "primary" : "default"}
              variant="outlined"
            />
            <Chip 
              label={user.status} 
              size="small"
              color={
                user.status === "ACTIVE" ? "success" : 
                user.status === "PENDING" ? "warning" : "error"
              }
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
          <Logout sx={{ mr: 2, fontSize: 20 }} />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
} 