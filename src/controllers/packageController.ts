import { Request, Response } from 'express';
import Package from '../models/Package';
import { redis } from '../config/redis';

export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'packages:all';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      res.status(200).json(data);
      return;
    }
  } catch (err) {
    console.warn('[Redis Cache] Failed to fetch packages from cache, falling back to DB:', err);
  }

  try {
    const packages = await Package.find().lean();
    res.status(200).json(packages);

    // Cache in Redis in background (1 hour expiry)
    redis.set(cacheKey, JSON.stringify(packages), { ex: 3600 }).catch(() => {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

export const getPackageBySlug = async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  const cacheKey = `packages:slug:${slug}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      res.status(200).json(data);
      return;
    }
  } catch (err) {
    console.warn(`[Redis Cache] Failed to fetch package ${slug} from cache:`, err);
  }

  try {
    const pkg = await Package.findOne({ slug }).lean();
    if (!pkg) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    res.status(200).json(pkg);

    // Cache in Redis in background (1 hour expiry)
    redis.set(cacheKey, JSON.stringify(pkg), { ex: 3600 }).catch(() => {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package details' });
  }
};
