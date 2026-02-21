import { Schema, model, Document, Types } from 'mongoose';

export interface ITenantDetails extends Document {
    _id: Types.ObjectId;
    shop_no: string;
    tenant_name: string;
    fathers_name: string;
    id_number: string;
    mobile_number: string;
    email: string;
    address: string;
    monthly_rent: number;
    advance_paid: number | null;
    agreement_status: 'Yes' | 'No';
    status: 'Active' | 'Inactive';
    comment: string | null;
    advance_remaining: number | null;
    total_due: number;
    due_months: string;
    tenant_name_hindi: string;
}

const TenantDetailsSchema = new Schema<ITenantDetails>(
    {
        shop_no: { type: String, required: true, trim: true, unique: true },
        tenant_name: { type: String, required: true, trim: true },
        fathers_name: { type: String, default: '', trim: true },
        id_number: { type: String, default: '', trim: true },
        mobile_number: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true, lowercase: true },
        address: { type: String, default: '', trim: true },
        monthly_rent: { type: Number, required: true, min: 0 },
        advance_paid: { type: Number, default: null },
        agreement_status: { type: String, enum: ['Yes', 'No'], default: 'No' },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        comment: { type: String, default: null },
        advance_remaining: { type: Number, default: null },
        total_due: { type: Number, default: 0 },
        due_months: { type: String, default: '' },
        tenant_name_hindi: { type: String, default: '', trim: true },
    },
    { timestamps: true, collection: 'tenant_details' }
);

export const TenantDetails = model<ITenantDetails>('TenantDetails', TenantDetailsSchema);
