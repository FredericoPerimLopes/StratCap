import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Define an interface that extends the Express Request
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Simplified auth middleware for the credit facility routes
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // For now, create a mock user for testing
  // In production, this would verify the JWT token
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'fund_manager',
    isActive: true,
  } as User;
  
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    next();
  };
};