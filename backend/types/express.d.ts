import { AuthRequest } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
      };
    }
  }
}
