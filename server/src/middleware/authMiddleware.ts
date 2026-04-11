import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'waterflow_dev_secret_2024';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; phoneNumber: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.waterflow_token;
  if (!token) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid session' });
  }
};

export const requireRole = (role: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== role) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  next();
};

export const JWT_SECRET_KEY = JWT_SECRET;
