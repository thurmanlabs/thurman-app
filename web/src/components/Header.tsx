import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { styles } from "../styles/styles";
import NavigateButton from "./NavigateButton";
import ContentContainer from "./ContentContainer";

export default function Header() {
  return (
    <AppBar position="sticky" sx={styles.header.appBar}>
      <ContentContainer>
        <Toolbar sx={styles.header.toolbar}>
          <Typography sx={styles.header.logo}>
            Thurman
        </Typography>

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
