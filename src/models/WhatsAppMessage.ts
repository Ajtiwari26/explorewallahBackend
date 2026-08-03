import mongoose, { Schema, Document } from 'mongoose';

export type SenderType = 'CUSTOMER' | 'HUMAN_AGENT' | 'GEMINI_AI';

export interface IWhatsAppMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderType: SenderType;
  messageText: string;
  mediaUrl?: string;
  messageStatus: 'SENT' | 'DELIVERED' | 'READ';
  metaMessageId?: string;
  createdAt: Date;
}

const WhatsAppMessageSchema: Schema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'WhatsAppChat', required: true },
    senderType: { type: String, enum: ['CUSTOMER', 'HUMAN_AGENT', 'GEMINI_AI'], required: true },
    messageText: { type: String, required: true },
    mediaUrl: { type: String },
    messageStatus: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' },
    metaMessageId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
