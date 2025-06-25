import React from "react";
import { 
  AppBar, 
  Avatar, 
  Toolbar, 
  Box
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAccount from "../hooks/useAccount";
import { styles } from "../styles/styles";
import AccountDropdown from "./AccountDropdown";
import ContentContainer from "./ContentContainer";
import NavigateButton from "./NavigateButton";
import thurman from "../assets/images/thurman.png";

interface HeaderProps {
  // Currently no props needed, but following the style guide structure
}

export default function Header({}: HeaderProps) {
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
              <AccountDropdown />
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
