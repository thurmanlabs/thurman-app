import React from "react";
import { 
  AppBar, 
  Avatar, 
  Toolbar, 
  Typography, 
  Box, 
  Button 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styles } from "../styles/styles";
import NavigateButton from "./NavigateButton";
import ContentContainer from "./ContentContainer";
import thurman from "../assets/images/thurman.png";

export default function Header() {
    const navigate = useNavigate();
  return (
    <AppBar position="sticky" sx={styles.header.appBar}>
      <ContentContainer>
        <Toolbar sx={styles.header.toolbar}>
          <Avatar 
            src={thurman}
            onClick={() => navigate("/")}
            sx={styles.avatar.header} 
          />

        <Box sx={styles.header.authSection}>
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
        </Box>
        </Toolbar>
      </ContentContainer>
    </AppBar>
  );
}
