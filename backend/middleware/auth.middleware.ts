import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const user = await User.findById(decoded.id).select('firstName lastName email role isActive');

      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Account deactivated' });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Auth Error:', error);
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userRole = req.user.role.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Role ${userRole} is not authorized to access this route`
      });
    }
    next();
  };
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role.toUpperCase() === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Admin access required' });
  }
};
