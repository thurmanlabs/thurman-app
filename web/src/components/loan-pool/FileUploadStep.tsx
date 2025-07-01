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
}: StepProps) {
    const { fileState, handleFileAccepted, handleFileRejected, handleRemoveFile } = uploadState || {};

    // Check if we can proceed to next step
    const canContinue = fileState?.file && fileState?.previewData && !fileState?.isProcessing && !fileState?.error;

    const handleContinue = () => {
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
                    marginBottom: "0.5em",
                    borderBottom: "2px solid #725aa2",
                    paddingBottom: "0.5em"
                }}>
                    Upload Loan Data
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ marginBottom: "2em" }}>
                    Upload an Excel or CSV file containing your approved loans
                </Typography>
            </Grid>

            {/* File Requirements */}
            <Grid item xs={12}>
                <Box sx={{ 
                    backgroundColor: "#eff6fd", 
                    padding: "1em", 
                    borderRadius: "1.25em",
                    marginBottom: "2em"
                }}>
                    <Typography variant="subtitle2" sx={{ color: "#29262a", fontWeight: 600, marginBottom: "0.5em" }}>
                        File Requirements:
                    </Typography>
                    <Box component="ul" sx={{ margin: 0, paddingLeft: "1.5em", color: "#29262a" }}>
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
                            borderRadius: "1.25em",
                            marginBottom: "1em"
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
                    marginTop: "2em",
                    gap: 2
                }}>
                    <Button
                        variant="outlined"
                        onClick={onBack}
                        disabled={fileState?.isProcessing || false}
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
                        onClick={handleContinue}
                        disabled={!canContinue || fileState?.isProcessing || false}
                        sx={styles.button.primary}
                    >
                        Continue to Review
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
} 