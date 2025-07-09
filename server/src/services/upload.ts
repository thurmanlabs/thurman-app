import multer from "multer";
import { Request } from "express";

// File upload configuration
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file extension
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
    }
};

// Create multer instance with configuration
export const createUploadMiddleware = (fieldName: string = 'file') => {
    return multer({
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit
        },
        fileFilter: fileFilter
    }).single(fieldName);
};

// Helper to extract form data from multipart request
export const extractFormData = (body: any, file: Express.Multer.File | undefined) => {
    return {
        name: body.name,
        description: body.description,
        target_amount: body.target_amount ? parseFloat(body.target_amount) : undefined,
        minimum_investment: body.minimum_investment ? parseFloat(body.minimum_investment) : undefined,
        expected_return: body.expected_return ? parseFloat(body.expected_return) : undefined,
        maturity_date: body.maturity_date ? new Date(body.maturity_date) : undefined,
        purpose: body.purpose,
        geographic_focus: body.geographic_focus,
        borrower_profile: body.borrower_profile,
        collateral_type: body.collateral_type,
        loan_term_range: body.loan_term_range,
        interest_rate_range: body.interest_rate_range,
        original_filename: file?.originalname || ''
    };
}; 