import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  res.json({ status: 'OK', received: true });
});

export default router;
