import express, { Router } from 'express';
import multer from 'multer';
import {
  getAdminMetrics, getRecentActivities, getUserDistribution,
  getDepartmentStats, bulkUploadUsers, getAllUsers,
  toggleUserStatus, getDashboardStats, deleteUser,
} from '../controllers/adminController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, authorizeByMatrixAny, MODULE_KEYS } from '../middleware/role.middleware';
import { adminMutationLimiter } from '../middleware/rateLimit.middleware';
import { createUser } from '../controllers/user.controller';

const router: Router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.get('/metrics',           authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getAdminMetrics);
router.get('/dashboard-stats',   authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getDashboardStats);
router.get('/activities',        authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getRecentActivities);
router.get('/user-distribution', authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getUserDistribution);
router.get('/department-stats',  authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getDepartmentStats);

router.get(
  '/users',
  authorizeByMatrixAny([
    { module: MODULE_KEYS.SETTINGS, action: 'read' },
    { module: MODULE_KEYS.EMPLOYEES, action: 'read' },
    { module: MODULE_KEYS.PAYROLL, action: 'read' },
  ]),
  getAllUsers
);
router.post('/enroll-user', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), createUser);
router.patch('/users/:id/toggle-status', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), toggleUserStatus);
router.post('/bulk-upload', adminMutationLimiter, upload.single('file'), authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), bulkUploadUsers);
router.delete('/users/:id', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'delete'), deleteUser);

router.get('/settings',  authorizeByMatrix(MODULE_KEYS.SETTINGS, 'read'),  getSettings);
router.put('/settings', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), updateSettings);

export default router;
