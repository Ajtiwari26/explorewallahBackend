import { Router } from 'express';
import { getPayments, initiateRefund } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getPayments);
router.post('/:id/refund', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), initiateRefund);

export default router;
