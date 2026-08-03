import { Router } from 'express';
import {
  getChats,
  getChatMessages,
  sendMessageFromAdmin,
  toggleGlobalWhatsAppMode,
  toggleChatWhatsAppMode,
} from '../controllers/whatsappController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/chats', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin']), getChats);
router.get('/chats/:chatId/messages', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin']), getChatMessages);
router.post('/chats/:chatId/send', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin']), sendMessageFromAdmin);

router.patch('/mode', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), toggleGlobalWhatsAppMode);
router.patch('/chats/:chatId/mode', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin']), toggleChatWhatsAppMode);

export default router;
