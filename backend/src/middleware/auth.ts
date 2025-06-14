import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        userType: 'fan' | 'organizer' | 'admin';
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType
      };

      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user is a fan
export const isFan = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'fan') {
    res.status(403).json({ error: 'Access denied. Fans only.' });
    return;
  }
  next();
};

// Middleware to check if user is an organizer
export const isOrganizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'organizer') {
    res.status(403).json({ error: 'Access denied. Organizers only.' });
    return;
  }
  next();
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'admin') {
    res.status(403).json({ error: 'Access denied. Admins only.' });
    return;
  }
  next();
}; 