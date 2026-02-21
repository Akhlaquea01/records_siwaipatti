import type { Request, Response, NextFunction } from 'express';
import type Joi from 'joi';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Express middleware that validates req.body against a Joi schema.
 * On success: strips unknown fields and passes the cleaned body downstream.
 * On failure: responds immediately with 400 and a readable message.
 */
export const validate =
    (schema: Joi.ObjectSchema) =>
        (req: Request, res: Response, next: NextFunction): void => {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,       // collect all errors, not just first
                stripUnknown: true,      // remove undeclared fields
                convert: true,           // coerce strings to numbers/dates etc.
            });

            if (error) {
                const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join('; ');
                res.status(400).json(ApiResponse.error(`Validation failed: ${messages}`));
                return;
            }

            req.body = value;
            next();
        };
