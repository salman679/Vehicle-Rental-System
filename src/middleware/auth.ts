import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized', errors: 'Missing or invalid token' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized', errors: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized', errors: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden', errors: 'Admin access required' });
    return;
  }
  next();
}

export function requireCustomerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized', errors: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin' && req.user.role !== 'customer') {
    res.status(403).json({ success: false, message: 'Forbidden', errors: 'Insufficient permissions' });
    return;
  }
  next();
}

export function requireAdminOrOwn(userIdParam: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized', errors: 'Authentication required' });
      return;
    }
    const targetUserId = parseInt(req.params[userIdParam], 10);
    if (req.user.role === 'admin' || req.user.userId === targetUserId) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: 'Forbidden', errors: 'You can only update your own profile' });
  };
}
