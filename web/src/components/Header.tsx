import React from "react";
import { 
  AppBar, 
  Avatar, 
  Toolbar, 
  Box,
  Typography,
  Button
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { styles } from "../styles/styles";
import useAccount from "../hooks/useAccount";
import NavigateButton from "./NavigateButton";
import ContentContainer from "./ContentContainer";
import thurman from "../assets/images/thurman.png";

export default function Header() {
    const navigate = useNavigate();
    const { user } = useAccount();

  return (
    <AppBar position="sticky" sx={styles.header.appBar}>
      <ContentContainer>
        <Toolbar sx={styles.header.toolbar}>
          <Box sx={styles.header.navLinksContainer}>
            <Avatar
              src={thurman}
              onClick={() => navigate("/")}
              sx={styles.avatar.header}
            />
            <NavigateButton
              variant="text"
              to="/lend"
              sx={styles.button.text}
            >
              Lend
            </NavigateButton>
          </Box>

        <Box sx={styles.header.authSection}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  {user.email}
                </Typography>
                <Button 
                  variant="text" 
                  onClick={() => {/* TODO: implement logout */}}
                  sx={styles.button.text}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <>
              <NavigateButton 
              variant="text" 
              to="/login"
              sx={styles.button.text}
              >
            Log in
            </NavigateButton>
            <NavigateButton 
              variant="contained"
              to="/signup"
              sx={styles.button.primary}
            >
              Sign up
                </NavigateButton>
              </>
            )}
        </Box>
        </Toolbar>
      </ContentContainer>
    </AppBar>
  );
}
