import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { styles } from "../styles/styles";

export default function Header() {
  return (
    <AppBar position="sticky" sx={styles.header.appBar}>
      <Toolbar sx={styles.header.toolbar}>
        <Typography sx={styles.header.logo}>
          Thurman
        </Typography>

        <Box sx={styles.header.authSection}>
          <Button 
            variant="text" 
            sx={styles.button.text}
          >
            Log in
          </Button>
          <Button 
            variant="contained"
            sx={styles.button.primary}
          >
            Sign up
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
