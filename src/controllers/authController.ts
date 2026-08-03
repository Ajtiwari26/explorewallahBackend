import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AdminSession from '../models/AdminSession';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!['SUPER_ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'admin'].includes(user.role)) {
      res.status(403).json({ error: 'Access denied: Only Admin staff can log in' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'explore_wallah_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await AdminSession.create({
      userId: user._id,
      sessionToken,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
      expiresAt,
    });

    res.json({
      message: 'Login successful',
      token,
      sessionToken: session.sessionToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await AdminSession.find({ expiresAt: { $gt: new Date() } })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await AdminSession.findByIdAndDelete(id);
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await User.findById(req.user.userId).select('-passwordHash');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
