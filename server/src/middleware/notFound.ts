import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";

/**
 * 404 handler middleware
 * Creates a "not found" error and passes it to the error handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = createError(404, `Route ${req.originalUrl} not found`, "NotFoundError");
    next(error);
}; 