import type { Request, Response, NextFunction } from 'express';
import type { Document } from 'mongoose';
import { TenantDetails } from '../models/TenantDetails.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ─── Shape helper ─────────────────────────────────────────────────────────────
// The UI expects { shop_no, tenant: { ...all_other_fields } }
// Mongoose stores everything flat — we transform on read only.

type FlatTenant = {
    _id: unknown;
    shop_no: string;
    tenant_name?: string;
    fathers_name?: string;
    id_number?: string;
    mobile_number?: string;
    email?: string;
    address?: string;
    monthly_rent?: number;
    advance_paid?: number | null;
    agreement_status?: string;
    status?: string;
    comment?: string | null;
    advance_remaining?: number | null;
    total_due?: number;
    due_months?: string;
    tenant_name_hindi?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
    [key: string]: unknown;
};

const toUIShape = (doc: FlatTenant) => {
    const { shop_no, _id, createdAt, updatedAt, __v, ...rest } = doc;
    return {
        _id,
        shop_no,
        tenant: rest,
        createdAt,
        updatedAt,
    };
};

// GET /api/v1/tenants
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query['limit'] as string) || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['status']) filter['status'] = req.query['status'];
        if (req.query['shop_no']) filter['shop_no'] = req.query['shop_no'];
        if (req.query['agreement_status']) filter['agreement_status'] = req.query['agreement_status'];
        if (req.query['tenant_name']) filter['tenant_name'] = new RegExp(req.query['tenant_name'] as string, 'i');

        const [data, total] = await Promise.all([
            TenantDetails.find(filter).sort({ shop_no: 1 }).skip(skip).limit(limit).lean(),
            TenantDetails.countDocuments(filter),
        ]);

        const shaped = (data as FlatTenant[]).map(toUIShape);
        res.json(ApiResponse.list(shaped, total, page, limit));
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/tenants/:id
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Tenant not found'));
            return;
        }
        res.json(ApiResponse.ok(toUIShape(doc as FlatTenant)));
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/tenants  (accepts flat body — Joi validated)
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.create(req.body);
        res.status(201).json(ApiResponse.ok(toUIShape((doc as unknown as Document & FlatTenant).toObject()), 'Tenant created'));
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/tenants/:id
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.findByIdAndUpdate(
            req.params['id'],
            req.body,
            { new: true, runValidators: true, overwrite: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Tenant not found'));
            return;
        }
        res.json(ApiResponse.ok(toUIShape(doc as FlatTenant), 'Tenant updated'));
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/tenants/:id
export const partialUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.findByIdAndUpdate(
            req.params['id'],
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Tenant not found'));
            return;
        }
        res.json(ApiResponse.ok(toUIShape(doc as FlatTenant), 'Tenant partially updated'));
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/tenants/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Tenant not found'));
            return;
        }
        res.json(ApiResponse.ok(null, 'Tenant deleted'));
    } catch (err) {
        next(err);
    }
};
