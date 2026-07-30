import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'WhatsApp service active' });
});

export default router;
