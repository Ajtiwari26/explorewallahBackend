import { Response } from 'express';
import WhatsAppChat, { WhatsAppMode } from '../models/WhatsAppChat';
import WhatsAppMessage from '../models/WhatsAppMessage';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../middleware/authMiddleware';

export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chats = await WhatsAppChat.find().sort({ lastMessageAt: -1 });
    const globalSetting = await SystemSetting.findOne({ key: 'whatsapp_global_mode' });
    const globalMode = globalSetting ? globalSetting.value.mode : 'AI';

    res.json({ chats, globalMode });
  } catch (error) {
    console.error('Error fetching WhatsApp chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const messages = await WhatsAppMessage.find({ chatId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessageFromAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { messageText } = req.body;

    const chat = await WhatsAppChat.findById(chatId);
    if (!chat) {
      res.status(404).json({ error: 'Chat thread not found' });
      return;
    }

    const newMessage = await WhatsAppMessage.create({
      chatId: chat._id,
      senderType: 'HUMAN_AGENT',
      messageText,
      messageStatus: 'SENT',
    });

    chat.lastMessage = messageText;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const toggleGlobalWhatsAppMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode }: { mode: WhatsAppMode } = req.body;

    if (!['HUMAN', 'AI'].includes(mode)) {
      res.status(400).json({ error: 'Mode must be either HUMAN or AI' });
      return;
    }

    await SystemSetting.findOneAndUpdate(
      { key: 'whatsapp_global_mode' },
      { value: { mode }, updatedBy: req.user?.userId },
      { upsert: true, new: true }
    );

    await WhatsAppChat.updateMany({}, { currentMode: mode });

    res.json({ message: `Global WhatsApp mode switched to ${mode}`, globalMode: mode });
  } catch (error) {
    console.error('Error toggling global WhatsApp mode:', error);
    res.status(500).json({ error: 'Failed to toggle mode' });
  }
};

export const toggleChatWhatsAppMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { mode }: { mode: WhatsAppMode } = req.body;

    const chat = await WhatsAppChat.findByIdAndUpdate(chatId, { currentMode: mode }, { new: true });
    if (!chat) {
      res.status(404).json({ error: 'Chat thread not found' });
      return;
    }

    res.json({ message: `Chat mode for ${chat.customerPhone} updated to ${mode}`, chat });
  } catch (error) {
    console.error('Error toggling chat mode:', error);
    res.status(500).json({ error: 'Failed to toggle chat mode' });
  }
};
