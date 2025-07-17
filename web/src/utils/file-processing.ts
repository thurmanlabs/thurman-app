import Papa from "papaparse";
import * as XLSX from "xlsx";
import { LoanFilePreview } from "../types/loan-pool";
import axios from "axios";


/**
 * Supported file types for loan data upload
 */
export const SUPPORTED_FILE_TYPES = {
  CSV: [".csv"],
  EXCEL: [".xlsx", ".xls"],
  MIME_TYPES: [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ]
} as const;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum rows to parse for preview
 */
export const PREVIEW_ROW_LIMIT = 100;

/**
 * Validates if the file type is supported
 * @param file - The file to validate
 * @returns true if file type is supported, false otherwise
 */
export function validateFileType(file: File): boolean {
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = [
    ...SUPPORTED_FILE_TYPES.CSV,
    ...SUPPORTED_FILE_TYPES.EXCEL
  ].some(ext => fileName.endsWith(ext));

  // Check MIME type
  const hasValidMimeType = SUPPORTED_FILE_TYPES.MIME_TYPES.includes(file.type as any);

  return hasValidExtension || hasValidMimeType;
}

/**
 * Validates if the file size is within limits
 * @param file - The file to validate
 * @returns true if file size is acceptable, false otherwise
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Parses CSV file and extracts preview data
 * @param file - CSV file to parse
 * @returns Promise with parsed preview data
 */
async function parseCSVFile(file: File): Promise<LoanFilePreview> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: PREVIEW_ROW_LIMIT,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, any>[];
          const preview = extractPreviewData(data, results.meta.fields || []);
          resolve(preview);
        } catch (error) {
          reject(new Error("Failed to process CSV data: " + (error as Error).message));
        }
      },
      error: (error) => {
        reject(new Error("CSV parsing error: " + error.message));
      }
    });
  });
}

/**
 * Parses Excel file and extracts preview data
 * @param file - Excel file to parse
 * @returns Promise with parsed preview data
 */
async function parseExcelFile(file: File): Promise<LoanFilePreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Failed to read file data");
        }

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with row limit
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract headers (first row) and data (remaining rows up to limit)
        const headers = jsonData[0] as string[];
        const dataRows = (jsonData.slice(1, PREVIEW_ROW_LIMIT + 1) as any[][]).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        const preview = extractPreviewData(dataRows, headers);
        resolve(preview);
      } catch (error) {
        reject(new Error("Failed to process Excel file: " + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read Excel file"));
    };

    reader.readAsBinaryString(file);
  });
}



function extractPreviewData(data: Record<string, any>[], columns: string[]): LoanFilePreview {

  if (data.length === 0) {
    throw new Error("No data found in file");
  }

  // Check for required columns (exact match with backend)
  const requiredColumns = [
    'borrower_address',
    'originator_address', 
    'retention_rate',
    'principal',
    'term_months',
    'interest_rate'
  ];

  const missingColumns = requiredColumns.filter(col => !columns.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Calculate statistics using exact column names
  const amounts = extractNumericValues(data, 'principal');
  const rates = extractNumericValues(data, 'interest_rate');
  const terms = extractNumericValues(data, 'term_months');

  const totalLoans = data.length;
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
  const avgLoanSize = totalLoans > 0 ? totalAmount / totalLoans : 0;
  const avgInterestRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  const avgTerm = terms.length > 0 ? terms.reduce((sum, term) => sum + term, 0) / terms.length : 0;

  return {
    totalLoans,
    totalAmount,
    avgLoanSize,
    avgInterestRate,
    avgTerm,
    detectedColumns: columns
  };
}

function extractNumericValues(data: Record<string, any>[], column: string): number[] {
  if (!column) return [];
  return data
    .map(row => row[column])
    .filter(value => {
      if (typeof value === "number") return true;
      if (typeof value === "string") {
        // Remove all non-numeric except dot and minus
        const cleaned = value.replace(/[^0-9.-]+/g, "");
        const parsed = parseFloat(cleaned);
        return !isNaN(parsed);
      }
      return false;
    })
    .map(value => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const cleaned = value.replace(/[^0-9.-]+/g, "");
        return parseFloat(cleaned);
      }
      return 0;
    });
}

/**
 * Finds the first column that contains numeric data
 * @param data - Array of loan records
 * @param columns - Array of column headers
 * @returns Column name or empty string if none found
 */
function findFirstNumericColumn(data: Record<string, any>[], columns: string[]): string {
  for (const column of columns) {
    const values = extractNumericValues(data, column);
    if (values.length > 0) {
      return column;
    }
  }
  return "";
}

/**
 * Parses a file and extracts preview data for loan pool creation
 * @param file - File to parse (CSV, XLSX, or XLS)
 * @returns Promise with parsed preview data
 * @throws Error if file type is not supported or parsing fails
 */
export async function parseFilePreview(file: File): Promise<LoanFilePreview> {
  try {
    // Validate file type
    if (!validateFileType(file)) {
      throw new Error("Unsupported file type. Please upload a CSV, XLSX, or XLS file.");
    }

    // Validate file size
    if (!validateFileSize(file)) {
      throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
    }

    // Create FormData and append the file
    const formData = new FormData();
    formData.append('loanDataFile', file);

    // Make API call to backend
    const response = await axios.post('/api/loan-pools/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    });

    // Extract preview data from response
    const responseData = response.data;
    const previewData = responseData.data; // The actual data is nested in response.data.data
    
    // Convert response to LoanFilePreview interface format
    const preview: LoanFilePreview = {
      totalLoans: previewData.totalLoans || previewData.total_loans || 0,
      totalAmount: previewData.totalAmount || previewData.total_amount || 0,
      avgLoanSize: previewData.avgLoanSize || previewData.avg_loan_size || 0,
      avgInterestRate: previewData.avgInterestRate || previewData.avg_interest_rate || 0,
      avgTerm: previewData.avgTerm || previewData.avg_term || 0,
      detectedColumns: previewData.detectedColumns || previewData.detected_columns || []
    };

    return preview;

  } catch (error: any) {
    console.error("File preview error:", error);
    
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to process file preview";
      throw new Error(errorMessage);
    }
    
    // Handle other errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while processing file");
  }
}

/**
 * Gets a user-friendly error message for file validation
 * @param file - File to validate
 * @returns Error message or null if file is valid
 */
export function getFileValidationError(file: File): string | null {
  if (!validateFileType(file)) {
    return "Please upload a CSV, XLSX, or XLS file.";
  }
  
  if (!validateFileSize(file)) {
    return "File size must be 10MB or less.";
  }
  
  return null;
} 