import type { Request, Response, NextFunction } from 'express';
import { AdvanceTracker } from '../models/AdvanceTracker.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/v1/advance-tracker?page=1&limit=20
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query['limit'] as string) || 20));
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            AdvanceTracker.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AdvanceTracker.countDocuments(),
        ]);

        res.json(ApiResponse.list(data, total, page, limit));
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/advance-tracker/:id
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Advance tracker record not found'));
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
        res.status(201).json(ApiResponse.ok(doc, 'Advance tracker record created'));
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/advance-tracker/:id  (full replace)
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndUpdate(
            req.params['id'],
            req.body,
            { new: true, runValidators: true, overwrite: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Advance tracker record not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Advance tracker record updated'));
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/advance-tracker/:id  (partial update)
export const partialUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndUpdate(
            req.params['id'],
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Advance tracker record not found'));
            return;
        }
        res.json(ApiResponse.ok(doc, 'Advance tracker record partially updated'));
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/advance-tracker/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await AdvanceTracker.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json(ApiResponse.error('Advance tracker record not found'));
            return;
        }
        res.json(ApiResponse.ok(null, 'Advance tracker record deleted'));
    } catch (err) {
        next(err);
    }
};
