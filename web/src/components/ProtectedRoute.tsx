import React from "react";
import { Navigate } from "react-router-dom";
import useAccount from "../hooks/useAccount";
import { Box, CircularProgress, Typography } from "@mui/material";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading, isAdmin } = useAccount();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box sx={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                minHeight: "50vh",
                gap: 2
            }}>
                <CircularProgress sx={{ color: "#725aa2" }} />
                <Typography variant="body2" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to home if admin access is required but user is not admin
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    // Render the protected content
    return <>{children}</>;
} 