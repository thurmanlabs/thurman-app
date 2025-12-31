import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Typography
} from "@mui/material";
import BackgroundContainer from "../BackgroundContainer";
import ContentContainer from "../ContentContainer";
import StepIndicator from "./StepIndicator";
import BasicInfoStep from "./BasicInfoStep";
import FileUploadStep from "./FileUploadStep";
import ReviewStep from "./ReviewStep";
import useLoanPoolCreation from "../../hooks/useLoanPoolCreation";
import { styles } from "../../styles/styles";

const STEP_LABELS = ["Basic Information", "Upload Data", "Review & Submit"];

export default function LoanPoolCreator(): JSX.Element {
    const navigate = useNavigate();
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    const {
        formMethods,
        currentStep,
        currentStepIndex,
        nextStep,
        previousStep,
        goToStep,
        fileState,
        handleFileAccepted,
        handleFileRejected,
        handleRemoveFile,
        submitLoanPool,
        resetForm
    } = useLoanPoolCreation();

    // Handle form submission
    const handleSubmit = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await submitLoanPool();
            if (result.success) {
                // Reset form after successful submission
                resetForm();
                // Redirect to My Loan Pools page
                navigate("/manage/my-loan-pools", { 
                    state: { 
                        message: "Pool created successfully! You can track its status below." 
                    } 
                });
                return { success: true };
            } else {
                setSubmitError(result.error || "Submission failed");
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setSubmitError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Render current step component
    const renderCurrentStep = (): JSX.Element => {
        const stepProps = {
            formMethods,
            onNext: nextStep,
            onBack: previousStep,
            uploadState: {
                fileState,
                handleFileAccepted,
                handleFileRejected,
                handleRemoveFile
            }
        };

        switch (currentStep) {
            case "metadata":
                return <BasicInfoStep {...stepProps} />;
            case "file":
                return <FileUploadStep {...stepProps} />;
            case "review":
                return (
                    <ReviewStep 
                        {...stepProps} 
                        onSubmit={handleSubmit}
                        goToStep={goToStep}
                    />
                );
            default:
                return <BasicInfoStep {...stepProps} />;
        }
    };

    return (
        <BackgroundContainer>
            <ContentContainer>
                <Box sx={{ py: 4 }}>
                    <Box
                        sx={{
                            maxWidth: "800px",
                            mx: "auto",
                            ...styles.containers.authCard,
                            backgroundColor: "#FFFFFE"
                        }}
                    >
                        {/* Page Header */}
                        <Box sx={{ textAlign: "center", mb: 5 }}>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    ...styles.typography.authTitle,
                                    fontSize: "1.5rem",
                                    fontWeight: 600,
                                    mb: 1.5
                                }}
                            >
                                Create Loan Pool
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    ...styles.typography.authSubtitle,
                                    fontSize: "0.9375rem",
                                    maxWidth: "600px",
                                    mx: "auto"
                                }}
                            >
                                Set up a new investment pool for your approved loans. Complete all steps to create your loan pool.
                            </Typography>
                        </Box>

                    {/* Step Indicator */}
                    <StepIndicator 
                        currentStep={currentStepIndex}
                        steps={STEP_LABELS}
                    />

                    {/* Error Display */}
                    {submitError && (
                        <Box sx={{ mb: 3 }}>
                            <Alert 
                                severity="error" 
                                onClose={() => setSubmitError(null)}
                                sx={{ 
                                    borderRadius: "0.625rem",
                                    fontSize: "0.9375rem"
                                }}
                            >
                                {submitError}
                            </Alert>
                        </Box>
                    )}

                        {/* Current Step Component */}
                        <Box sx={{ mt: 4 }}>
                            {renderCurrentStep()}
                        </Box>
                    </Box>
                </Box>
            </ContentContainer>
        </BackgroundContainer>
    );
} 