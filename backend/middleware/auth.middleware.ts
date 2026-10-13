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
    department?: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Accept either a Bearer header (legacy / non-browser clients) or the
  // httpOnly `accessToken` cookie set by login/refresh (browser clients).
  // Header is checked first so any non-browser consumer that still sends
  // Authorization: Bearer keeps working unchanged.
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }

  try {
    // Must match the exact same secret resolution order used to SIGN the
    // token in generateAccessToken (token.utils.ts) — ACCESS_TOKEN_SECRET
    // first, then JWT_SECRET. A mismatch here rejects every access token,
    // including ones issued seconds ago, since it's a wrong-secret failure
    // not an expiry/staleness one.
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'secret';
    const decoded: any = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('firstName lastName email role isActive department');

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
      role: user.role,
      department: user.department
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ success: false, error: 'Not authorized, token failed' });
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