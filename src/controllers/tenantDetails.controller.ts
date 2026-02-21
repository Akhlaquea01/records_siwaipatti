import type { Request, Response, NextFunction } from 'express';
import { TenantDetails } from '../models/TenantDetails.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/v1/tenants?page=1&limit=20&status=Active
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['status']) filter['status'] = req.query['status'];
        if (req.query['shop_no']) filter['shop_no'] = req.query['shop_no'];
        if (req.query['agreement_status']) filter['agreement_status'] = req.query['agreement_status'];
        if (req.query['tenant_name']) {
            filter['tenant_name'] = new RegExp(req.query['tenant_name'] as string, 'i');
        }

        const [data, total] = await Promise.all([
            TenantDetails.find(filter).sort({ shop_no: 1 }).skip(skip).limit(limit).lean(),
            TenantDetails.countDocuments(filter),
        ]);

        res.json(ApiResponse.list(data, total, page, limit));
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
        res.json(ApiResponse.ok(doc));
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/tenants
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await TenantDetails.create(req.body);
        res.status(201).json(ApiResponse.ok(doc, 'Tenant created'));
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
        res.json(ApiResponse.ok(doc, 'Tenant updated'));
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
        res.json(ApiResponse.ok(doc, 'Tenant partially updated'));
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
