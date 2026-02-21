import type { Request, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/v1/expenses?page=1&limit=20&category=Food&payment_method=Cash
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
        const skip = (page - 1) * limit;

        // Optional filters
        const filter: Record<string, unknown> = {};
        if (req.query['category']) filter['category'] = req.query['category'];
        if (req.query['payment_method']) filter['payment_method'] = req.query['payment_method'];
        if (req.query['from'] || req.query['to']) {
            filter['txn_date'] = {
                ...(req.query['from'] ? { $gte: new Date(req.query['from'] as string) } : {}),
                ...(req.query['to'] ? { $lte: new Date(req.query['to'] as string) } : {}),
            };
        }

        const [data, total] = await Promise.all([
            Expense.find(filter).sort({ txn_date: -1 }).skip(skip).limit(limit).lean(),
            Expense.countDocuments(filter),
        ]);

        res.json(ApiResponse.list(data, total, page, limit));
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/expenses/:id
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Expense not found'));
            return;
        }
        res.json(ApiResponse.ok(doc));
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/expenses
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.create(req.body);
        res.status(201).json(ApiResponse.ok(doc, 'Expense created'));
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/expenses/:id
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findByIdAndUpdate(
            req.params['id'],
            req.body,
            { new: true, runValidators: true, overwrite: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Expense not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Expense updated'));
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/expenses/:id
export const partialUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findByIdAndUpdate(
            req.params['id'],
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Expense not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Expense partially updated'));
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/expenses/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Expense not found'));
            return;
        }
        res.json(ApiResponse.ok(null, 'Expense deleted'));
    } catch (err) {
        next(err);
    }
};
