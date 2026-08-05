import { Request, Response } from 'express';
import WhatsAppChat from '../models/WhatsAppChat';
import WhatsAppMessage from '../models/WhatsAppMessage';
import { whatsappService } from '../services/whatsappService';

/**
 * Get all active WhatsApp chats for Admin Live Desk
 */
export const getWhatsAppChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const chats = await WhatsAppChat.find().sort({ lastMessageAt: -1 });
    res.json({ chats });
  } catch (error) {
    console.error('Error fetching WhatsApp chats:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp chats' });
  }
};

/**
 * Get message thread for a specific WhatsApp chat
 */
export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const messages = await WhatsAppMessage.find({ chatId }).sort({ createdAt: 1 });

    // Mark chat unread count as 0
    await WhatsAppChat.findByIdAndUpdate(chatId, { unreadCount: 0 });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
};

/**
 * Send Outbound WhatsApp Message from Admin Portal
 */
export const sendWhatsAppMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId, customerPhone, messageText } = req.body;

    if (!messageText || (!chatId && !customerPhone)) {
      res.status(400).json({ error: 'chatId or customerPhone, and messageText are required' });
      return;
    }

    let chat;
    if (chatId) {
      chat = await WhatsAppChat.findById(chatId);
    } else {
      chat = await WhatsAppChat.findOne({ customerPhone });
    }

    if (!chat) {
      chat = await WhatsAppChat.create({
        customerPhone,
        currentMode: 'HUMAN',
        lastMessage: messageText,
        lastMessageAt: new Date(),
        unreadCount: 0,
      });
    }

    // Call Meta WhatsApp Cloud API Service
    const sendResult = await whatsappService.sendTextMessage(chat.customerPhone, messageText);

    // Save message record
    const message = await WhatsAppMessage.create({
      chatId: chat._id,
      senderType: 'HUMAN_AGENT',
      messageText,
      messageStatus: sendResult.success ? 'SENT' : 'SENT',
      metaMessageId: (sendResult.data as any)?.messages?.[0]?.id,
    });

    // Update chat last message
    chat.lastMessage = `[Human Agent]: ${messageText}`;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.json({ success: true, message, sendResult });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
};

/**
 * Toggle Chat AI vs Human Mode
 */
export const toggleChatMode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { mode } = req.body; // 'HUMAN' | 'AI'

    if (!['HUMAN', 'AI'].includes(mode)) {
      res.status(400).json({ error: 'Invalid mode. Must be HUMAN or AI' });
      return;
    }

    const chat = await WhatsAppChat.findByIdAndUpdate(
      chatId,
      { currentMode: mode },
      { new: true }
    );

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error toggling chat mode:', error);
    res.status(500).json({ error: 'Failed to toggle chat mode' });
  }
};
