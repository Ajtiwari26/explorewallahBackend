import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  packageTitle: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  pdfUrl?: string;
  dueDate: Date;
  createdAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    packageTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PAID', 'PENDING', 'CANCELLED'], default: 'PENDING' },
    pdfUrl: { type: String },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
