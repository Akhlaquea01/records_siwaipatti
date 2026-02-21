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

export const AdvanceTrackerSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        _id: { type: 'string', readOnly: true, example: '64abc123def456' },
        shop_no: { type: 'string', example: '063' },
        tenant_name: { type: 'string', example: 'Dilip Kumar' },
        advance_amount: { type: 'number', minimum: 0, example: 50000 },
        advance_deducted: { type: 'number', nullable: true, example: 5000 },
        advance_remaining: { type: 'number', nullable: true, example: 45000 },
        status: { type: 'string', enum: ['Active', 'Inactive'], example: 'Active' },
        comment: { type: 'string', example: 'Advance given in March 2025' },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
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
