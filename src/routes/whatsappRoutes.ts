import { Router } from 'express';
import {
  getWhatsAppChats,
  getChatMessages,
  sendWhatsAppMessage,
  toggleChatMode,
} from '../controllers/whatsappController';

const router = Router();

router.get('/chats', getWhatsAppChats);
router.get('/chats/:chatId/messages', getChatMessages);
router.post('/send', sendWhatsAppMessage);
router.put('/chats/:chatId/mode', toggleChatMode);

export default router;
