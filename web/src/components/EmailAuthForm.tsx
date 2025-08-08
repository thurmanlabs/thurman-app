import React, { useState } from "react";
import {
    useForm,
    SubmitHandler
} from "react-hook-form";
import { 
    Button, 
    Grid, 
    Typography, 
    Alert, 
    CircularProgress,
    Box
} from "@mui/material";
import TextInputField from "./TextInputField";
import { styles } from "../styles/styles";
import useAccount from "../hooks/useAccount";

export type IEmailAuthFormInput = {
    emailValue: string;
    passwordValue: string;
};

interface EmailAuthFormProps {
    authType: string;
}

export default function EmailAuthForm({ authType }: EmailAuthFormProps) {
    const { signup, login, loading } = useAccount();
    const [notification, setNotification] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    
    const {
        formState: { isValid, errors },
        control,
        handleSubmit,
        reset,
        setError
    } = useForm<IEmailAuthFormInput>({
        mode: "onChange",
        defaultValues: {
            emailValue: "",
            passwordValue: ""
        }
    });

    const onSubmit: SubmitHandler<IEmailAuthFormInput> = async (data) => {
        try {
            setNotification(null);
            
            if (authType === "Login") {
                await login(data);
                setNotification({
                    type: "success",
                    message: "Successfully logged in!"
                });
            } else {
                await signup(data);
                setNotification({
                    type: "success",
                    message: "Account created! Pending admin approval."
                });
                // Clear form after successful signup
                reset();
            }
        } catch (error: any) {
            console.error("Authentication error:", error);
            
            // Handle server error responses
            let errorMessage = "Authentication failed. Please try again.";
            
            if (error.response?.data?.errorMessage) {
                errorMessage = error.response.data.errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setNotification({
                type: "error",
                message: errorMessage
            });
            
            // Set form errors for specific fields if provided
            if (error.response?.data?.fieldErrors) {
                const fieldErrors = error.response.data.fieldErrors;
                if (fieldErrors.email) {
                    setError("emailValue", { message: fieldErrors.email });
                }
                if (fieldErrors.password) {
                    setError("passwordValue", { message: fieldErrors.password });
                }
            }
        }
    };

    const passwordRequirements = [
        "At least 8 characters",
        "At least 1 uppercase letter",
        "At least 1 lowercase letter", 
        "At least 1 number",
        "At least 1 special character"
    ];

    return (
        <Grid container justifyContent="center" alignItems="center" direction="column" spacing={2}>
            {/* Notification Alert */}
            {notification && (
                <Grid item xs={12} sx={{ width: "100%" }}>
                    <Alert 
                        severity={notification.type} 
                        onClose={() => setNotification(null)}
                        sx={{ mb: 2 }}
                    >
                        {notification.message}
                    </Alert>
                </Grid>
            )}
            
            <Grid item xs={12} sm={6} md={4} sx={{ width: "80%", maxWidth: "25em" }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        {/* Email Field */}
                        <Grid item xs={12}>
                            <TextInputField
                                control={control}
                                name="emailValue"
                                rules={{
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                        message: "Please enter a valid email address"
                                    }
                                }}
                                label="Email"
                                type="email"
                            />
                            {errors.emailValue && (
                                <Typography 
                                    variant="caption" 
                                    color="error" 
                                    sx={{ mt: 0.5, display: "block" }}
                                >
                                    {errors.emailValue.message}
                                </Typography>
                            )}
                        </Grid>

                        {/* Password Field */}
                        <Grid item xs={12}>
                            <TextInputField
                                control={control}
                                name="passwordValue"
                                rules={{
                                    required: "Password is required",
                                    pattern: {
                                        value: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/,
                                        message: "Password must meet all requirements"
                                    }
                                }}
                                label="Password"
                                type="password"
                            />
                            {errors.passwordValue && (
                                <Typography 
                                    variant="caption" 
                                    color="error" 
                                    sx={{ mt: 0.5, display: "block" }}
                                >
                                    {errors.passwordValue.message}
                                </Typography>
                            )}
                            
                            {/* Password Requirements Helper Text */}
                            {authType !== "Login" && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Password requirements:
                                    </Typography>
                                    <Box component="ul" sx={{ mt: 0.5, pl: 2 }}>
                                        {passwordRequirements.map((requirement, index) => (
                                            <Typography 
                                                key={index} 
                                                variant="caption" 
                                                color="text.secondary"
                                                component="li"
                                                sx={{ fontSize: "0.75rem" }}
                                            >
                                                {requirement}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!isValid || loading}
                                sx={{
                                    ...styles.button.primary,
                                    width: "100%",
                                    position: "relative"
                                }}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress 
                                            size={20} 
                                            sx={{ 
                                                color: "white", 
                                                mr: 1,
                                                position: "absolute",
                                                left: "50%",
                                                transform: "translateX(-50%)"
                                            }} 
                                        />
                                        {authType === "Login" ? "Logging In..." : "Creating Account..."}
                                    </>
                                ) : (
                                    authType === "Login" ? "Log In" : "Sign Up"
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Grid>
        </Grid>
    );
}