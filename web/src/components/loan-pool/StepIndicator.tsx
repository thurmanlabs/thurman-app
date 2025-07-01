import React from "react";
import {
    Box,
    Step,
    StepLabel,
    Stepper,
    Typography,
    useTheme,
    useMediaQuery
} from "@mui/material";

interface StepIndicatorProps {
    /** Current step index (0-indexed) */
    currentStep: number;
    /** Array of step labels */
    steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box sx={{ mb: 4 }}>
            <Stepper
                activeStep={currentStep}
                orientation={isMobile ? "vertical" : "horizontal"}
                sx={{
                    "& .MuiStepConnector-root": {
                        "& .MuiStepConnector-line": {
                            borderColor: "#D3D3D3",
                            borderTopWidth: 2,
                            borderLeftWidth: 2
                        }
                    },
                    "& .MuiStepConnector-root.Mui-active": {
                        "& .MuiStepConnector-line": {
                            borderColor: "#725aa2"
                        }
                    },
                    "& .MuiStepConnector-root.Mui-completed": {
                        "& .MuiStepConnector-line": {
                            borderColor: "#725aa2"
                        }
                    }
                }}
            >
                {steps.map((label, index) => (
                    <Step key={label} sx={{ flex: 1 }}>
                        <StepLabel
                            sx={{
                                "& .MuiStepLabel-labelContainer": {
                                    "& .MuiStepLabel-label": {
                                        color: "#29262a",
                                        fontWeight: 500,
                                        fontSize: isMobile ? "0.875rem" : "1rem",
                                        "&.Mui-active": {
                                            color: "#725aa2",
                                            fontWeight: 700
                                        },
                                        "&.Mui-completed": {
                                            color: "#725aa2",
                                            fontWeight: 600
                                        }
                                    }
                                },
                                "& .MuiStepLabel-iconContainer": {
                                    "& .MuiStepIcon-root": {
                                        color: "#D3D3D3",
                                        fontSize: isMobile ? "1.5rem" : "1.75rem",
                                        "&.Mui-active": {
                                            color: "#725aa2"
                                        },
                                        "&.Mui-completed": {
                                            color: "#725aa2"
                                        }
                                    },
                                    "& .MuiStepIcon-text": {
                                        fill: "#FFFFFE",
                                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                                        fontWeight: 600
                                    }
                                }
                            }}
                        >
                            {isMobile ? (
                                <Box sx={{ 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    alignItems: "flex-start",
                                    gap: 0.5
                                }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: currentStep === index ? 700 : 500,
                                            color: currentStep === index ? "#725aa2" : "#29262a"
                                        }}
                                    >
                                        Step {index + 1}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: currentStep === index ? 700 : 500,
                                            color: currentStep === index ? "#725aa2" : "#29262a",
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                </Box>
                            ) : (
                                label
                            )}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
} 