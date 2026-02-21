import Joi from 'joi';
import type { OpenAPIV3 } from 'openapi-types';

// ─── Joi Validation Schemas ──────────────────────────────────────────────────

export const createTenantSchema = Joi.object({
    shop_no: Joi.string().trim().required(),
    tenant_name: Joi.string().trim().required(),
    fathers_name: Joi.string().trim().allow('').default(''),
    id_number: Joi.string().trim().allow('').default(''),
    mobile_number: Joi.string().trim().allow('').default(''),
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().allow('').default(''),
    address: Joi.string().trim().allow('').default(''),
    monthly_rent: Joi.number().min(0).required(),
    advance_paid: Joi.number().min(0).allow(null).default(null),
    agreement_status: Joi.string().valid('Yes', 'No').default('No'),
    status: Joi.string().valid('Active', 'Inactive').default('Active'),
    comment: Joi.string().allow(null, '').default(null),
    advance_remaining: Joi.number().min(0).allow(null).default(null),
    total_due: Joi.number().default(0),
    due_months: Joi.string().allow('').default(''),
    tenant_name_hindi: Joi.string().allow('').default(''),
});

export const updateTenantSchema = createTenantSchema;

export const patchTenantSchema = Joi.object({
    shop_no: Joi.string().trim(),
    tenant_name: Joi.string().trim(),
    fathers_name: Joi.string().trim().allow(''),
    id_number: Joi.string().trim().allow(''),
    mobile_number: Joi.string().trim().allow(''),
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().allow(''),
    address: Joi.string().trim().allow(''),
    monthly_rent: Joi.number().min(0),
    advance_paid: Joi.number().min(0).allow(null),
    agreement_status: Joi.string().valid('Yes', 'No'),
    status: Joi.string().valid('Active', 'Inactive'),
    comment: Joi.string().allow(null, ''),
    advance_remaining: Joi.number().min(0).allow(null),
    total_due: Joi.number(),
    due_months: Joi.string().allow(''),
    tenant_name_hindi: Joi.string().allow(''),
}).min(1);

// ─── OpenAPI Component Schemas (pure JSON – no JSDoc) ────────────────────────

export const TenantDetailsSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        _id: { type: 'string', readOnly: true, example: '699976543230bb2a0d237c14' },
        shop_no: { type: 'string', example: '061' },
        tenant_name: { type: 'string', example: 'Ashok Rai' },
        fathers_name: { type: 'string', example: '' },
        id_number: { type: 'string', example: '' },
        mobile_number: { type: 'string', example: '9876543210' },
        email: { type: 'string', format: 'email', example: 'ashok@example.com' },
        address: { type: 'string', example: '' },
        monthly_rent: { type: 'number', minimum: 0, example: 2000 },
        advance_paid: { type: 'number', nullable: true, example: null },
        agreement_status: { type: 'string', enum: ['Yes', 'No'], example: 'No' },
        status: { type: 'string', enum: ['Active', 'Inactive'], example: 'Inactive' },
        comment: { type: 'string', nullable: true, example: null },
        advance_remaining: { type: 'number', nullable: true, example: null },
        total_due: { type: 'number', example: 0 },
        due_months: { type: 'string', example: '' },
        tenant_name_hindi: { type: 'string', example: 'अशोक राय' },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
    },
};

export const TenantDetailsInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['shop_no', 'tenant_name', 'monthly_rent'],
    properties: {
        shop_no: { type: 'string', example: '061' },
        tenant_name: { type: 'string', example: 'Ashok Rai' },
        fathers_name: { type: 'string' },
        id_number: { type: 'string' },
        mobile_number: { type: 'string' },
        email: { type: 'string', format: 'email' },
        address: { type: 'string' },
        monthly_rent: { type: 'number', minimum: 0, example: 2000 },
        advance_paid: { type: 'number', nullable: true },
        agreement_status: { type: 'string', enum: ['Yes', 'No'], default: 'No' },
        status: { type: 'string', enum: ['Active', 'Inactive'], default: 'Active' },
        comment: { type: 'string', nullable: true },
        advance_remaining: { type: 'number', nullable: true },
        total_due: { type: 'number', default: 0 },
        due_months: { type: 'string' },
        tenant_name_hindi: { type: 'string' },
    },
};
