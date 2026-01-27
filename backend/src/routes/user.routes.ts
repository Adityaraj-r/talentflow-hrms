import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deactivateUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication and admin/HR role
router.use(authenticate);
router.use(authorize('CEO', 'COUNTRY_MANAGER', 'HR_MANAGER', 'HR_OFFICER', 'ADMIN'));

// User management routes
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/reset-password', resetUserPassword);
router.put('/:id/deactivate', deactivateUser);

export default router;
