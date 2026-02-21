import type { Request, Response, NextFunction } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';

interface AppError extends Error {
    statusCode?: number;
    code?: number;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('🔴 Error:', err.message);

    // Mongoose validation error
    if (err instanceof MongooseError.ValidationError) {
        const messages = Object.values(err.errors).map((e) => e.message);
        res.status(400).json(ApiResponse.error(`Validation failed: ${messages.join(', ')}`));
        return;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err instanceof MongooseError.CastError) {
        res.status(400).json(ApiResponse.error(`Invalid ID format: ${err.value}`));
        return;
    }

    // MongoDB duplicate key error
    if (err instanceof MongoServerError && err.code === 11000) {
        const field = Object.keys((err as unknown as { keyValue: object }).keyValue ?? {})[0] ?? 'field';
        res.status(409).json(ApiResponse.error(`Duplicate value for field: ${field}`));
        return;
    }

    // Custom status code
    const statusCode = err.statusCode ?? 500;
    res.status(statusCode).json(
        ApiResponse.error(statusCode === 500 ? 'Internal Server Error' : err.message)
    );
};
