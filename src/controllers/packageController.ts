import { Request, Response } from 'express';
import Package from '../models/Package';

export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packages = await Package.find().lean();
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

export const getPackageBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const pkg = await Package.findOne({ slug: req.params.slug }).lean();
    if (!pkg) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package details' });
  }
};
