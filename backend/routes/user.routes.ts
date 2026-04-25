import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deactivateUser,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, authorizeByMatrixAny, MODULE_KEYS } from '../middleware/role.middleware';
import { adminMutationLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

router.use(protect as any);

router.get(
  '/',
  authorizeByMatrixAny([
    { module: MODULE_KEYS.SETTINGS, action: 'read' },
    { module: MODULE_KEYS.EMPLOYEES, action: 'read' },
  ]),
  getAllUsers
);
router.get(
  '/:id',
  authorizeByMatrixAny([
    { module: MODULE_KEYS.SETTINGS, action: 'read' },
    { module: MODULE_KEYS.EMPLOYEES, action: 'read' },
  ]),
  getUserById
);

router.post('/', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), createUser);
router.put('/:id/reset-password', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), resetUserPassword);
router.put('/:id/deactivate', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), deactivateUser);
router.put('/:id', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), updateUser);

export default router;
