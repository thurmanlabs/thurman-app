import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    Snackbar,
    Typography,
    CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { StepProps } from "../../types/loan-pool";
import { styles } from "../../styles/styles";

interface ReviewStepProps extends StepProps {
    onSubmit: () => Promise<{ success: boolean; error?: string }>;
    goToStep: (stepIndex: number) => void;
}

export default function ReviewStep({ 
    formMethods, 
    onBack, 
    uploadState,
    onSubmit,
    goToStep
}: ReviewStepProps) {
    const { watch } = formMethods;
    const formData = watch();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

    const fileState = uploadState?.fileState;

    // Formatting functions
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getDisplayValue = (value: any, formatter?: (val: any) => string): string => {
        if (value === undefined || value === null || value === "") {
            return "Not specified";
        }
        return formatter ? formatter(value) : String(value);
    };

    const handleSubmit = async () => {
        if (!termsAccepted) {
            setSubmitError("Please accept the terms and conditions");
            setSnackbarMsg("Please accept the terms and conditions");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const result = await onSubmit();
            if (result.success) {
                setSubmitSuccess(true);
                setSnackbarMsg("Loan pool created successfully!");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
            } else {
                setSubmitError(result.error || "Submission failed");
                setSnackbarMsg(result.error || "Submission failed");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } catch (error) {
            setSubmitError("An unexpected error occurred");
            setSnackbarMsg("An unexpected error occurred");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setSnackbarOpen(false);
    };

    if (submitSuccess) {
        return (
            <Grid container spacing={3.5}>
                <Grid item xs={12}>
                    <Card sx={styles.metrics.reviewCard}>
                        <CardContent sx={{ 
                            textAlign: "center",
                            py: 6,
                            px: 4
                        }}>
                            <Typography variant="h5" sx={{ 
                                color: "#29262a", 
                                fontWeight: 600,
                                fontSize: "1.5rem",
                                mb: 1.5
                            }}>
                                Loan Pool Created Successfully
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                fontSize: "0.9375rem",
                                color: "#666",
                                maxWidth: "600px",
                                mx: "auto"
                            }}>
                                Your loan pool "{formData.name}" has been created and is ready for investor review.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    aria-label="Success notification"
                >
                    <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ 
                        borderRadius: "0.625rem",
                        fontSize: "0.9375rem"
                    }}>
                        {snackbarMsg}
                    </Alert>
                </Snackbar>
            </Grid>
        );
    }

    return (
        <Grid container spacing={3.5}>
            {/* Header */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                    color: "#29262a", 
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid #E9ECEF",
                    paddingBottom: "0.75rem"
                }}>
                    Review & Submit
                </Typography>
                <Typography variant="body2" sx={{ 
                    fontSize: "0.9375rem",
                    color: "#666",
                    marginBottom: "2.5rem"
                }}>
                    Please review all information before submitting your loan pool
                </Typography>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
                <Card sx={styles.metrics.reviewCard}>
                    <CardContent sx={{ p: "2rem" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography variant="h6" sx={{ 
                                color: "#29262a", 
                                fontWeight: 600,
                                fontSize: "1rem"
                            }}>
                                Basic Information
                            </Typography>
                            <Button
                                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2.5, borderColor: "#E9ECEF" }} />
                        
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Pool Name
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {formData.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Target Amount
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 600
                                }}>
                                    {formatCurrency(formData.targetAmount)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Description
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    lineHeight: 1.6
                                }}>
                                    {formData.description}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Financial Terms */}
            <Grid item xs={12}>
                <Card sx={styles.metrics.reviewCard}>
                    <CardContent sx={{ p: "2rem" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography variant="h6" sx={{ 
                                color: "#29262a", 
                                fontWeight: 600,
                                fontSize: "1rem"
                            }}>
                                Financial Terms
                            </Typography>
                            <Button
                                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2.5, borderColor: "#E9ECEF" }} />
                        
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Minimum Investment
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.minimumInvestment, formatCurrency)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Expected Return
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.expectedReturn, formatPercentage)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Maturity Date
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.maturityDate, formatDate)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Loan Characteristics */}
            <Grid item xs={12}>
                <Card sx={styles.metrics.reviewCard}>
                    <CardContent sx={{ p: "2rem" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography variant="h6" sx={{ 
                                color: "#29262a", 
                                fontWeight: 600,
                                fontSize: "1rem"
                            }}>
                                Loan Characteristics
                            </Typography>
                            <Button
                                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2.5, borderColor: "#E9ECEF" }} />
                        
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Purpose
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.purpose)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Geographic Focus
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.geographicFocus)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Borrower Profile
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.borrowerProfile)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Collateral Type
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.collateralType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Loan Term Range
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.loanTermRange)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.875rem",
                                    color: "#666",
                                    fontWeight: 500,
                                    mb: 0.75
                                }}>
                                    Interest Rate Range
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontSize: "0.9375rem",
                                    color: "#29262a",
                                    fontWeight: 500
                                }}>
                                    {getDisplayValue(formData.interestRateRange)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* File Summary */}
            <Grid item xs={12}>
                <Card sx={styles.metrics.reviewCard}>
                    <CardContent sx={{ p: "2rem" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography variant="h6" sx={{ 
                                color: "#29262a", 
                                fontWeight: 600,
                                fontSize: "1rem"
                            }}>
                                Loan Data File
                            </Typography>
                            <Button
                                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => goToStep(1)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2.5, borderColor: "#E9ECEF" }} />
                        
                        {fileState?.file ? (
                            <>
                                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{ 
                                            fontSize: "0.875rem",
                                            color: "#666",
                                            fontWeight: 500,
                                            mb: 0.75
                                        }}>
                                            File Name
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                            fontSize: "0.9375rem",
                                            color: "#29262a",
                                            fontWeight: 500
                                        }}>
                                            {fileState.file.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{ 
                                            fontSize: "0.875rem",
                                            color: "#666",
                                            fontWeight: 500,
                                            mb: 0.75
                                        }}>
                                            File Size
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                            fontSize: "0.9375rem",
                                            color: "#29262a",
                                            fontWeight: 500
                                        }}>
                                            {formatFileSize(fileState.file.size)}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {fileState.previewData && (
                                    <>
                                        <Box sx={{ 
                                            borderTop: "1px solid #E9ECEF",
                                            pt: 3,
                                            mb: 3
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: "#29262a", 
                                                fontWeight: 600,
                                                fontSize: "0.9375rem",
                                                mb: 2.5
                                            }}>
                                                File Statistics
                                            </Typography>
                                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Box sx={{ textAlign: "center" }}>
                                                        <Typography sx={styles.metrics.value}>
                                                            {fileState.previewData.totalLoans}
                                                        </Typography>
                                                        <Typography sx={styles.metrics.label}>
                                                            Total Loans
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Box sx={{ textAlign: "center" }}>
                                                        <Typography sx={styles.metrics.value}>
                                                            {formatCurrency(fileState.previewData.totalAmount)}
                                                        </Typography>
                                                        <Typography sx={styles.metrics.label}>
                                                            Total Amount
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Box sx={{ textAlign: "center" }}>
                                                        <Typography sx={styles.metrics.value}>
                                                            {formatCurrency(fileState.previewData.avgLoanSize)}
                                                        </Typography>
                                                        <Typography sx={styles.metrics.label}>
                                                            Avg Loan Size
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Box sx={{ textAlign: "center" }}>
                                                        <Typography sx={styles.metrics.value}>
                                                            {formatPercentage(fileState.previewData.avgInterestRate)}
                                                        </Typography>
                                                        <Typography sx={styles.metrics.label}>
                                                            Avg Interest Rate
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box sx={{ 
                                            borderTop: "1px solid #E9ECEF",
                                            pt: 2.5
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: "#29262a", 
                                                fontWeight: 600,
                                                fontSize: "0.9375rem",
                                                mb: 1.5
                                            }}>
                                                Detected Columns
                                            </Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                {fileState.previewData.detectedColumns.map((column, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={column}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: "transparent",
                                                            border: "1px solid #E9ECEF",
                                                            color: "#29262a",
                                                            borderRadius: "0.5rem",
                                                            fontSize: "0.8125rem",
                                                            fontWeight: 500,
                                                            height: "24px",
                                                            "& .MuiChip-label": {
                                                                padding: "0 0.5rem"
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ 
                                fontSize: "0.9375rem",
                                color: "#666"
                            }}>
                                No file uploaded
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Error Display */}
            {submitError && (
                <Grid item xs={12}>
                    <Alert 
                        severity="error" 
                        sx={{ 
                            borderRadius: "0.625rem",
                            fontSize: "0.9375rem"
                        }}
                        aria-live="assertive"
                    >
                        {submitError}
                    </Alert>
                </Grid>
            )}

            {/* Terms and Conditions */}
            <Grid item xs={12}>
                <Box sx={{ 
                    mt: 2,
                    p: 2,
                    backgroundColor: "#FAFAFA",
                    border: "1px solid #E9ECEF",
                    borderRadius: "0.625rem"
                }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                sx={{ 
                                    color: "#725aa2",
                                    "&.Mui-checked": {
                                        color: "#725aa2"
                                    }
                                }}
                                inputProps={{ "aria-label": "Accept terms and conditions" }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ 
                                fontSize: "0.9375rem",
                                color: "#29262a"
                            }}>
                                I agree to the terms and conditions for creating this loan pool
                            </Typography>
                        }
                    />
                </Box>
            </Grid>

            {/* Navigation Buttons */}
            <Grid item xs={12}>
                <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "3rem",
                    gap: 2
                }}>
                    <Button
                        variant="outlined"
                        onClick={onBack}
                        disabled={isSubmitting}
                        sx={{
                            ...styles.button.outlined,
                            borderColor: "#725aa2",
                            color: "#725aa2",
                            "&:hover": {
                                borderColor: "#725aa2",
                                backgroundColor: "rgba(114, 90, 162, 0.08)",
                                color: "#725aa2"
                            },
                            "&:disabled": {
                                borderColor: "#E0E0E0",
                                color: "#A0A0A0"
                            }
                        }}
                    >
                        Back
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!termsAccepted || isSubmitting}
                        sx={{
                            ...styles.button.primary,
                            minWidth: "200px",
                            maxWidth: "300px"
                        }}
                        aria-busy={isSubmitting}
                        aria-label={isSubmitting ? "Creating loan pool, please wait" : "Create loan pool"}
                        endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" aria-label="Loading" /> : null}
                    >
                        {isSubmitting ? "Creating Loan Pool..." : "Create Loan Pool"}
                    </Button>
                </Box>
            </Grid>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    aria-label={snackbarSeverity === "success" ? "Success notification" : "Error notification"}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ 
                    borderRadius: "0.625rem",
                    fontSize: "0.9375rem"
                }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Grid>
    );
} 