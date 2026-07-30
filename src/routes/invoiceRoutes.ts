import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Invoice service active' });
});

export default router;
