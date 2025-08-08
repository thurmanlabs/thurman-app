import React, { useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Grid,
    Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { StepProps } from "../../types/loan-pool";
import EnhancedTextInputField from "./EnhancedTextInputField";
import { styles } from "../../styles/styles";

export default function BasicInfoStep({ formMethods, onNext }: StepProps): JSX.Element {
    const { control, trigger } = formMethods;
    const [optionalExpanded, setOptionalExpanded] = useState(false);
    const [characteristicsExpanded, setCharacteristicsExpanded] = useState(false);

    // Validation rules for required fields
    const validation = {
        name: {
            required: "Pool name is required. Please enter a unique name for your pool.",
            minLength: { value: 3, message: "Pool name must be at least 3 characters (e.g., \"Spring 2024 Small Business Pool\")." },
            maxLength: { value: 100, message: "Pool name must be at most 100 characters." }
        },
        description: {
            required: "Description is required. Please provide a detailed summary of your pool.",
            minLength: { value: 20, message: "Description must be at least 20 characters (e.g., \"This pool supports small businesses in California with flexible terms.\")." },
            maxLength: { value: 1000, message: "Description must be at most 1000 characters." }
        },
        targetAmount: {
            required: "Target amount is required. Enter the total investment target (e.g., $100,000).",
            min: { value: 50000, message: "Target amount must be at least $50,000." },
            max: { value: 50000000, message: "Target amount must be at most $50,000,000." }
        }
    };

    // Validation rules for optional fields
    const optionalValidation = {
        minimumInvestment: {
            min: { value: 1000, message: "Minimum investment must be at least $1,000 (e.g., 1000)." }
        },
        expectedReturn: {
            min: { value: 0, message: "Expected return must be at least 0%." },
            max: { value: 30, message: "Expected return must be at most 30%." }
        },
        maturityDate: {
            validate: (value: string): boolean | string => {
                if (!value) return true; // Optional field
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate > today || "Maturity date must be in the future (e.g., 2025-12-31).";
            }
        }
    };

    const handleContinue = async (): Promise<void> => {
        // Validate required fields before proceeding
        const isValid = await trigger(["name", "description", "targetAmount"]);
        if (isValid) {
            onNext();
        }
    };

    return (
        <Grid container spacing={3}>
            {/* Required Fields Section */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                    color: "#29262a", 
                    fontWeight: 600, 
                    marginBottom: "1em",
                    borderBottom: "2px solid #725aa2",
                    paddingBottom: "0.5em"
                }}>
                    Required Information
                </Typography>
            </Grid>

            <EnhancedTextInputField
                control={control}
                name="name"
                rules={validation.name}
                label="Pool Name"
                type="text"
                helperText="Enter a descriptive name for your loan pool (e.g., Spring 2024 Small Business Pool)."
            />

            <EnhancedTextInputField
                control={control}
                name="description"
                rules={validation.description}
                label="Description"
                type="text"
                multiline={true}
                rows={4}
                helperText="Provide a detailed description of the loan pool (e.g., This pool supports small businesses in California with flexible terms.)."
            />

            <EnhancedTextInputField
                control={control}
                name="targetAmount"
                rules={validation.targetAmount}
                label="Target Amount"
                type="number"
                startAdornment="$"
                helperText="Total investment target (e.g., 100000). Must be between $50,000 and $50,000,000."
            />

            {/* Optional Fields Section */}
            <Grid item xs={12}>
                <Accordion 
                    expanded={optionalExpanded} 
                    onChange={() => setOptionalExpanded(!optionalExpanded)}
                    sx={{ 
                        boxShadow: "none",
                        border: "1px solid #D3D3D3",
                        "&:before": { display: "none" }
                    }}
                >
                    <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            backgroundColor: "#F2F1F0",
                        }}
                    >
                        <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                            Optional Settings
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: "1.5em" }}>
                        <Grid container spacing={3}>
                            <EnhancedTextInputField
                                control={control}
                                name="minimumInvestment"
                                rules={optionalValidation.minimumInvestment}
                                label="Minimum Investment"
                                type="number"
                                startAdornment="$"
                                helperText="Minimum investment per investor (optional, e.g., 5000). Must be at least $1,000."
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="expectedReturn"
                                rules={optionalValidation.expectedReturn}
                                label="Expected Return"
                                type="number"
                                endAdornment="%"
                                helperText="Expected annual return (optional, e.g., 7.5). Must be between 0% and 30%."
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="maturityDate"
                                rules={optionalValidation.maturityDate}
                                label="Maturity Date"
                                type="date"
                                helperText="Expected pool maturity date (optional, e.g., 2025-12-31). Must be a future date."
                            />
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Grid>

            {/* Loan Characteristics Section */}
            <Grid item xs={12}>
                <Accordion 
                    expanded={characteristicsExpanded} 
                    onChange={() => setCharacteristicsExpanded(!characteristicsExpanded)}
                    sx={{ 
                        boxShadow: "none",
                        border: "1px solid #D3D3D3",
                        "&:before": { display: "none" }
                    }}
                >
                    <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            backgroundColor: "#F2F1F0",
                        }}
                    >
                        <Typography variant="h6" sx={{ color: "#29262a", fontWeight: 600 }}>
                            Loan Characteristics
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: "1.5em" }}>
                        <Grid container spacing={3}>
                            <EnhancedTextInputField
                                control={control}
                                name="purpose"
                                rules={{}}
                                label="Purpose"
                                type="text"
                                helperText="e.g., Working Capital, Equipment Financing"
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="geographicFocus"
                                rules={{}}
                                label="Geographic Focus"
                                type="text"
                                helperText="e.g., Urban California, Rural Southeast"
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="borrowerProfile"
                                rules={{}}
                                label="Borrower Profile"
                                type="text"
                                helperText="e.g., Small businesses, Women-owned"
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="collateralType"
                                rules={{}}
                                label="Collateral Type"
                                type="text"
                                helperText="e.g., Equipment, Real Estate, Unsecured"
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="loanTermRange"
                                rules={{}}
                                label="Loan Term Range"
                                type="text"
                                helperText="e.g., 12-60 months"
                            />

                            <EnhancedTextInputField
                                control={control}
                                name="interestRateRange"
                                rules={{}}
                                label="Interest Rate Range"
                                type="text"
                                helperText="e.g., 5.5% - 8.5%"
                            />
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Grid>

            {/* Continue Button */}
            <Grid item xs={12} sx={{ marginTop: "2em", textAlign: "center" }}>
                <Button
                    variant="contained"
                    onClick={handleContinue}
                    sx={styles.button.primary}
                    size="large"
                >
                    Continue to File Upload
                </Button>
            </Grid>
        </Grid>
    );
} 