import { Router } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import { validate } from '../middleware/validate.js';
import {
    createAdvanceTrackerSchema,
    updateAdvanceTrackerSchema,
    patchAdvanceTrackerSchema,
} from '../schemas/advanceTracker.schema.js';
import * as ctrl from '../controllers/advanceTracker.controller.js';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createAdvanceTrackerSchema), ctrl.create);
router.put('/:id', validate(updateAdvanceTrackerSchema), ctrl.update);
router.patch('/:id', validate(patchAdvanceTrackerSchema), ctrl.partialUpdate);
router.delete('/:id', ctrl.remove);

// ─── OpenAPI Path Definitions (JSON – no JSDoc) ───────────────────────────────

const ref = (name: string): OpenAPIV3.ReferenceObject => ({ $ref: `#/components/schemas/${name}` });
const pageParams: OpenAPIV3.ParameterObject[] = [
    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 }, description: 'Records per page' },
];
const idParam: OpenAPIV3.ParameterObject = {
    in: 'path', name: 'id', required: true,
    schema: { type: 'string' }, description: 'MongoDB ObjectId',
};
const notFound: OpenAPIV3.ReferenceObject = { $ref: '#/components/responses/NotFound' };
const validationErr: OpenAPIV3.ReferenceObject = { $ref: '#/components/responses/ValidationError' };

const singleResponse = (schemaName: string, msg: string): OpenAPIV3.ResponseObject => ({
    description: msg,
    content: { 'application/json': { schema: { allOf: [ref('SingleResponse'), { type: 'object', properties: { data: ref(schemaName) } }] } } },
});

export const paths: OpenAPIV3.PathsObject = {
    '/advance-tracker': {
        get: {
            summary: 'List all advance tracker records',
            tags: ['Advance Tracker'],
            parameters: pageParams,
            responses: {
                200: {
                    description: 'Paginated advance tracker list',
                    content: { 'application/json': { schema: { allOf: [ref('PaginatedResponse'), { type: 'object', properties: { data: { type: 'array', items: ref('AdvanceTracker') } } }] } } },
                },
            },
        },
        post: {
            summary: 'Create an advance tracker record',
            tags: ['Advance Tracker'],
            requestBody: { required: true, content: { 'application/json': { schema: ref('AdvanceTrackerInput') } } },
            responses: {
                201: singleResponse('AdvanceTracker', 'Record created'),
                400: validationErr,
            },
        },
    },

    '/advance-tracker/{id}': {
        get: {
            summary: 'Get advance tracker record by ID',
            tags: ['Advance Tracker'],
            parameters: [idParam],
            responses: { 200: singleResponse('AdvanceTracker', 'Record found'), 404: notFound },
        },
        put: {
            summary: 'Fully replace an advance tracker record',
            tags: ['Advance Tracker'],
            parameters: [idParam],
            requestBody: { required: true, content: { 'application/json': { schema: ref('AdvanceTrackerInput') } } },
            responses: { 200: singleResponse('AdvanceTracker', 'Record updated'), 400: validationErr, 404: notFound },
        },
        patch: {
            summary: 'Partially update an advance tracker record',
            tags: ['Advance Tracker'],
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object', description: 'Any subset of AdvanceTrackerInput fields', example: { advance_deducted: 5000, advance_remaining: 45000 } } } },
            },
            responses: { 200: singleResponse('AdvanceTracker', 'Record patched'), 400: validationErr, 404: notFound },
        },
        delete: {
            summary: 'Delete an advance tracker record',
            tags: ['Advance Tracker'],
            parameters: [idParam],
            responses: { 200: { description: 'Record deleted', content: { 'application/json': { schema: ref('DeleteResponse') } } }, 404: notFound },
        },
    },
};

export default router;
