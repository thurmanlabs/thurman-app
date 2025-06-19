import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Prisma } from "@prisma/client";

// Custom error interface extending Error with optional statusCode and code properties
export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
}

// Error handler function
export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errorType = "Internal Server Error";

    // Handle JWT errors
    if (err instanceof JsonWebTokenError) {
        statusCode = 401;
        errorType = "Authentication Error";
        message = "Invalid authentication token";
    } else if (err instanceof TokenExpiredError) {
        statusCode = 401;
        errorType = "Authentication Error";
        message = "Authentication token has expired";
    }
    // Handle Prisma errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                statusCode = 409;
                errorType = "Duplicate Entry";
                message = "A record with this information already exists";
                break;
            case "P2025":
                statusCode = 404;
                errorType = "Not Found";
                message = "The requested record was not found";
                break;
            case "P2003":
                statusCode = 400;
                errorType = "Foreign Key Constraint";
                message = "Invalid reference to related record";
                break;
            case "P2014":
                statusCode = 400;
                errorType = "Invalid ID";
                message = "The provided ID is invalid";
                break;
            case "P2021":
                statusCode = 500;
                errorType = "Database Error";
                message = "Database table does not exist";
                break;
            case "P2022":
                statusCode = 500;
                errorType = "Database Error";
                message = "Database column does not exist";
                break;
            default:
                statusCode = 400;
                errorType = "Database Error";
                message = "Database operation failed";
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorType = "Validation Error";
        message = "Invalid data provided";
    }
    // Handle validation errors
    else if (err.name === "ValidationError" || err.name === "ValidatorError") {
        statusCode = 400;
        errorType = "Validation Error";
        message = err.message || "Invalid input data";
    }
    // Handle custom errors with statusCode
    else if (err.statusCode) {
        statusCode = err.statusCode;
        errorType = err.name || "Custom Error";
        message = err.message;
    }
    // Handle 404 errors
    else if (err.message === "Route not found" || err.statusCode === 404) {
        statusCode = 404;
        errorType = "Not Found";
        message = "The requested resource was not found";
    }
    // Handle other known error types
    else if (err.name === "CastError") {
        statusCode = 400;
        errorType = "Invalid ID";
        message = "Invalid ID format";
    } else if (err.name === "SyntaxError") {
        statusCode = 400;
        errorType = "Syntax Error";
        message = "Invalid JSON syntax";
    } else if (err.name === "TypeError") {
        statusCode = 400;
        errorType = "Type Error";
        message = "Invalid data type provided";
    }

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
        console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
            statusCode,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    } else {
        // Production logging (less verbose)
        console.error("Error occurred:", {
            name: err.name,
            message: err.message,
            statusCode,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }

    // Prepare response object
    const response: any = {
        success: false,
        error: errorType,
        message: message
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === "development" && err.stack) {
        response.stack = err.stack;
    }

    // Include additional error details in development
    if (process.env.NODE_ENV === "development") {
        response.details = {
            name: err.name,
            code: err.code,
            statusCode: err.statusCode
        };
    }

    // Send error response
    res.status(statusCode).json(response);
};

// Helper function to create custom errors
export const createError = (
    statusCode: number,
    message: string,
    name?: string
): CustomError => {
    const error = new Error(message) as CustomError;
    error.statusCode = statusCode;
    error.name = name || "CustomError";
    error.isOperational = true;
    return error;
};

// Helper function to create validation errors
export const createValidationError = (message: string): CustomError => {
    return createError(400, message, "ValidationError");
};

// Helper function to create authentication errors
export const createAuthError = (message: string): CustomError => {
    return createError(401, message, "AuthenticationError");
};

// Helper function to create not found errors
export const createNotFoundError = (message: string): CustomError => {
    return createError(404, message, "NotFoundError");
}; 