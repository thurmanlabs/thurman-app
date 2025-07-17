import XLSX from 'xlsx';
import { ethers } from 'ethers';
import path from 'path';

// 1.LoanData interface
export interface LoanData {
  borrower_address: string;
  originator_address: string;
  retention_rate: number;
  principal: number;
  term_months: number;
  interest_rate: number;
  business_name?: string;
  loan_purpose?: string;
  risk_grade?: string;
}

// 2. ValidationResult interface
export interface ValidationResult {
  errors: string[];
  warnings: string[];
  validLoans: LoanData[];
}

// For previewing the file (first 5 rows, headers, etc.)
export interface CSVParseResult {
  headers: string[];
  previewRows: any[];
  rowCount: number;
}



// 3. parseLoanCSV
export async function parseLoanCSV(buffer: Buffer, filename: string): Promise<LoanData[]> {
  const ext = path.extname(filename).toLowerCase();
  let json: any[];
  let headers: string[];

  if (ext === '.csv') {
    // Convert buffer to string for CSV
    const csvString = buffer.toString('utf8');
    // For CSV, parse manually to preserve address strings
    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error("Empty CSV file");
    }
    headers = lines[0].split(',').map(h => h.trim());
    json = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Always treat address fields as strings
        if ([
          'borrower_address',
          'originator_address'
        ].includes(header)) {
          row[header] = value;
        } else if ([
          'principal',
          'term_months',
          'interest_rate',
          'retention_rate'
        ].includes(header)) {
          row[header] = Number(value) || 0;
        } else {
          row[header] = value;
        }
      });
      json.push(row);
    }
  } else {
    // Excel file - use XLSX
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  // Check for required columns
  const requiredColumns = [
    'borrower_address',
    'originator_address',
    'retention_rate',
    'principal',
    'term_months',
    'interest_rate',
  ];
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Map to LoanData
  const loans: LoanData[] = json.map((row, idx) => ({
    borrower_address: String(row.borrower_address).trim(),
    originator_address: String(row.originator_address).trim(),
    retention_rate: Number(row.retention_rate),
    principal: Number(row.principal),
    term_months: Number(row.term_months),
    interest_rate: Number(row.interest_rate),
    business_name: row.business_name ? String(row.business_name) : undefined,
    loan_purpose: row.loan_purpose ? String(row.loan_purpose) : undefined,
    risk_grade: row.risk_grade ? String(row.risk_grade) : undefined,
  }));
  return loans;
}

// 4. validateLoanData
export function validateLoanData(loans: LoanData[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validLoans: LoanData[] = [];

  loans.forEach((loan, idx) => {
    const rowNum = idx + 2; // +2 for header and 1-based index
    // Address validation
    if (!ethers.isAddress(loan.borrower_address)) {
      errors.push(`Row ${rowNum}: Invalid borrower_address: ${loan.borrower_address}`);
    }
    if (!ethers.isAddress(loan.originator_address)) {
      errors.push(`Row ${rowNum}: Invalid originator_address: ${loan.originator_address}`);
    }
    // Principal
    if (isNaN(loan.principal) || loan.principal < 1000 || loan.principal > 1000000) {
      errors.push(`Row ${rowNum}: principal must be between $1,000 and $1,000,000`);
    }
    // Term
    if (isNaN(loan.term_months) || loan.term_months < 6 || loan.term_months > 60) {
      errors.push(`Row ${rowNum}: term_months must be between 6 and 60`);
    }
    // Interest rate
    if (isNaN(loan.interest_rate) || loan.interest_rate < 0.05 || loan.interest_rate > 0.30) {
      errors.push(`Row ${rowNum}: interest_rate must be between 0.05 (5%) and 0.30 (30%)`);
    }
    // Retention rate
    if (isNaN(loan.retention_rate) || loan.retention_rate < 0.0 || loan.retention_rate > 1.0) {
      errors.push(`Row ${rowNum}: retention_rate must be between 0.0 and 1.0`);
    }
    // If no errors for this row, add to validLoans
    if (!errors.some(e => e.startsWith(`Row ${rowNum}:`))) {
      validLoans.push(loan);
    }
  });

  return { errors, warnings, validLoans };
}

// 5. generateFilePreview
export async function generateFilePreview(buffer: Buffer, filename: string): Promise<CSVParseResult> {
  
  const ext = path.extname(filename).toLowerCase();
  
  let workbook;
  if (ext === '.csv') {
    // Convert buffer to string for CSV
    const csvString = buffer.toString('utf8');
    
    // For CSV, parse manually to preserve address strings
    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error("Empty CSV file");
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    const json: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Always treat address fields as strings
        if ([
          'borrower_address',
          'originator_address'
        ].includes(header)) {
          row[header] = value;
        } else if ([
          'principal',
          'term_months',
          'interest_rate',
          'retention_rate'
        ].includes(header)) {
          row[header] = Number(value) || 0;
        } else {
          row[header] = value;
        }
      });
      json.push(row);
    }
    
    return {
      headers,
      previewRows: json.slice(0, 5),
      rowCount: json.length,
    };
  } else {
    // Excel file - use XLSX
    workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheetName = workbook.SheetNames[0];
    
    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    
    const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
    
    return {
      headers,
      previewRows: json.slice(0, 5),
      rowCount: json.length,
    };
  }
}

export default {
  parseLoanCSV,
  validateLoanData,
  generateFilePreview,
}; 