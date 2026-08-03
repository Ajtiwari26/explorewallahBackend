import mongoose, { Schema, Document } from 'mongoose';

export type WhatsAppMode = 'HUMAN' | 'AI';

export interface IWhatsAppChat extends Document {
  customerPhone: string;
  customerName?: string;
  currentMode: WhatsAppMode;
  assignedAgentId?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppChatSchema: Schema = new Schema(
  {
    customerPhone: { type: String, required: true, unique: true, trim: true },
    customerName: { type: String, default: 'Explorer Guest' },
    currentMode: { type: String, enum: ['HUMAN', 'AI'], default: 'AI' },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IWhatsAppChat>('WhatsAppChat', WhatsAppChatSchema);
