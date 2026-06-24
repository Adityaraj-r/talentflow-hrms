import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authRouteLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', authRouteLimiter, AuthController.login);
router.post('/register', authRouteLimiter, AuthController.register);

// NEW: token refresh + logout
router.post('/refresh', authRouteLimiter, AuthController.refresh);
router.post('/logout', authRouteLimiter, AuthController.logout);

// Protected routes
router.get('/profile', protect as any, AuthController.getProfile as any);
router.put('/profile', protect as any, AuthController.updateProfile as any);
router.put('/change-password', protect as any, AuthController.changePassword as any);

export default router;