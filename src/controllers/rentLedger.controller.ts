import type { Request, Response, NextFunction } from 'express';
import { RentLedger } from '../models/RentLedger.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/v1/rent-ledger?page=1&limit=20&shop_no=063&rent_year=2025&payment_status=Due
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['shop_no']) filter['shop_no'] = req.query['shop_no'];
        if (req.query['tenant_name']) filter['tenant_name'] = new RegExp(req.query['tenant_name'] as string, 'i');
        if (req.query['rent_year']) filter['rent_year'] = parseInt(req.query['rent_year'] as string);
        if (req.query['rent_month']) filter['rent_month'] = req.query['rent_month'];
        if (req.query['payment_status']) filter['payment_status'] = req.query['payment_status'];

        const [data, total] = await Promise.all([
            RentLedger.find(filter).sort({ rent_year: -1, payment_date: -1 }).skip(skip).limit(limit).lean(),
            RentLedger.countDocuments(filter),
        ]);

        res.json(ApiResponse.list(data, total, page, limit));
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/rent-ledger/:id
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await RentLedger.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Rent ledger entry not found'));
            return;
        }
        res.json(ApiResponse.ok(doc));
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/rent-ledger
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await RentLedger.create(req.body);
        res.status(201).json(ApiResponse.ok(doc, 'Rent ledger entry created'));
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/rent-ledger/:id
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await RentLedger.findByIdAndUpdate(
            req.params['id'],
            req.body,
            { new: true, runValidators: true, overwrite: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Rent ledger entry not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Rent ledger entry updated'));
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/rent-ledger/:id
export const partialUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await RentLedger.findByIdAndUpdate(
            req.params['id'],
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Rent ledger entry not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Rent ledger entry partially updated'));
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/rent-ledger/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await RentLedger.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Rent ledger entry not found'));
            return;
        }
        res.json(ApiResponse.ok(null, 'Rent ledger entry deleted'));
    } catch (err) {
        next(err);
    }
};
