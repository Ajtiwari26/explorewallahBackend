import { Request, Response } from 'express';
import Package from '../models/Package';
import { redis } from '../config/redis';

export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'packages:all';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      res.status(200).json({ packages: Array.isArray(data) ? data : data.packages || [] });
      return;
    }
  } catch (err) {
    console.warn('[Redis Cache] Failed to fetch packages from cache, falling back to DB:', err);
  }

  try {
    const packages = await Package.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ packages });

    // Cache in Redis in background (1 hour expiry)
    redis.set(cacheKey, JSON.stringify(packages), { ex: 3600 }).catch(() => {});
  } catch (error) {
    console.error('Error fetching packages:', error);
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
      res.status(200).json({ package: data });
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
    res.status(200).json({ package: pkg });

    // Cache in Redis in background (1 hour expiry)
    redis.set(cacheKey, JSON.stringify(pkg), { ex: 3600 }).catch(() => {});
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package details' });
  }
};

export const createPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    try { await redis.del('packages:all'); } catch {}
    res.status(201).json({ message: 'Package created successfully', package: newPackage });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(400).json({ error: 'Failed to create package', details: error });
  }
};

export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedPackage = await Package.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPackage) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    try {
      await redis.del('packages:all');
      await redis.del(`packages:slug:${updatedPackage.slug}`);
    } catch {}
    res.json({ message: 'Package updated successfully', package: updatedPackage });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(400).json({ error: 'Failed to update package' });
  }
};

export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pkg = await Package.findByIdAndDelete(id);
    if (pkg) {
      try {
        await redis.del('packages:all');
        await redis.del(`packages:slug:${pkg.slug}`);
      } catch {}
    }
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

export const generateImageUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName } = req.body;
    const uploadUrl = `https://storage.explorewallah.com/upload/${Date.now()}_${fileName || 'media.jpg'}`;
    const publicUrl = `https://cdn.explorewallah.com/images/${Date.now()}_${fileName || 'media.jpg'}`;

    res.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error('Error generating image upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
