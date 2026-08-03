import { Router } from 'express';
import { getRealtimeTraffic, getAnalyticsOverview } from '../controllers/analyticsController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/realtime', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin']), getRealtimeTraffic);
router.get('/overview', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getAnalyticsOverview);

export default router;
