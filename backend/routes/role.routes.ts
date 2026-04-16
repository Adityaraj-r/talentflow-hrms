import express from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';
import { adminMutationLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

router.get('/', protect, getRoles);
router.post('/', protect, adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.ROLES, 'write'), createRole);
router.put('/:id', protect, adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.ROLES, 'write'), updateRole);
router.delete('/:id', protect, adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.ROLES, 'delete'), deleteRole);

export default router;
