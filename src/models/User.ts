import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT_AGENT' | 'CUSTOMER';

export interface IUser extends Document {
  name: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  firebaseUid?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, sparse: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'CUSTOMER'],
      default: 'CUSTOMER',
    },
    phone: { type: String, trim: true, index: true },
    firebaseUid: { type: String, sparse: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
