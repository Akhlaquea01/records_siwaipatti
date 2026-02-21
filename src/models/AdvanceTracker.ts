import { Schema, model, Document, Types } from 'mongoose';

export interface IAdvanceTracker extends Document {
    _id: Types.ObjectId;
    shop_no: string;
    tenant_name: string;
    advance_amount: number;
    advance_deducted: number | null;
    advance_remaining: number | null;
    status: 'Active' | 'Inactive';
    comment: string;
}

const AdvanceTrackerSchema = new Schema<IAdvanceTracker>(
    {
        shop_no: { type: String, default: '' },
        tenant_name: { type: String, required: true, trim: true },
        advance_amount: { type: Number, required: true, min: 0 },
        advance_deducted: { type: Number, default: null },
        advance_remaining: { type: Number, default: null },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        comment: { type: String, default: '' },
    },
    { timestamps: true, collection: 'advance_tracker' }
);

export const AdvanceTracker = model<IAdvanceTracker>('AdvanceTracker', AdvanceTrackerSchema);
