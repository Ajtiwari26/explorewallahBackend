import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface IPayment extends Document {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  userId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  batchId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  errorCode?: string;
  errorDescription?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package' },
    batchId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
    },
    paymentMethod: { type: String, default: 'UPI' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    errorCode: { type: String },
    errorDescription: { type: String },
    rawPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
