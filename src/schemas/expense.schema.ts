import Joi from 'joi';
import type { OpenAPIV3 } from 'openapi-types';

// ─── Joi Validation Schemas ──────────────────────────────────────────────────

export const createExpenseSchema = Joi.object({
    txn_date: Joi.date().iso().required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().trim().required(),
    category: Joi.string().trim().required(),
    sub_category: Joi.string().trim().allow('').default(''),
    payment_method: Joi.string()
        .valid('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other')
        .default('Cash'),
});

export const updateExpenseSchema = createExpenseSchema;

export const patchExpenseSchema = Joi.object({
    txn_date: Joi.date().iso(),
    amount: Joi.number().min(0),
    description: Joi.string().trim(),
    category: Joi.string().trim(),
    sub_category: Joi.string().trim().allow(''),
    payment_method: Joi.string().valid('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'),
}).min(1);

// ─── OpenAPI Component Schemas (pure JSON – no JSDoc) ────────────────────────

export const ExpenseSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        _id: { type: 'string', readOnly: true, example: '6999760d3230bb2a0d237731' },
        txn_date: { type: 'string', format: 'date-time', example: '2023-11-01T00:00:00.000Z' },
        amount: { type: 'number', minimum: 0, example: 800 },
        description: { type: 'string', example: 'Mithai' },
        category: { type: 'string', example: 'Food' },
        sub_category: { type: 'string', example: 'Eating out' },
        payment_method: {
            type: 'string',
            enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
            example: 'Cash',
        },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
    },
};

export const ExpenseInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['txn_date', 'amount', 'description', 'category', 'payment_method'],
    properties: {
        txn_date: { type: 'string', format: 'date', example: '2023-11-01' },
        amount: { type: 'number', minimum: 0, example: 800 },
        description: { type: 'string', example: 'Mithai' },
        category: { type: 'string', example: 'Food' },
        sub_category: { type: 'string', default: '', example: 'Eating out' },
        payment_method: {
            type: 'string',
            enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
            default: 'Cash',
        },
    },
};
