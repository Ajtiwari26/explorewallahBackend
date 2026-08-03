import { Router } from 'express';
import {
  getAllPackages,
  getPackageBySlug,
  createPackage,
  updatePackage,
  deletePackage,
  generateImageUploadUrl,
} from '../controllers/packageController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAllPackages);
router.post('/upload-image-url', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), generateImageUploadUrl);
router.get('/:slug', getPackageBySlug);
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), createPackage);
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'admin']), updatePackage);
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'admin']), deletePackage);

export default router;
