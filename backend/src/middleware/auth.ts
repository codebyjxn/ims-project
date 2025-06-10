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
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
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
    return res.status(403).json({ error: 'Access denied. Fans only.' });
  }
  next();
};

// Middleware to check if user is an organizer
export const isOrganizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'organizer') {
    return res.status(403).json({ error: 'Access denied. Organizers only.' });
  }
  next();
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
}; 