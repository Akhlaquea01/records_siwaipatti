import Joi from 'joi';
import type { OpenAPIV3 } from 'openapi-types';

// ─── Joi Validation Schemas ──────────────────────────────────────────────────

export const createRentLedgerSchema = Joi.object({
    payment_date: Joi.date().iso().required(),
    shop_no: Joi.string().trim().required(),
    tenant_name: Joi.string().trim().required(),
    rent_month: Joi.string().trim().required(),
    rent_year: Joi.number().integer().min(2000).required(),
    monthly_rent: Joi.number().min(0).required(),
    amount_paid: Joi.number().min(0).default(0),
    advance_deducted: Joi.number().min(0).default(0),
    old_shop_no: Joi.string().allow('').default(''),
    Comments: Joi.string().allow(null, '').default(null),
    payment_status: Joi.string().valid('Paid', 'Due', 'Partial').default('Due'),
    partially_paid: Joi.number().min(0).default(0),
});

export const updateRentLedgerSchema = createRentLedgerSchema;

export const patchRentLedgerSchema = Joi.object({
    payment_date: Joi.date().iso(),
    shop_no: Joi.string().trim(),
    tenant_name: Joi.string().trim(),
    rent_month: Joi.string().trim(),
    rent_year: Joi.number().integer().min(2000),
    monthly_rent: Joi.number().min(0),
    amount_paid: Joi.number().min(0),
    advance_deducted: Joi.number().min(0),
    old_shop_no: Joi.string().allow(''),
    Comments: Joi.string().allow(null, ''),
    payment_status: Joi.string().valid('Paid', 'Due', 'Partial'),
    partially_paid: Joi.number().min(0),
}).min(1);

// ─── OpenAPI Component Schemas (pure JSON – no JSDoc) ────────────────────────

export const RentLedgerSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        _id: { type: 'string', readOnly: true, example: '699975653230bb2a0d235ec1' },
        payment_date: { type: 'string', format: 'date-time', example: '2025-03-01T00:00:00.000Z' },
        shop_no: { type: 'string', example: '063' },
        tenant_name: { type: 'string', example: 'Vinay Kumar' },
        rent_month: { type: 'string', example: 'March' },
        rent_year: { type: 'integer', example: 2025 },
        monthly_rent: { type: 'number', minimum: 0, example: 3000 },
        amount_paid: { type: 'number', minimum: 0, example: 0 },
        advance_deducted: { type: 'number', minimum: 0, example: 0 },
        old_shop_no: { type: 'string', example: '059' },
        Comments: { type: 'string', nullable: true, example: null },
        payment_status: { type: 'string', enum: ['Paid', 'Due', 'Partial'], example: 'Due' },
        partially_paid: { type: 'number', minimum: 0, example: 0 },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
    },
};

export const RentLedgerInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['payment_date', 'shop_no', 'tenant_name', 'rent_month', 'rent_year', 'monthly_rent'],
    properties: {
        payment_date: { type: 'string', format: 'date', example: '2025-03-01' },
        shop_no: { type: 'string', example: '063' },
        tenant_name: { type: 'string', example: 'Vinay Kumar' },
        rent_month: { type: 'string', example: 'March' },
        rent_year: { type: 'integer', example: 2025 },
        monthly_rent: { type: 'number', minimum: 0, example: 3000 },
        amount_paid: { type: 'number', default: 0 },
        advance_deducted: { type: 'number', default: 0 },
        old_shop_no: { type: 'string' },
        Comments: { type: 'string', nullable: true },
        payment_status: { type: 'string', enum: ['Paid', 'Due', 'Partial'], default: 'Due' },
        partially_paid: { type: 'number', default: 0 },
    },
};
