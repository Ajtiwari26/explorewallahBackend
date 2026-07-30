import { Router } from 'express';

const router = Router();

router.get('/me', (req, res) => {
  res.json({ message: 'Auth service active' });
});

export default router;
