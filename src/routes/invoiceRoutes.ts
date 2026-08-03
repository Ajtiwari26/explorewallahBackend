import { Router } from 'express';
import { getInvoices, downloadInvoicePdf } from '../controllers/invoiceController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getInvoices);
router.get('/:id/download', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), downloadInvoicePdf);

export default router;
