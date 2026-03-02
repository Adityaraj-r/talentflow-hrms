import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deactivateUser,
} from '../controllers/user.controller';

import { protect, authorize } from '../middleware/auth.middleware';
// import { syncUsersToEmployees } from "../controllers/user.controller";

const router = express.Router();

// router.get("/sync-users", syncUsersToEmployees);
router.use(protect as any);
router.use(authorize('CEO', 'COUNTRY_MANAGER', 'HR_MANAGER', 'HR_OFFICER', 'ADMIN') as any);

// User management routes
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/reset-password', resetUserPassword);
router.put('/:id/deactivate', deactivateUser);
router.put('/:id', updateUser);

export default router;