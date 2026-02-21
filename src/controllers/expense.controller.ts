import type { Request, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense.js';

// ─── Month name lookup ─────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

type FlatExpense = {
    _id: unknown;
    txn_date: Date | null;
    amount: number;
    description: string;
    category: string;
    sub_category: string;
    payment_method: string;
    [key: string]: unknown;
};

type ExpenseItem = {
    _id: unknown;
    date: string | null;
    amount: number;
    category: string;
    description: string;
    sub_category: string;
    paymentMethod: string;       // camelCase to match mock-data/expenses.json
};

type MonthData = {
    incomeDetails: { totalIncome: number };
    expense_details: ExpenseItem[];
};

// Group flat records into { year: { month: { incomeDetails, expense_details: [] } } }
const groupByYearMonth = (docs: FlatExpense[]): Record<string, Record<string, MonthData>> => {
    const result: Record<string, Record<string, MonthData>> = {};

    for (const doc of docs) {
        const d = doc.txn_date ? new Date(doc.txn_date) : null;
        const year = d ? String(d.getFullYear()) : 'Unknown';
        const month = d ? MONTH_NAMES[d.getMonth()]! : 'Unknown';

        result[year] ??= {};
        result[year]![month] ??= { incomeDetails: { totalIncome: 0 }, expense_details: [] };

        result[year]![month]!.expense_details.push({
            _id: doc._id,
            date: d ? d.toISOString().substring(0, 10) : null,
            amount: doc.amount,
            category: doc.category,
            description: doc.description,
            sub_category: doc.sub_category,
            paymentMethod: doc.payment_method,   // snake_case → camelCase
        });
    }

    return result;
};

// GET /api/v1/expenses  — returns { year: { month: { incomeDetails, expense_details } } }
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query['limit'] as string) || 1000));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['category']) filter['category'] = req.query['category'];
        if (req.query['payment_method']) filter['payment_method'] = req.query['payment_method'];
        if (req.query['from'] || req.query['to']) {
            filter['txn_date'] = {
                ...(req.query['from'] ? { $gte: new Date(req.query['from'] as string) } : {}),
                ...(req.query['to'] ? { $lte: new Date(req.query['to'] as string) } : {}),
            };
        }
        // Filter by year (e.g. ?year=2024)
        if (req.query['year']) {
            const y = parseInt(req.query['year'] as string);
            filter['txn_date'] = {
                ...(filter['txn_date'] as object ?? {}),
                $gte: new Date(`${y}-01-01`),
                $lte: new Date(`${y}-12-31`),
            };
        }

        const [data, total] = await Promise.all([
            Expense.find(filter).sort({ txn_date: 1 }).skip(skip).limit(limit).lean(),
            Expense.countDocuments(filter),
        ]);

        const grouped = groupByYearMonth(data as FlatExpense[]);

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

// GET /api/v1/expenses/:id  — single flat record (for edit forms)
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findById(req.params['id']).lean();
        if (!doc) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, message: 'Success', data: doc });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/expenses
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.create(req.body);
        res.status(201).json({ success: true, message: 'Expense created', data: doc });
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
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, message: 'Expense updated', data: doc });
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
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, message: 'Expense partially updated', data: doc });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/expenses/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doc = await Expense.findByIdAndDelete(req.params['id']).lean();
        if (!doc) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, message: 'Expense deleted', data: null });
    } catch (err) {
        next(err);
    }
};
