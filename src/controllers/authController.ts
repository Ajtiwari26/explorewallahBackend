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

/**
 * 📱 Customer Phone OTP Verification Endpoint
 * Finds or creates Customer record in MongoDB, generates JWT Access Token (15m) + HttpOnly Refresh Cookie (7d)
 */
export const verifyCustomerPhoneAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, firebaseUid, name } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const cleanPhone = phone.trim();
    let user = await User.findOne({ $or: [{ phone: cleanPhone }, { firebaseUid }] });

    if (!user) {
      user = await User.create({
        name: name || '',
        phone: cleanPhone,
        firebaseUid: firebaseUid || `uid_${Date.now()}`,
        role: 'CUSTOMER',
        isActive: true,
      });
    } else if (name && (!user.name || user.name.trim() === '')) {
      user.name = name;
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET || 'explore_wallah_secret_jwt_key_2026';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'explore_wallah_refresh_secret_key_2026';

    const accessToken = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Set HttpOnly, Secure, SameSite cookie for Refresh Token
    res.cookie('ew_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Customer phone authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error verifying customer phone auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 🌐 Customer Google OAuth Verification Endpoint
 */
export const verifyCustomerGoogleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, phone, firebaseUid } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required for Google Sign-In' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ $or: [{ email: cleanEmail }, { firebaseUid }] });

    if (!user) {
      user = await User.create({
        name: name || 'Himalayan Adventurer',
        email: cleanEmail,
        phone: phone || '',
        firebaseUid: firebaseUid || `g_uid_${Date.now()}`,
        role: 'CUSTOMER',
        isActive: true,
      });
    } else if (name && (!user.name || user.name.trim() === '')) {
      user.name = name;
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET || 'explore_wallah_secret_jwt_key_2026';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'explore_wallah_refresh_secret_key_2026';

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    res.cookie('ew_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Customer Google authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error verifying customer Google auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 🔄 Silent Token Refresh Endpoint (verifies Refresh Cookie & issues new Access Token)
 */
export const refreshCustomerToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.ew_refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'explore_wallah_secret_jwt_key_2026';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'explore_wallah_refresh_secret_key_2026';

    jwt.verify(refreshToken, jwtRefreshSecret, async (err: any, decoded: any) => {
      if (err || !decoded) {
        res.status(403).json({ error: 'Invalid or expired refresh token' });
        return;
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(403).json({ error: 'User account inactive or deleted' });
        return;
      }

      const newAccessToken = jwt.sign(
        { userId: user._id, email: user.email, phone: user.phone, role: user.role },
        jwtSecret,
        { expiresIn: '15m' }
      );

      res.json({
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * ✏️ Update Customer Profile Name / Details
 */
export const updateCustomerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, phone, email } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(444).json({ error: 'User not found' });
      return;
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
