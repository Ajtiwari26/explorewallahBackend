import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
}

const AdminSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionToken: { type: String, required: true, unique: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminSession>('AdminSession', AdminSessionSchema);
