import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'explore_wallah_secret_jwt_key_2026';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      userId: (decoded as jwt.JwtPayload).userId,
      email: (decoded as jwt.JwtPayload).email,
      role: (decoded as jwt.JwtPayload).role,
    };
    next();
  });
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: Role ${req.user.role} not permitted` });
      return;
    }

    next();
  };
};
