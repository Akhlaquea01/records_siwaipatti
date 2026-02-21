import type { OpenAPIV3 } from 'openapi-types';

// ─── Schema Components ────────────────────────────────────────────────────────
import {
    AdvanceTrackerSchema,
    AdvanceTrackerInputSchema,
} from '../schemas/advanceTracker.schema.js';
import { ExpenseSchema, ExpenseInputSchema } from '../schemas/expense.schema.js';
import { RentLedgerSchema, RentLedgerInputSchema } from '../schemas/rentLedger.schema.js';
import { TenantDetailsSchema, TenantDetailsInputSchema } from '../schemas/tenantDetails.schema.js';

// ─── Route Path Objects ───────────────────────────────────────────────────────
import { paths as advancePaths } from '../routes/advanceTracker.routes.js';
import { paths as expensePaths } from '../routes/expense.routes.js';
import { paths as rentLedgerPaths } from '../routes/rentLedger.routes.js';
import { paths as tenantPaths } from '../routes/tenantDetails.routes.js';

// ─── Shared Response Schemas ──────────────────────────────────────────────────

const ErrorResponse: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Resource not found' },
        data: { type: 'object', nullable: true, example: null },
    },
};

const SingleResponse: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { type: 'object', nullable: true },
    },
};

const PaginatedResponse: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { type: 'array', items: { type: 'object' } },
        pagination: {
            type: 'object',
            properties: {
                total: { type: 'integer', example: 121 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                totalPages: { type: 'integer', example: 7 },
            },
        },
    },
};

const DeleteResponse: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Record deleted' },
        data: { nullable: true, example: null },
    },
};

// ─── Full OpenAPI Spec (programmatic – no file scanning) ─────────────────────

export const swaggerSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: 'Rent Management API',
        version: '1.0.0',
        description:
            'REST API for managing rent records, tenant details, expenses and advance tracking for Siwaipatti properties.',
        contact: {
            name: 'Records Siwaipatti',
            url: 'https://github.com/Akhlaquea01/records_siwaipatti',
        },
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],

    tags: [
        { name: 'Health', description: 'Server health check' },
        { name: 'Tenants', description: 'Tenant profiles and details' },
        { name: 'Rent Ledger', description: 'Monthly rent payment records' },
        { name: 'Advance Tracker', description: 'Tenant advance deposit management' },
        { name: 'Expenses', description: 'Property expense tracking' },
    ],

    components: {
        schemas: {
            // Shared
            ErrorResponse,
            SingleResponse,
            PaginatedResponse,
            DeleteResponse,
            // Collection schemas
            AdvanceTracker: AdvanceTrackerSchema,
            AdvanceTrackerInput: AdvanceTrackerInputSchema,
            Expense: ExpenseSchema,
            ExpenseInput: ExpenseInputSchema,
            RentLedger: RentLedgerSchema,
            RentLedgerInput: RentLedgerInputSchema,
            TenantDetails: TenantDetailsSchema,
            TenantDetailsInput: TenantDetailsInputSchema,
        },
        responses: {
            NotFound: {
                description: 'Resource not found',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            ValidationError: {
                description: 'Request body failed Joi validation',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
        },
    },

    // Merge all route-level path definitions
    paths: {
        '/health': {
            get: {
                summary: 'Health check',
                tags: ['Health'],
                responses: {
                    200: {
                        description: 'Server is operational',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'API is running' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        ...advancePaths,
        ...expensePaths,
        ...rentLedgerPaths,
        ...tenantPaths,
    },
};
