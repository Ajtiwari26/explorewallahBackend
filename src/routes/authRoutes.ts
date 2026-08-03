import { Router } from 'express';
import { loginAdmin, getActiveSessions, revokeSession, getMe } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', loginAdmin);
router.get('/me', authenticateToken, getMe);
router.get('/sessions', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getActiveSessions);
router.delete('/sessions/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'admin']), revokeSession);

export default router;
