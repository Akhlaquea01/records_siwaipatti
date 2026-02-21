import type { Request, Response, NextFunction } from 'express';
import { RentLedger } from '../models/RentLedger.js';
import { TenantDetails } from '../models/TenantDetails.js';
import { AdvanceTracker } from '../models/AdvanceTracker.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// Short month abbreviations used in due_months string (e.g. "Sep-24, Jan-26")
const SHORT_MONTH: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

// Status mapping: DB enum → UI label
const STATUS_MAP: Record<string, string> = {
    Paid: 'Paid',
    Due: 'Due',
    Partial: 'Partially Paid',
    '-': '-',
};

// Parse "Sep-24, Jan-26" → [{ month: "September", year: 2024 }, ...]
const parseDueMonths = (raw: string | undefined): Array<{ month: string; year: number; label: string }> => {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').flatMap(part => {
        const m = part.trim().match(/^([A-Za-z]+)-(\d{2,4})$/);
        if (!m) return [];
        const monthFull = SHORT_MONTH[m[1]!] ?? m[1]!;
        const yr = parseInt(m[2]!) + (m[2]!.length === 2 ? 2000 : 0);
        return [{ month: monthFull, year: yr, label: `${monthFull} ${yr}` }];
    });
};

// GET /api/v1/rent-ledger/year/:year — 3-collection aggregated year view
export const getByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const year = parseInt(req.params['year'] ?? '');
        if (isNaN(year)) {
            res.status(400).json(ApiResponse.error('Invalid year'));
            return;
        }

        // 1. BASE: Fetch all RentLedger records for the target year.
        // The SQL query uses `FROM rent_ledger rl` and `WHERE rent_year = target_year`
        // as the final root list of shops. This ensures legacy shops (e.g. 001, 002)
        // with transactions in 2025 are still included even if deleted from TenantDetails.
        const ledgerRecordsThisYear = await RentLedger.find({ rent_year: year }).lean();

        if (ledgerRecordsThisYear.length === 0) {
            res.json({ success: true, message: 'Success', data: { [year]: { shops: {} } } });
            return;
        }

        const shopNosThisYear = [...new Set(ledgerRecordsThisYear.map(r => r.shop_no))];

        // 2. Fetch all unpaid ledger records for previous dues calculation (<= target_year)
        const unpaidLedgerRecords = await RentLedger.find({
            shop_no: { $in: shopNosThisYear },
            rent_year: { $lte: year },
            payment_status: { $nin: ['Paid', '-'] }
        }).lean();

        // 3. Fetch tenants and advances for the active shops
        const [tenants, advances] = await Promise.all([
            TenantDetails.find({ shop_no: { $in: shopNosThisYear } }).lean(),
            AdvanceTracker.find({ shop_no: { $in: shopNosThisYear } }).lean(),
        ]);

        const tenantMap = new Map<string, typeof tenants>();
        for (const t of tenants) {
            if (!tenantMap.has(t.shop_no)) tenantMap.set(t.shop_no, []);
            tenantMap.get(t.shop_no)!.push(t);
        }

        const advanceMap = new Map<string, typeof advances>();
        for (const a of advances) {
            if (!advanceMap.has(a.shop_no)) advanceMap.set(a.shop_no, []);
            advanceMap.get(a.shop_no)!.push(a);
        }

        const unpaidMap = new Map<string, typeof unpaidLedgerRecords>();
        for (const r of unpaidLedgerRecords) {
            if (!unpaidMap.has(r.shop_no)) unpaidMap.set(r.shop_no, []);
            unpaidMap.get(r.shop_no)!.push(r);
        }

        const ledgerMap = new Map<string, typeof ledgerRecordsThisYear>();
        for (const r of ledgerRecordsThisYear) {
            if (!ledgerMap.has(r.shop_no)) ledgerMap.set(r.shop_no, []);
            ledgerMap.get(r.shop_no)!.push(r);
        }

        // Build per-shop output based EXACTLY on RentLedger data (like SQL)
        const shops: Record<string, unknown> = {};

        for (const [shopNo, records] of ledgerMap.entries()) {
            // Equivalent to MAX(r.tenant_name)
            const tenantNames = records.map(r => r.tenant_name).filter(Boolean);
            tenantNames.sort();
            const maxTenantName = tenantNames[tenantNames.length - 1] ?? '';

            // LEFT JOIN tenant_details t ON r.shop_no = t.shop_no AND r.tenant_name = t.tenant_name
            const matchedTenants = tenantMap.get(shopNo)?.filter(t => t.tenant_name === maxTenantName) || [];

            // To mimic SQL MAX() for all tenant fields
            const maxVal = (key: keyof typeof tenants[0]) => {
                const vals = matchedTenants.map(t => t[key]).filter(v => v !== undefined && v !== null && v !== '');
                vals.sort();
                return vals[vals.length - 1] as any;
            };

            const t_mobile_number = maxVal('mobile_number') ?? '';
            const t_id_number = maxVal('id_number') ?? '';
            const t_fathers_name = maxVal('fathers_name') ?? '';
            const t_tenant_name_hindi = maxVal('tenant_name_hindi') ?? '';
            const t_email = maxVal('email') ?? '';
            const t_address = maxVal('address') ?? '';
            const t_status = maxVal('status') ?? 'Active';
            const t_monthly_rent = maxVal('monthly_rent') ?? (records[0]?.monthly_rent ?? 0);

            // LEFT JOIN advance_tracker a ON r.shop_no = a.shop_no AND r.tenant_name = a.tenant_name
            const matchedAdvances = advanceMap.get(shopNo)?.filter(a => a.tenant_name === maxTenantName) || [];
            const a_advance_remaining = (() => {
                const vals = matchedAdvances.map(a => Number((a as any).advance_remaining)).filter(v => !isNaN(v));
                vals.sort((a, b) => a - b);
                return vals[vals.length - 1] ?? 0;
            })();

            // MIN(r.payment_date)
            let minPaymentDate: string | Date | undefined;
            for (const rec of records) {
                if (!minPaymentDate || (rec.payment_date && new Date(rec.payment_date) < new Date(minPaymentDate))) {
                    minPaymentDate = rec.payment_date;
                }
            }

            // previous_dues calculation matching SQL exactly
            let totalDues = 0;
            const shopUnpaid = unpaidMap.get(shopNo) || [];

            // Filter out current year from unpaid dues as we only want *previous* year dues
            const prevUnpaidRecs = shopUnpaid.filter(u => u.rent_year < year);

            // Sort unpaid records chronologically (ORDER BY u2.rent_year, to_date(u2.rent_month,'Month'))
            prevUnpaidRecs.sort((prev, next) => {
                if (prev.rent_year !== next.rent_year) return prev.rent_year - next.rent_year;
                const m1 = MONTH_NAMES.indexOf(prev.rent_month);
                const m2 = MONTH_NAMES.indexOf(next.rent_month);
                return m1 - m2;
            });

            const dueMonths: string[] = [];
            for (const u of prevUnpaidRecs) {
                const rent = u.monthly_rent ?? 0;
                const paid = u.amount_paid ?? 0;
                const adv = u.advance_deducted ?? 0;
                const partial = u.partially_paid ?? 0;

                totalDues += rent - (paid + adv + partial);

                const monthStr = u.rent_month || '';
                const formatMonth = monthStr.length > 3 ? monthStr : SHORT_MONTH[monthStr] || monthStr;
                dueMonths.push(`${formatMonth} ${u.rent_year}`); // e.g. "August 2023"
            }

            // regexp_replace(MAX(t.id_number), '.*(\d{4})$', 'XXXX-XXXX-\1')
            let maskedId = '';
            if (t_id_number) {
                const idStr = String(t_id_number);
                if (/\d{4}$/.test(idStr)) {
                    maskedId = idStr.replace(/.*?(\d{4})$/, 'XXXX-XXXX-$1');
                } else {
                    maskedId = idStr;
                }
            }

            let agreementDate = '';
            if (minPaymentDate) {
                if (minPaymentDate instanceof Date) {
                    agreementDate = minPaymentDate.toISOString().split('T')[0] ?? '';
                } else {
                    agreementDate = String(minPaymentDate).split('T')[0] ?? '';
                }
            } else {
                agreementDate = `${year}-01-01`;
            }

            const monthlyData: Record<string, unknown> = {};
            for (const rec of records) {
                let dateStr = '';
                if (rec.payment_date) {
                    if (rec.payment_date instanceof Date) {
                        dateStr = rec.payment_date.toISOString().split('T')[0] ?? '';
                    } else {
                        dateStr = String(rec.payment_date).split('T')[0] ?? '';
                    }
                }

                monthlyData[rec.rent_month] = {
                    rent: rec.monthly_rent ?? t_monthly_rent,
                    paid: rec.amount_paid ?? 0,
                    status: rec.payment_status ?? '',
                    date: dateStr,
                    advanceUsed: rec.advance_deducted ?? 0,
                    comment: rec.Comments ?? ''
                };
            }

            shops[shopNo] = {
                tenant: {
                    name: maxTenantName,
                    phoneNumber: t_mobile_number,
                    id_number: maskedId,
                    father_name: t_fathers_name,
                    tenant_name_hindi: t_tenant_name_hindi,
                    email: t_email,
                    address: t_address,
                    status: t_status,
                    agreementDate: agreementDate
                },
                rentAmount: t_monthly_rent,
                monthlyData,
                advanceAmount: a_advance_remaining,
                previousYearDues: {
                    totalDues,
                    dueMonths,
                    description: 'Unpaid rents up to this year'
                }
            };
        }

        res.json({
            success: true,
            message: 'Success',
            data: { [year]: { shops } },
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/rent-ledger?page=1&limit=20&shop_no=063&rent_year=2025&payment_status=Due
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query['limit'] as string) || 20));
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
