import { Schema, model, Document, Types } from 'mongoose';

export interface IRentLedger extends Document {
    _id: Types.ObjectId;
    payment_date: Date;
    shop_no: string;
    tenant_name: string;
    rent_month: string;
    rent_year: number;
    monthly_rent: number;
    amount_paid: number;
    advance_deducted: number;
    old_shop_no: string;
    Comments: string | null;
    payment_status: 'Paid' | 'Due' | 'Partial';
    partially_paid: number;
}

const RentLedgerSchema = new Schema<IRentLedger>(
    {
        payment_date: { type: Date, required: true },
        shop_no: { type: String, required: true, trim: true },
        tenant_name: { type: String, required: true, trim: true },
        rent_month: { type: String, required: true, trim: true },
        rent_year: { type: Number, required: true },
        monthly_rent: { type: Number, required: true, min: 0 },
        amount_paid: { type: Number, default: 0, min: 0 },
        advance_deducted: { type: Number, default: 0, min: 0 },
        old_shop_no: { type: String, default: '', trim: true },
        Comments: { type: String, default: null },
        payment_status: {
            type: String,
            enum: ['Paid', 'Due', 'Partial'],
            default: 'Due',
        },
        partially_paid: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true, collection: 'rent_ledger' }
);

// Index for common queries
RentLedgerSchema.index({ shop_no: 1, rent_year: -1, rent_month: 1 });

export const RentLedger = model<IRentLedger>('RentLedger', RentLedgerSchema);
