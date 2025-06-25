import React from "react";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import useAccount from "../hooks/useAccount";
import { Typography, Box, Chip } from "@mui/material";

export default function Home() {
  const { user } = useAccount();

  return (
    <BackgroundContainer>
      <ContentContainer>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {user ? (
            <div>
              <Typography variant="h4" gutterBottom>
                Welcome, { user.email}!
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Chip 
                  label={user.role} 
                  color={user.role === 'ADMIN' ? 'primary' : 'default'}
                  size="small"
                />
                <Chip 
                  label={user.status} 
                  color={
                    user.status === 'ACTIVE' ? 'success' : 
                    user.status === 'PENDING' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </Box>
              {user.account && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Wallet: {user.account.slice(0, 6)}...{user.account.slice(-4)}
                </Typography>
              )}
            </div>
          ) : (
            <Typography variant="h4">
              Welcome to Thurman
            </Typography>
          )}
        </Box>
      </ContentContainer>
    </BackgroundContainer>
  );
}
