import { Response } from 'express';
import { googleAnalyticsService } from '../services/googleAnalyticsService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getRealtimeTraffic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await googleAnalyticsService.getAnalyticsSummary();
    res.json({ realtimeActiveUsers: data.realtimeActiveUsers });
  } catch (error) {
    console.error('Error fetching realtime analytics:', error);
    res.status(500).json({ error: 'Failed to fetch realtime analytics' });
  }
};

export const getAnalyticsOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await googleAnalyticsService.getAnalyticsSummary();
    res.json({ analytics: data });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
};
