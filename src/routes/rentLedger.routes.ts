import { Router } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import { validate } from '../middleware/validate.js';
import {
    createRentLedgerSchema,
    updateRentLedgerSchema,
    patchRentLedgerSchema,
} from '../schemas/rentLedger.schema.js';
import * as ctrl from '../controllers/rentLedger.controller.js';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createRentLedgerSchema), ctrl.create);
router.put('/:id', validate(updateRentLedgerSchema), ctrl.update);
router.patch('/:id', validate(patchRentLedgerSchema), ctrl.partialUpdate);
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
    '/rent-ledger': {
        get: {
            summary: 'List rent ledger entries',
            tags: ['Rent Ledger'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
                { in: 'query', name: 'shop_no', schema: { type: 'string' }, description: 'Filter by shop number', example: '063' },
                { in: 'query', name: 'tenant_name', schema: { type: 'string' }, description: 'Partial/regex match on tenant name', example: 'Vinay' },
                { in: 'query', name: 'rent_year', schema: { type: 'integer' }, description: 'Filter by rent year', example: 2025 },
                { in: 'query', name: 'rent_month', schema: { type: 'string' }, description: 'Filter by rent month name', example: 'March' },
                { in: 'query', name: 'payment_status', schema: { type: 'string', enum: ['Paid', 'Due', 'Partial'] } },
            ],
            responses: {
                200: {
                    description: 'Paginated rent ledger list',
                    content: { 'application/json': { schema: { allOf: [ref('PaginatedResponse'), { type: 'object', properties: { data: { type: 'array', items: ref('RentLedger') } } }] } } },
                },
            },
        },
        post: {
            summary: 'Create a rent ledger entry',
            tags: ['Rent Ledger'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ref('RentLedgerInput'),
                        example: { payment_date: '2025-03-01', shop_no: '063', tenant_name: 'Vinay Kumar', rent_month: 'March', rent_year: 2025, monthly_rent: 3000, payment_status: 'Due' },
                    },
                },
            },
            responses: { 201: singleResponse('RentLedger', 'Entry created'), 400: validationErr },
        },
    },

    '/rent-ledger/{id}': {
        get: {
            summary: 'Get rent ledger entry by ID',
            tags: ['Rent Ledger'],
            parameters: [idParam],
            responses: { 200: singleResponse('RentLedger', 'Entry found'), 404: notFound },
        },
        put: {
            summary: 'Fully replace a rent ledger entry',
            tags: ['Rent Ledger'],
            parameters: [idParam],
            requestBody: { required: true, content: { 'application/json': { schema: ref('RentLedgerInput') } } },
            responses: { 200: singleResponse('RentLedger', 'Entry updated'), 400: validationErr, 404: notFound },
        },
        patch: {
            summary: 'Mark payment / partial update',
            tags: ['Rent Ledger'],
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object', example: { amount_paid: 3000, payment_status: 'Paid' } } } },
            },
            responses: { 200: singleResponse('RentLedger', 'Entry patched'), 400: validationErr, 404: notFound },
        },
        delete: {
            summary: 'Delete a rent ledger entry',
            tags: ['Rent Ledger'],
            parameters: [idParam],
            responses: { 200: { description: 'Entry deleted', content: { 'application/json': { schema: ref('DeleteResponse') } } }, 404: notFound },
        },
    },
};

export default router;
