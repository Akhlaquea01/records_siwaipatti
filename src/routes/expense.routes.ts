import { Router } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import { validate } from '../middleware/validate.js';
import {
    createExpenseSchema,
    updateExpenseSchema,
    patchExpenseSchema,
} from '../schemas/expense.schema.js';
import * as ctrl from '../controllers/expense.controller.js';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createExpenseSchema), ctrl.create);
router.put('/:id', validate(updateExpenseSchema), ctrl.update);
router.patch('/:id', validate(patchExpenseSchema), ctrl.partialUpdate);
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
    '/expenses': {
        get: {
            summary: 'List expenses — grouped by year → month',
            description: 'Returns data as { year: { month: { incomeDetails, expense_details: [...] } } } matching mock-data/expenses.json format.',
            tags: ['Expenses'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 1000, maximum: 1000 } },
                { in: 'query', name: 'year', schema: { type: 'integer' }, description: 'Filter to a single year', example: 2025 },
                { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Filter by category', example: 'Food' },
                { in: 'query', name: 'payment_method', schema: { type: 'string', enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'] } },
                { in: 'query', name: 'from', schema: { type: 'string', format: 'date' }, description: 'From date (inclusive)', example: '2025-01-01' },
                { in: 'query', name: 'to', schema: { type: 'string', format: 'date' }, description: 'To date (inclusive)', example: '2025-12-31' },
            ],
            responses: {
                200: {
                    description: 'Year/month grouped expenses',
                    content: {
                        'application/json': {
                            schema: ref('ExpenseYearView'),
                            example: {
                                success: true,
                                data: {
                                    '2025': {
                                        January: {
                                            incomeDetails: { totalIncome: 0 },
                                            expense_details: [
                                                { date: '2025-01-01', amount: 800, category: 'Food', description: 'Mithai', sub_category: 'Eating out', paymentMethod: 'Cash' },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create an expense',
            tags: ['Expenses'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ref('ExpenseInput'),
                        example: { txn_date: '2025-03-15', amount: 800, description: 'Mithai', category: 'Food', sub_category: 'Eating out', payment_method: 'Cash' },
                    },
                },
            },
            responses: { 201: singleResponse('Expense', 'Expense created'), 400: validationErr },
        },
    },

    '/expenses/{id}': {
        get: {
            summary: 'Get expense by ID',
            tags: ['Expenses'],
            parameters: [idParam],
            responses: { 200: singleResponse('Expense', 'Expense found'), 404: notFound },
        },
        put: {
            summary: 'Fully replace an expense',
            tags: ['Expenses'],
            parameters: [idParam],
            requestBody: { required: true, content: { 'application/json': { schema: ref('ExpenseInput') } } },
            responses: { 200: singleResponse('Expense', 'Expense updated'), 400: validationErr, 404: notFound },
        },
        patch: {
            summary: 'Partially update an expense',
            tags: ['Expenses'],
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object', example: { amount: 950, payment_method: 'UPI' } } } },
            },
            responses: { 200: singleResponse('Expense', 'Expense patched'), 400: validationErr, 404: notFound },
        },
        delete: {
            summary: 'Delete an expense',
            tags: ['Expenses'],
            parameters: [idParam],
            responses: { 200: { description: 'Expense deleted', content: { 'application/json': { schema: ref('DeleteResponse') } } }, 404: notFound },
        },
    },
};

export default router;
