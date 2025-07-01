import { UseFormReturn, Control, RegisterOptions } from "react-hook-form";

/**
 * Core data structure for loan pool creation form
 */
export interface LoanPoolData {
  /** Pool identifier - required, 3-100 characters */
  name: string;
  
  /** Detailed description of the loan pool - required, 20-1000 characters */
  description: string;
  
  /** Investment target in USD - required, $50K-$50M */
  targetAmount: number;
  
  /** Minimum investment amount in USD - optional, $1K+ */
  minimumInvestment?: number;
  
  /** Expected annual return percentage - optional, 0-30% */
  expectedReturn?: number;
  
  /** Pool maturity date - optional, ISO date string */
  maturityDate?: string;
  
  /** Loan purpose categories - optional, e.g., "Working Capital, Equipment" */
  purpose?: string;
  
  /** Geographic focus area - optional, e.g., "Urban California" */
  geographicFocus?: string;
  
  /** Borrower profile description - optional, e.g., "Small businesses" */
  borrowerProfile?: string;
  
  /** Type of collateral accepted - optional, e.g., "Equipment, Real Estate" */
  collateralType?: string;
  
  /** Range of loan terms - optional, e.g., "12-60 months" */
  loanTermRange?: string;
  
  /** Range of interest rates - optional, e.g., "5.5% - 8.5%" */
  interestRateRange?: string;
  
  /** Uploaded loan data file - optional */
  loanDataFile?: File;
}

/**
 * Preview data extracted from uploaded loan file
 */
export interface LoanFilePreview {
  /** Total number of loans in the file */
  totalLoans: number;
  
  /** Total loan amount across all loans */
  totalAmount: number;
  
  /** Average loan size */
  avgLoanSize: number;
  
  /** Average interest rate across all loans */
  avgInterestRate: number;
  
  /** Average loan term in months */
  avgTerm: number;
  
  /** Column headers detected in the file */
  detectedColumns: string[];
}

/**
 * State management for loan pool creation process
 */
export interface LoanPoolCreationState {
  /** Current form data */
  formData: LoanPoolData;
  
  /** Current step in the multi-step form */
  currentStep: "metadata" | "file" | "review";
  
  /** Preview data from uploaded file */
  filePreview: LoanFilePreview | null;
  
  /** Whether file is currently being processed */
  isProcessingFile: boolean;
  
  /** Error message from file upload/processing */
  uploadError: string | null;
}

/**
 * Props for multi-step form components
 */
export interface StepProps {
  /** React Hook Form methods for form management */
  formMethods: UseFormReturn<LoanPoolData>;
  
  /** Callback to proceed to next step */
  onNext: () => void;
  
  /** Callback to return to previous step */
  onBack: () => void;
  
  /** Upload state for file upload step */
  uploadState?: {
    isProcessing: boolean;
    uploadedFile: File | null;
    previewData: LoanFilePreview | null;
    error: string | null;
  };
}

/**
 * File upload component props
 */
export interface FileUploadProps {
  /** Callback when file is accepted */
  onFileAccepted: (file: File) => void;
  
  /** Callback when file is rejected with error messages */
  onFileRejected: (errors: string[]) => void;
  
  /** Whether file is currently being processed */
  isProcessing: boolean;
  
  /** Currently uploaded file */
  uploadedFile: File | null;
  
  /** Preview data from uploaded file */
  previewData: LoanFilePreview | null;
  
  /** Callback to remove uploaded file */
  onRemoveFile: () => void;
}

/**
 * Enhanced text input field props extending base TextInputField
 */
export interface EnhancedTextInputFieldProps {
  /** React Hook Form control */
  control: Control<any>;
  
  /** Field name for form registration */
  name: string;
  
  /** Validation rules */
  rules: RegisterOptions;
  
  /** Field label */
  label: string;
  
  /** Input type */
  type: string;
  
  /** Additional help text displayed below the field */
  helperText?: string;
  
  /** Whether field should render as multiline textarea */
  multiline?: boolean;
  
  /** Number of rows for textarea (when multiline is true) */
  rows?: number;
  
  /** Content to display at the start of the input field (e.g., $ symbol) */
  startAdornment?: React.ReactNode;
  
  /** Content to display at the end of the input field (e.g., % symbol) */
  endAdornment?: React.ReactNode;
} 