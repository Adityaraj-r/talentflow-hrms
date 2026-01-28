// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firebaseUid?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 Auth middleware called');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.log('❌ Token is missing');
      return res.status(401).json({
        success: false,
        error: 'Token is missing'
      });
    }

    console.log('🔍 Verifying Firebase token...');

    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log('✅ Firebase token verified for UID:', decodedToken.uid);
      console.log('📧 Email from token:', decodedToken.email);
      
      console.log('🔍 Looking up user in MongoDB...');
      const user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        console.error('❌ User not found with Firebase UID:', decodedToken.uid);
        return res.status(404).json({
          success: false,
          error: 'User not found in database',
          firebaseUid: decodedToken.uid
        });
      }

      console.log('✅ User found:', user.email, '| Role:', user.role);

      if (!user.isActive) {
        console.log('❌ User account is deactivated');
        return res.status(403).json({
          success: false,
          error: 'Account deactivated'
        });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firebaseUid: decodedToken.uid
      };

      console.log('✅ Authentication successful, proceeding to next middleware');
      next();

    } catch (firebaseError: any) {
      console.error('❌ Firebase verification error:', firebaseError.message);
      
      if (firebaseError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please login again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const authMiddleware = authenticate;
export const protect = authenticate;
