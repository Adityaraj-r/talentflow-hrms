import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/profile', protect as any, AuthController.getProfile as any);
router.put('/profile', protect as any, AuthController.updateProfile as any);
router.put('/change-password', protect as any, AuthController.changePassword as any);

export default router;