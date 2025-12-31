import React from "react";
import { Typography, Box, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import EmailAuthForm from "../components/EmailAuthForm";
import { styles } from "../styles/styles";

export default function LogIn(): JSX.Element {
    const navigate = useNavigate();

    return (
        <BackgroundContainer>  
            <ContentContainer>
                <SimpleFormContainer>
                    <Box sx={styles.containers.authFormHeader}>
                        <Typography component="h1" sx={styles.containers.authTitle}>
                            Welcome Back
                        </Typography>
                        <Typography sx={styles.containers.authSubtitle}>
                            Sign in to access your account
                        </Typography>
                    </Box>
                    <EmailAuthForm authType="Login" />
                    <Box sx={{ mt: 2, textAlign: "right" }}>
                        <Link
                            component="button"
                            onClick={() => {
                                // TODO: Implement forgot password flow
                                console.log("Forgot password clicked");
                            }}
                            sx={styles.containers.authLink}
                        >
                            Forgot password?
                        </Link>
                    </Box>
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Typography sx={styles.containers.authFooterText}>
                            Don't have an account?{" "}
                            <Link
                                component="button"
                                onClick={() => navigate("/signup")}
                                sx={styles.containers.authLink}
                            >
                                Sign up
                            </Link>
                        </Typography>
                    </Box>
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
}