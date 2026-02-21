import Joi from 'joi';
import type { OpenAPIV3 } from 'openapi-types';

// ─── Joi Validation Schemas ──────────────────────────────────────────────────

export const createAdvanceTrackerSchema = Joi.object({
    shop_no: Joi.string().allow('').default(''),
    tenant_name: Joi.string().trim().required(),
    advance_amount: Joi.number().min(0).required(),
    advance_deducted: Joi.number().min(0).allow(null).default(null),
    advance_remaining: Joi.number().min(0).allow(null).default(null),
    status: Joi.string().valid('Active', 'Inactive').default('Active'),
    comment: Joi.string().allow('').default(''),
});

export const updateAdvanceTrackerSchema = createAdvanceTrackerSchema;

export const patchAdvanceTrackerSchema = Joi.object({
    shop_no: Joi.string().allow(''),
    tenant_name: Joi.string().trim(),
    advance_amount: Joi.number().min(0),
    advance_deducted: Joi.number().min(0).allow(null),
    advance_remaining: Joi.number().min(0).allow(null),
    status: Joi.string().valid('Active', 'Inactive'),
    comment: Joi.string().allow(''),
}).min(1);

// ─── OpenAPI Component Schemas (pure JSON – no JSDoc) ────────────────────────

// Individual transaction item inside the grouped list response
const AdvanceTransactionSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        _id: { type: 'string', readOnly: true, example: '64abc123def456' },
        date: { type: 'string', format: 'date-time', nullable: true, example: '2025-03-01T00:00:00.000Z' },
        name: { type: 'string', example: 'Dilip Kumar' },
        type: { type: 'string', enum: ['Deposit', 'Advance Deduction'], example: 'Deposit' },
        amount: { type: 'number', minimum: 0, example: 50000 },
        status: { type: 'string', enum: ['Active', 'Inactive', 'Closed'], example: 'Active' },
        remarks: { type: 'string', example: 'dukan khali karne pe dena hai' },
        description: { type: 'string', example: 'dukan khali karne pe dena hai' },
        advance_deducted: { type: 'number', nullable: true, example: 5000 },
        advance_remaining: { type: 'number', nullable: true, example: 45000 },
    },
};

// GET list response — records grouped by shop_no (matches mock-data/data.json format)
export const AdvanceTrackerSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    description: 'Advance records grouped by shop_no — matches the UI data.json format',
    properties: {
        shop_no: { type: 'string', example: '063' },
        transactions: { type: 'array', items: AdvanceTransactionSchema },
    },
};

export const AdvanceTrackerInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['tenant_name', 'advance_amount'],
    properties: {
        shop_no: { type: 'string', example: '063' },
        tenant_name: { type: 'string', example: 'Dilip Kumar' },
        advance_amount: { type: 'number', minimum: 0, example: 50000 },
        advance_deducted: { type: 'number', nullable: true, default: null },
        advance_remaining: { type: 'number', nullable: true, default: null },
        status: { type: 'string', enum: ['Active', 'Inactive'], default: 'Active' },
        comment: { type: 'string', default: '' },
    },
};
