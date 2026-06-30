import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import {
  authRouteLimiter,
  passwordResetRequestLimiter,
  passwordResetVerifyLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', authRouteLimiter, AuthController.login);
router.post('/register', authRouteLimiter, AuthController.register);

// NEW: token refresh + logout
router.post('/refresh', authRouteLimiter, AuthController.refresh);
router.post('/logout', authRouteLimiter, AuthController.logout);

router.post('/forgot-password', passwordResetRequestLimiter, AuthController.forgotPassword);
router.post('/verify-reset-otp', passwordResetVerifyLimiter, AuthController.verifyResetOtp);
router.post('/resend-reset-otp', passwordResetRequestLimiter, AuthController.resendResetOtp);
router.post('/reset-password', passwordResetVerifyLimiter, AuthController.resetPassword);

// Protected routes
router.get('/profile', protect as any, AuthController.getProfile as any);
router.put('/profile', protect as any, AuthController.updateProfile as any);
router.put('/change-password', protect as any, AuthController.changePassword as any);

export default router;
