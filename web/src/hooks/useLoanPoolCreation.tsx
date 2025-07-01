import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import useMultiStep from "./useMultiStep";
import { LoanPoolData, LoanFilePreview } from "../types/loan-pool";
import { parseFilePreview } from "../utils/file-processing";

// Step definitions for the multi-step form
const LOAN_POOL_STEPS = ["metadata", "file", "review"] as const;
type StepType = typeof LOAN_POOL_STEPS[number];

// File state interface
interface FileState {
    file: File | null;
    isProcessing: boolean;
    previewData: LoanFilePreview | null;
    error: string | null;
}

// Validation rules for form fields
const validationRules = {
    name: {
        required: "Pool name is required",
        minLength: { value: 3, message: "Minimum 3 characters" },
        maxLength: { value: 100, message: "Maximum 100 characters" }
    },
    description: {
        required: "Description is required",
        minLength: { value: 20, message: "Minimum 20 characters" },
        maxLength: { value: 1000, message: "Maximum 1000 characters" }
    },
    targetAmount: {
        required: "Target amount is required",
        min: { value: 50000, message: "Minimum $50,000" },
        max: { value: 50000000, message: "Maximum $50,000,000" }
    },
    minimumInvestment: {
        min: { value: 1000, message: "Minimum $1,000" }
    },
    expectedReturn: {
        min: { value: 0, message: "Minimum 0%" },
        max: { value: 30, message: "Maximum 30%" }
    },
    maturityDate: {
        validate: (value: string) => {
            if (!value) return true; // Optional field
            const selectedDate = new Date(value);
            const today = new Date();
            return selectedDate > today || "Maturity date must be in the future";
        }
    }
};

// Default values for the form
const defaultValues: LoanPoolData = {
    name: "",
    description: "",
    targetAmount: 0,
    minimumInvestment: undefined,
    expectedReturn: undefined,
    maturityDate: undefined,
    purpose: "",
    geographicFocus: "",
    borrowerProfile: "",
    collateralType: "",
    loanTermRange: "",
    interestRateRange: "",
    loanDataFile: undefined
};

export default function useLoanPoolCreation() {
    // Initialize react-hook-form
    const formMethods = useForm<LoanPoolData>({
        defaultValues,
        mode: "onChange"
    });

    // Initialize multi-step functionality with step components
    const stepComponents = LOAN_POOL_STEPS.map(() => () => null); // Placeholder components
    const { currentStepIndex, next, back, goTo } = useMultiStep(stepComponents);

    // File state management
    const [fileState, setFileState] = useState<FileState>({
        file: null,
        isProcessing: false,
        previewData: null,
        error: null
    });

    // Get current step
    const currentStep = LOAN_POOL_STEPS[currentStepIndex];

    // Handle file acceptance
    const handleFileAccepted = useCallback(async (file: File) => {
        setFileState(prev => ({
            ...prev,
            file,
            isProcessing: true,
            error: null
        }));

        try {
            const previewData = await parseFilePreview(file);
            setFileState(prev => ({
                ...prev,
                isProcessing: false,
                previewData,
                error: null
            }));

            // Update form with file
            formMethods.setValue("loanDataFile", file);
        } catch (error) {
            setFileState(prev => ({
                ...prev,
                isProcessing: false,
                error: error instanceof Error ? error.message : "Failed to process file"
            }));
        }
    }, [formMethods]);

    // Handle file rejection
    const handleFileRejected = useCallback((errors: string[]) => {
        setFileState(prev => ({
            ...prev,
            error: errors[0] || "File upload failed"
        }));
    }, []);

    // Handle file removal
    const handleRemoveFile = useCallback(() => {
        setFileState({
            file: null,
            isProcessing: false,
            previewData: null,
            error: null
        });
        formMethods.setValue("loanDataFile", undefined);
    }, [formMethods]);

    // Validate current step
    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        const currentStepFields = getStepFields(currentStep);
        
        if (currentStepFields.length === 0) {
            return true; // No fields to validate for this step
        }

        const result = await formMethods.trigger(currentStepFields);
        return result;
    }, [currentStep, formMethods]);

    // Navigate to next step with validation
    const nextStep = useCallback(async () => {
        const isValid = await validateCurrentStep();
        
        if (isValid) {
            next();
        }
    }, [validateCurrentStep, next]);

    // Navigate to previous step
    const previousStep = useCallback(() => {
        back();
    }, [back]);

    // Navigate to specific step
    const goToStep = useCallback((stepIndex: number) => {
        goTo(stepIndex);
    }, [goTo]);

    // Submit loan pool
    const submitLoanPool = useCallback(async () => {
        const isValid = await formMethods.trigger();
        
        if (!isValid) {
            return { success: false, error: "Please fix validation errors" };
        }

        if (!fileState.file) {
            return { success: false, error: "Please upload a loan data file" };
        }

        try {
            const formData = formMethods.getValues();
            const completeData = {
                ...formData,
                filePreview: fileState.previewData
            };

            // For now, just log the data (replace with actual API call)
            console.log("Loan Pool Data:", completeData);
            
            return { success: true, data: completeData };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Submission failed" 
            };
        }
    }, [formMethods, fileState]);

    // Reset form and state
    const resetForm = useCallback(() => {
        formMethods.reset(defaultValues);
        setFileState({
            file: null,
            isProcessing: false,
            previewData: null,
            error: null
        });
        goTo(0);
    }, [formMethods, goTo]);

    return {
        // Form methods
        formMethods,
        
        // Step navigation
        currentStep,
        currentStepIndex,
        nextStep,
        previousStep,
        goToStep,
        
        // File state
        fileState,
        handleFileAccepted,
        handleFileRejected,
        handleRemoveFile,
        
        // Validation and submission
        validateCurrentStep,
        submitLoanPool,
        resetForm,
        
        // Constants
        steps: LOAN_POOL_STEPS,
        validationRules
    };
}

// Helper function to get fields for each step
function getStepFields(step: StepType): (keyof LoanPoolData)[] {
    switch (step) {
        case "metadata":
            return [
                "name",
                "description", 
                "targetAmount",
                "minimumInvestment",
                "expectedReturn",
                "maturityDate",
                "purpose",
                "geographicFocus",
                "borrowerProfile",
                "collateralType",
                "loanTermRange",
                "interestRateRange"
            ];
        case "file":
            return ["loanDataFile"];
        case "review":
            return []; // No validation needed for review step
        default:
            return [];
    }
} 