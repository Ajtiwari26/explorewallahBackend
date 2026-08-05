import { Router } from 'express';
import {
  loginAdmin,
  getActiveSessions,
  revokeSession,
  getMe,
  verifyCustomerPhoneAuth,
  verifyCustomerGoogleAuth,
  refreshCustomerToken,
  updateCustomerProfile,
  logoutCustomer,
} from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Admin Auth Routes
router.post('/login', loginAdmin);
router.get('/me', authenticateToken, getMe);
router.get('/sessions', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), getActiveSessions);
router.delete('/sessions/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'admin']), revokeSession);

// Customer Auth Routes
router.post('/customer/phone', verifyCustomerPhoneAuth);
router.post('/customer/google', verifyCustomerGoogleAuth);
router.post('/refresh', refreshCustomerToken);
router.post('/customer/logout', logoutCustomer);
router.put('/customer/profile', authenticateToken, updateCustomerProfile);

export default router;
