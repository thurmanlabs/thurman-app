import React, { useCallback } from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Typography
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDropzone } from "react-dropzone";
import { FileUploadProps, LoanFilePreview } from "../../types/loan-pool";
import { styles } from "../../styles/styles";

export default function FileUploadZone({
    onFileAccepted,
    onFileRejected,
    isProcessing,
    uploadedFile,
    previewData,
    onRemoveFile
}: FileUploadProps) {
    
    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        // Handle accepted files
        if (acceptedFiles.length > 0) {
            onFileAccepted(acceptedFiles[0]);
        }
        
        // Handle rejected files
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles.map((file) => {
                if (file.errors.some((error: any) => error.code === "file-invalid-type")) {
                    return "Invalid file type. Please upload a CSV, XLSX, or XLS file.";
                }
                if (file.errors.some((error: any) => error.code === "file-too-large")) {
                    return "File size exceeds 10MB limit.";
                }
                return "File upload failed. Please try again.";
            });
            onFileRejected(errors);
        }
    }, [onFileAccepted, onFileRejected]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxSize: 10485760, // 10MB
        multiple: false,
        disabled: isProcessing
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(2)}%`;
    };

    const renderUploadZone = () => {
        if (isProcessing) {
            return (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress size={40} sx={{ color: "#725aa2", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                        Processing {uploadedFile?.name}...
                    </Typography>
                </Box>
            );
        }

        if (uploadedFile && !isProcessing) {
            return (
                <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="h6" sx={{ color: "#29262a", mb: 1 }}>
                        File Uploaded Successfully
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                    </Typography>
                    <IconButton
                        onClick={onRemoveFile}
                        sx={{
                            color: "#725aa2",
                            "&:hover": { backgroundColor: "#eff6fd" }
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            );
        }

        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <CloudUploadIcon 
                    sx={{ 
                        fontSize: 48, 
                        color: isDragActive ? "#725aa2" : "#D3D3D3",
                        mb: 2 
                    }} 
                />
                <Typography variant="h6" sx={{ color: "#29262a", mb: 1 }}>
                    {isDragActive ? "Drop your file here" : "Drag & drop or click to browse"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Supports CSV, XLSX, and XLS files up to 10MB
                </Typography>
            </Box>
        );
    };

    const renderPreviewData = () => {
        if (!previewData) return null;

        return (
            <Card sx={{ 
                mt: 3, 
                backgroundColor: "#eff6fd",
                borderRadius: "1.25em"
            }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: "#29262a", mb: 2 }}>
                        File Preview
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                    {previewData.totalLoans}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Loans
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                    {formatCurrency(previewData.totalAmount)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Amount
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                    {formatCurrency(previewData.avgLoanSize)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Avg Loan Size
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ color: "#725aa2", fontWeight: "bold" }}>
                                    {formatPercentage(previewData.avgInterestRate)}
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
                        {previewData.detectedColumns.map((column, index) => (
                            <Chip
                                key={index}
                                label={column}
                                size="small"
                                sx={{
                                    backgroundColor: "#FFFFFE",
                                    border: "1px solid #D3D3D3",
                                    color: "#29262a"
                                }}
                            />
                        ))}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box>
            <Paper
                {...getRootProps()}
                sx={{
                    border: `2px dashed ${isDragReject ? "#f44336" : isDragActive ? "#725aa2" : "#D3D3D3"}`,
                    borderRadius: "1.25em",
                    backgroundColor: isDragActive ? "#eff6fd" : "#FFFFFE",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                        borderColor: isProcessing ? "#D3D3D3" : "#725aa2",
                        backgroundColor: isProcessing ? "#FFFFFE" : "#eff6fd"
                    }
                }}
            >
                <input {...getInputProps()} />
                {renderUploadZone()}
            </Paper>
            
            {renderPreviewData()}
        </Box>
    );
} 