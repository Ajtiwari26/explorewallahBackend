import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceStatus = 'DRAFT' | 'GENERATED' | 'SENT' | 'CANCELLED' | 'PAID';

export interface IInvoice extends Document {
  invoiceNumber: string; // e.g. EW-2026-0001
  paymentId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageTitle?: string;
  amount?: number;
  gstin?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  pdfUrl?: string;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    packageTitle: { type: String },
    amount: { type: Number },
    gstin: { type: String, default: 'Unregistered' },
    subtotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    pdfUrl: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'SENT', 'CANCELLED', 'PAID'],
      default: 'GENERATED',
    },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
