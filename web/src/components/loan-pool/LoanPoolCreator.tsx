import React, { useState } from "react";
import {
    Alert,
    Box,
    Typography
} from "@mui/material";
import BackgroundContainer from "../BackgroundContainer";
import ContentContainer from "../ContentContainer";
import SimpleFormContainer from "../SimpleFormContainer";
import StepIndicator from "./StepIndicator";
import BasicInfoStep from "./BasicInfoStep";
import FileUploadStep from "./FileUploadStep";
import ReviewStep from "./ReviewStep";
import useLoanPoolCreation from "../../hooks/useLoanPoolCreation";
import { styles } from "../../styles/styles";

const STEP_LABELS = ["Basic Information", "Upload Data", "Review & Submit"];

export default function LoanPoolCreator() {
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
    const handleSubmit = async () => {
        try {
            const result = await submitLoanPool();
            if (result.success) {
                // Reset form after successful submission
                resetForm();
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
    const renderCurrentStep = () => {
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
                <SimpleFormContainer>
                    {/* Page Header */}
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                color: "#29262a", 
                                fontWeight: 700,
                                marginBottom: "0.5em"
                            }}
                        >
                            Create Loan Pool
                        </Typography>
                        <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ maxWidth: "600px", margin: "0 auto" }}
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
                                sx={{ borderRadius: "1.25em" }}
                            >
                                {submitError}
                            </Alert>
                        </Box>
                    )}

                    {/* Current Step Component */}
                    <Box sx={{ mt: 2 }}>
                        {renderCurrentStep()}
                    </Box>
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
} 