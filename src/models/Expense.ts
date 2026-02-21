import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
    _id: Types.ObjectId;
    txn_date: Date;
    amount: number;
    description: string;
    category: string;
    sub_category: string;
    payment_method: string;
}

const ExpenseSchema = new Schema<IExpense>(
    {
        txn_date: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        description: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        sub_category: { type: String, default: '', trim: true },
        payment_method: {
            type: String,
            required: true,
            enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
            default: 'Cash',
        },
    },
    { timestamps: true, collection: 'expenses' }
);

export const Expense = model<IExpense>('Expense', ExpenseSchema);
