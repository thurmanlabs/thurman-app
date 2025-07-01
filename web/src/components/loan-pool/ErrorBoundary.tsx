import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
}, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console or external service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: "1.25em" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Something went wrong.
            </Typography>
            <Typography variant="body2">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </Typography>
          </Alert>
          <Button variant="contained" color="primary" onClick={this.handleReload}>
            Reload Page
          </Button>
          {this.state.error && (
            <Box sx={{ mt: 3, textAlign: "left", maxWidth: 600, mx: "auto" }}>
              <Typography variant="subtitle2" sx={{ color: "#725aa2" }}>Error details (for debugging):</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return this.props.children;
  }
} 