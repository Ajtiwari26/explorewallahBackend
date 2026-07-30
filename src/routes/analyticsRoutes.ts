import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Analytics service active' });
});

export default router;
