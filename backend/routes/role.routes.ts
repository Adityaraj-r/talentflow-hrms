import express from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

const roleMatrixAdmin = authorize('ADMIN', 'SUPER ADMIN', 'SUPER_ADMIN');

router.get('/', protect, getRoles);
router.post('/', protect, roleMatrixAdmin, createRole);
router.put('/:id', protect, roleMatrixAdmin, updateRole);
router.delete('/:id', protect, roleMatrixAdmin, deleteRole);

export default router;