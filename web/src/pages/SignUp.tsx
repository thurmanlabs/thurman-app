import React from "react";
import { Typography, Box, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import EmailAuthForm from "../components/EmailAuthForm";
import { styles } from "../styles/styles";

export default function SignUp(): JSX.Element {
    const navigate = useNavigate();

    return (
        <BackgroundContainer>
            <ContentContainer>
                <SimpleFormContainer>
                    <Box sx={styles.containers.authFormHeader}>
                        <Typography component="h1" sx={styles.containers.authTitle}>
                            Create Account
                        </Typography>
                        <Typography sx={styles.containers.authSubtitle}>
                            Get started with Thurman lending platform
                        </Typography>
                    </Box>
                    <EmailAuthForm authType="Sign up" />
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Typography sx={styles.containers.authFooterText}>
                            Already have an account?{" "}
                            <Link
                                component="button"
                                onClick={() => navigate("/login")}
                                sx={styles.containers.authLink}
                            >
                                Log in
                            </Link>
                        </Typography>
                    </Box>
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
}