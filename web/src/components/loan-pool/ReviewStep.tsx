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
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ 
                        backgroundColor: "#eff6fd",
                        borderRadius: "1.25em",
                        textAlign: "center",
                        padding: "3em"
                    }}>
                        <CardContent>
                            <Typography variant="h4" sx={{ color: "#725aa2", fontWeight: "bold", mb: 2 }}>
                                ✅ Loan Pool Created Successfully!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
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
                    <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ borderRadius: "1.25em" }}>
                        {snackbarMsg}
                    </Alert>
                </Snackbar>
            </Grid>
        );
    }

    return (
        <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                    color: "#29262a", 
                    fontWeight: 600, 
                    marginBottom: "0.5em",
                    borderBottom: "2px solid #725aa2",
                    paddingBottom: "0.5em"
                }}>
                    Review & Submit
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ marginBottom: "2em" }}>
                    Please review all information before submitting your loan pool
                </Typography>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: "1.25em" }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                                Basic Information
                            </Typography>
                            <Button
                                startIcon={<EditIcon />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Pool Name</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {formData.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Target Amount</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {formatCurrency(formData.targetAmount)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a" }}>
                                    {formData.description}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Financial Terms */}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: "1.25em" }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                                Financial Terms
                            </Typography>
                            <Button
                                startIcon={<EditIcon />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Minimum Investment</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.minimumInvestment, formatCurrency)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Expected Return</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.expectedReturn, formatPercentage)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Maturity Date</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.maturityDate, formatDate)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Loan Characteristics */}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: "1.25em" }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                                Loan Characteristics
                            </Typography>
                            <Button
                                startIcon={<EditIcon />}
                                onClick={() => goToStep(0)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Purpose</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.purpose)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Geographic Focus</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.geographicFocus)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Borrower Profile</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.borrowerProfile)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Collateral Type</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.collateralType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Loan Term Range</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.loanTermRange)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Interest Rate Range</Typography>
                                <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                    {getDisplayValue(formData.interestRateRange)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* File Summary */}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: "1.25em" }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                                Loan Data File
                            </Typography>
                            <Button
                                startIcon={<EditIcon />}
                                onClick={() => goToStep(1)}
                                sx={styles.button.text}
                            >
                                Edit
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        {fileState?.file ? (
                            <>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">File Name</Typography>
                                        <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                            {fileState.file.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">File Size</Typography>
                                        <Typography variant="body2" sx={{ color: "#29262a", mb: 1 }}>
                                            {formatFileSize(fileState.file.size)}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {fileState.previewData && (
                                    <>
                                        <Typography variant="subtitle2" sx={{ color: "#29262a", mb: 1 }}>
                                            File Statistics:
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Box sx={{ textAlign: "center" }}>
                                                    <Typography variant="h6" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                                        {fileState.previewData.totalLoans}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total Loans
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Box sx={{ textAlign: "center" }}>
                                                    <Typography variant="h6" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                                        {formatCurrency(fileState.previewData.totalAmount)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total Amount
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Box sx={{ textAlign: "center" }}>
                                                    <Typography variant="h6" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                                        {formatCurrency(fileState.previewData.avgLoanSize)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Avg Loan Size
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Box sx={{ textAlign: "center" }}>
                                                    <Typography variant="h6" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                                        {formatPercentage(fileState.previewData.avgInterestRate)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Avg Interest Rate
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" sx={{ color: "#29262a", mb: 1 }}>
                                            Detected Columns:
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {fileState.previewData.detectedColumns.map((column, index) => (
                                                <Chip
                                                    key={index}
                                                    label={column}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: "#eff6fd",
                                                        border: "1px solid #D3D3D3",
                                                        color: "#29262a"
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
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
                        sx={{ borderRadius: "1.25em" }}
                        aria-live="assertive"
                    >
                        {submitError}
                    </Alert>
                </Grid>
            )}

            {/* Terms and Conditions */}
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            sx={{ color: "#725aa2" }}
                            inputProps={{ "aria-label": "Accept terms and conditions" }}
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: "#29262a" }}>
                            I agree to the terms and conditions for creating this loan pool
                        </Typography>
                    }
                />
            </Grid>

            {/* Navigation Buttons */}
            <Grid item xs={12}>
                <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "2em",
                    gap: 2
                }}>
                    <Button
                        variant="outlined"
                        onClick={onBack}
                        disabled={isSubmitting}
                        sx={{
                            ...styles.button.text,
                            borderColor: "#725aa2",
                            "&:hover": {
                                borderColor: "#29262a",
                                backgroundColor: "#eff6fd"
                            },
                            "&:disabled": {
                                borderColor: "#D3D3D3",
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
                        sx={styles.button.primary}
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
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ borderRadius: "1.25em" }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Grid>
    );
} 