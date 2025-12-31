import React from "react";
import {
    Alert,
    Box,
    Button,
    Grid,
    Typography
} from "@mui/material";
import { StepProps } from "../../types/loan-pool";
import FileUploadZone from "./FileUploadZone";
import { styles } from "../../styles/styles";

export default function FileUploadStep({ 
    formMethods, 
    onNext, 
    onBack,
    uploadState 
}: StepProps): JSX.Element {
    const { handleFileAccepted, handleFileRejected, handleRemoveFile, fileState } = uploadState || {};

    // Check if we can proceed to next step
    const canContinue = fileState?.file && fileState?.previewData && !fileState?.isProcessing && !fileState?.error;

    const handleContinue = (): void => {
        if (canContinue) {
            onNext();
        }
    };

    return (
        <Grid container spacing={3}>
            {/* Section Header */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                    color: "#29262a", 
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid #E9ECEF",
                    paddingBottom: "0.75rem"
                }}>
                    Upload Loan Data
                </Typography>
                <Typography variant="body2" sx={{ 
                    fontSize: "0.9375rem",
                    color: "#666",
                    marginBottom: "2rem"
                }}>
                    Upload an Excel or CSV file containing your approved loans
                </Typography>
            </Grid>

            {/* File Requirements */}
            <Grid item xs={12}>
                <Box sx={{ 
                    backgroundColor: "#FAFAFA", 
                    padding: "1.25rem", 
                    borderRadius: "0.625rem",
                    border: "1px solid #E9ECEF",
                    marginBottom: "2rem"
                }}>
                    <Typography variant="body2" sx={{ 
                        color: "#29262a", 
                        fontWeight: 600, 
                        fontSize: "0.9375rem",
                        marginBottom: "0.75rem" 
                    }}>
                        File Requirements:
                    </Typography>
                    <Box component="ul" sx={{ 
                        margin: 0, 
                        paddingLeft: "1.5rem", 
                        color: "#666",
                        fontSize: "0.9375rem",
                        lineHeight: 1.8
                    }}>
                        <li>Excel (.xlsx, .xls) or CSV files</li>
                        <li>Maximum 10MB file size</li>
                        <li>One file per pool</li>
                    </Box>
                </Box>
            </Grid>

            {/* Error Display */}
            {fileState?.error && (
                <Grid item xs={12}>
                    <Alert 
                        severity="error" 
                        sx={{ 
                            borderRadius: "0.625rem",
                            fontSize: "0.9375rem",
                            marginBottom: "1.5rem"
                        }}
                    >
                        {fileState.error}
                    </Alert>
                </Grid>
            )}

            {/* File Upload Zone */}
            <Grid item xs={12}>
                <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center",
                    marginBottom: "2em"
                }}>
                    <Box sx={{ width: "100%", maxWidth: "600px" }}>
                        <FileUploadZone
                            onFileAccepted={handleFileAccepted || (() => {})}
                            onFileRejected={handleFileRejected || (() => {})}
                            isProcessing={fileState?.isProcessing || false}
                            uploadedFile={fileState?.file || null}
                            previewData={fileState?.previewData || null}
                            onRemoveFile={handleRemoveFile || (() => {})}
                        />
                    </Box>
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
                        disabled={fileState?.isProcessing || false}
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
                        onClick={handleContinue}
                        disabled={!canContinue || fileState?.isProcessing || false}
                        sx={{
                            ...styles.button.primary,
                            minWidth: "200px",
                            maxWidth: "300px"
                        }}
                    >
                        Continue to Review
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
} 