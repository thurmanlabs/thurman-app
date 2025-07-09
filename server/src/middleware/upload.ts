import { NextFunction, Request, Response } from "express";
import multer from "multer";

// Error handling middleware for multer
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: "File too large",
                message: "File size must be less than 10MB"
            });
        }
        return res.status(400).json({
            success: false,
            error: "File upload error",
            message: err.message
        });
    }
    
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            error: "Invalid file type",
            message: err.message
        });
    }
    
    next(err);
};

// Validation helper for uploaded files
export const validateUploadedFile = (file: Express.Multer.File | undefined): { isValid: boolean; error?: string } => {
    if (!file) {
        return {
            isValid: false,
            error: "No file uploaded"
        };
    }

    // Check file size (additional validation)
    if (file.size > 10 * 1024 * 1024) {
        return {
            isValid: false,
            error: "File size exceeds 10MB limit"
        };
    }

    // Check file extension
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
        };
    }

    return { isValid: true };
}; 