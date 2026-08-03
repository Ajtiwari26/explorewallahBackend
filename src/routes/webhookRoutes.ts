import { Router } from 'express';
import {
  handleRazorpayWebhook,
  handleWhatsAppWebhook,
  verifyWhatsAppWebhook,
} from '../controllers/webhookController';

const router = Router();

router.post('/razorpay', handleRazorpayWebhook);
router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;
