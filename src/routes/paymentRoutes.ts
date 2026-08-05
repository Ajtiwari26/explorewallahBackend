import { Router } from 'express';
import {
  getPayments,
  initiateRefund,
  createRazorpayOrder,
  verifyPayment,
  getPaymentConfig,
} from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public Checkout Routes
router.get('/config', getPaymentConfig);
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

// Admin Only Routes
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getPayments);
router.post('/:id/refund', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), initiateRefund);

export default router;
