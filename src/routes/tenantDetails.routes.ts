import { Router } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import { validate } from '../middleware/validate.js';
import {
    createTenantSchema,
    updateTenantSchema,
    patchTenantSchema,
} from '../schemas/tenantDetails.schema.js';
import * as ctrl from '../controllers/tenantDetails.controller.js';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createTenantSchema), ctrl.create);
router.put('/:id', validate(updateTenantSchema), ctrl.update);
router.patch('/:id', validate(patchTenantSchema), ctrl.partialUpdate);
router.delete('/:id', ctrl.remove);

// ─── OpenAPI Path Definitions (JSON – no JSDoc) ───────────────────────────────

const ref = (name: string): OpenAPIV3.ReferenceObject => ({ $ref: `#/components/schemas/${name}` });
const notFound: OpenAPIV3.ReferenceObject = { $ref: '#/components/responses/NotFound' };
const validationErr: OpenAPIV3.ReferenceObject = { $ref: '#/components/responses/ValidationError' };
const idParam: OpenAPIV3.ParameterObject = {
    in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'MongoDB ObjectId',
};

const singleResponse = (schemaName: string, msg: string): OpenAPIV3.ResponseObject => ({
    description: msg,
    content: { 'application/json': { schema: { allOf: [ref('SingleResponse'), { type: 'object', properties: { data: ref(schemaName) } }] } } },
});

export const paths: OpenAPIV3.PathsObject = {
    '/tenants': {
        get: {
            summary: 'List all tenants',
            tags: ['Tenants'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
                { in: 'query', name: 'status', schema: { type: 'string', enum: ['Active', 'Inactive'] }, description: 'Filter by tenant status' },
                { in: 'query', name: 'shop_no', schema: { type: 'string' }, description: 'Filter by exact shop number', example: '061' },
                { in: 'query', name: 'agreement_status', schema: { type: 'string', enum: ['Yes', 'No'] } },
                { in: 'query', name: 'tenant_name', schema: { type: 'string' }, description: 'Case-insensitive partial name search', example: 'kumar' },
            ],
            responses: {
                200: {
                    description: 'Paginated tenant list',
                    content: { 'application/json': { schema: { allOf: [ref('PaginatedResponse'), { type: 'object', properties: { data: { type: 'array', items: ref('TenantDetails') } } }] } } },
                },
            },
        },
        post: {
            summary: 'Create a tenant',
            tags: ['Tenants'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ref('TenantDetailsInput'),
                        example: { shop_no: '062', tenant_name: 'Ramesh Gupta', monthly_rent: 2500, agreement_status: 'Yes', status: 'Active', tenant_name_hindi: 'रमेश गुप्ता' },
                    },
                },
            },
            responses: {
                201: singleResponse('TenantDetails', 'Tenant created'),
                400: validationErr,
                409: { description: 'shop_no already exists', content: { 'application/json': { schema: ref('ErrorResponse') } } },
            },
        },
    },

    '/tenants/{id}': {
        get: {
            summary: 'Get tenant by ID',
            tags: ['Tenants'],
            parameters: [idParam],
            responses: { 200: singleResponse('TenantDetails', 'Tenant found'), 404: notFound },
        },
        put: {
            summary: 'Fully replace a tenant record',
            tags: ['Tenants'],
            parameters: [idParam],
            requestBody: { required: true, content: { 'application/json': { schema: ref('TenantDetailsInput') } } },
            responses: { 200: singleResponse('TenantDetails', 'Tenant updated'), 400: validationErr, 404: notFound },
        },
        patch: {
            summary: 'Partially update a tenant',
            tags: ['Tenants'],
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object', example: { status: 'Inactive', total_due: 6000, due_months: 'Jan, Feb, March' } } } },
            },
            responses: { 200: singleResponse('TenantDetails', 'Tenant patched'), 400: validationErr, 404: notFound },
        },
        delete: {
            summary: 'Delete a tenant',
            tags: ['Tenants'],
            parameters: [idParam],
            responses: { 200: { description: 'Tenant deleted', content: { 'application/json': { schema: ref('DeleteResponse') } } }, 404: notFound },
        },
    },
};

export default router;
