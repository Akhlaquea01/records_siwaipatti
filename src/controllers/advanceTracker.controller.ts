import type { Request, Response, NextFunction } from 'express';
import { AdvanceTracker } from '../models/AdvanceTracker.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ─── Shape helper ─────────────────────────────────────────────────────────────
// The UI expects data grouped by shop_no:
// { shop_no, transactions: [{ date, name, type, amount, status, remarks, description }] }
// The DB stores individual flat records — we group on the way out.

type FlatAdvance = {
    _id: unknown;
    shop_no: string;
    tenant_name?: string;
    advance_amount?: number;
    advance_deducted?: number | null;
    advance_remaining?: number | null;
    status?: string;
    comment?: string;
    [key: string]: unknown;
};

const toTransaction = (doc: FlatAdvance) => ({
    _id: doc._id,
    date: (doc as Record<string, unknown>)['createdAt'] ?? null,
    name: doc.tenant_name ?? '',
    type: 'Deposit',                   // DB records are advance deposits
    amount: doc.advance_amount ?? 0,
    status: doc.status ?? 'Active',
    remarks: doc.comment ?? '',
    description: doc.comment ?? '',
    advance_deducted: doc.advance_deducted ?? null,
    advance_remaining: doc.advance_remaining ?? null,
});

const groupByShopNo = (docs: FlatAdvance[]): Record<string, ReturnType<typeof toTransaction>[]> => {
    const result: Record<string, ReturnType<typeof toTransaction>[]> = {};
    for (const doc of docs) {
        const key = doc.shop_no ?? '';
        if (!result[key]) result[key] = [];
        result[key]!.push(toTransaction(doc));
    }
    return result;
};

// GET /api/v1/advance-tracker  — returns object keyed by shop_no (matches data.json format)
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query['limit'] as string) || 1000));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['status']) filter['status'] = req.query['status'];
        if (req.query['tenant_name']) filter['tenant_name'] = new RegExp(req.query['tenant_name'] as string, 'i');
        if (req.query['shop_no']) filter['shop_no'] = req.query['shop_no'];

        const [data, total] = await Promise.all([
            AdvanceTracker.find(filter).sort({ shop_no: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
            AdvanceTracker.countDocuments(filter),
        ]);

        const grouped = groupByShopNo(data as FlatAdvance[]);
        // Return as { success, data: { "011": [...], "012": [...] }, pagination }
        res.json({
            success: true,
            message: 'Success',
            data: grouped,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/advance-tracker/:id  — single flat record (for edit forms)
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Record not found'));
            return;
        }
        res.json(ApiResponse.ok(doc));
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/advance-tracker
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.create(req.body);
        res.status(201).json(ApiResponse.ok(doc.toObject(), 'Record created'));
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/advance-tracker/:id
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndUpdate(
            req.params['id'],
            req.body,
            { new: true, runValidators: true, overwrite: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Record not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Record updated'));
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/advance-tracker/:id
export const partialUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndUpdate(
            req.params['id'],
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Record not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Record partially updated'));
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/advance-tracker/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Record not found'));
            return;
        }
        res.json(ApiResponse.ok(null, 'Record deleted'));
    } catch (err) {
        next(err);
    }
};
