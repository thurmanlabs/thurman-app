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
        <Box>
            {/* Notification Alert */}
            {notification && (
                <Alert 
                    severity={notification.type} 
                    onClose={() => setNotification(null)}
                    sx={{ mb: 3, borderRadius: "0.625rem" }}
                >
                    {notification.message}
                </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
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
                                <Box sx={{ 
                                    mt: 1.5, 
                                    p: 1.5, 
                                    backgroundColor: "#F8F9FA", 
                                    borderRadius: "0.625rem",
                                    border: "1px solid #E9ECEF"
                                }}>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ fontWeight: 500, display: "block", mb: 1.5, fontSize: "0.875rem" }}
                                    >
                                        Password requirements:
                                    </Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                        {passwordRequirements.map((requirement, index) => (
                                            <Typography 
                                                key={index} 
                                                variant="body2"
                                                color="text.secondary"
                                                component="li"
                                                sx={{ fontSize: "0.875rem", lineHeight: 1.75, mb: 0.5 }}
                                            >
                                                {requirement}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12} sx={{ mt: 1 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!isValid || loading}
                                fullWidth
                                sx={{
                                    ...styles.button.primary,
                                    position: "relative",
                                    minHeight: "48px"
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
                                        <Box sx={{ opacity: 0 }}>
                                            {authType === "Login" ? "Log In" : "Sign Up"}
                                        </Box>
                                    </>
                                ) : (
                                    authType === "Login" ? "Log In" : "Sign Up"
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
        </Box>
    );
}