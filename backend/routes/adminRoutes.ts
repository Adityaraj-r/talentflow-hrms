import express, { Router } from 'express';
import multer from 'multer';
import {
  getAdminMetrics, getRecentActivities, getUserDistribution,
  getDepartmentStats, bulkUploadUsers, getAllUsers,
  toggleUserStatus, getDashboardStats,
} from '../controllers/adminController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';
import { createUser } from '../controllers/user.controller';

const router: Router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(protect);

// Dashboard
router.get('/metrics',           authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getAdminMetrics);
router.get('/dashboard-stats',   authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getDashboardStats);
router.get('/activities',        authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getRecentActivities);
router.get('/user-distribution', authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getUserDistribution);
router.get('/department-stats',  authorizeByMatrix(MODULE_KEYS.DASHBOARD, 'read'),   getDepartmentStats);

router.get('/users',                              authorizeByMatrix(MODULE_KEYS.EMPLOYEES, 'read'),   getAllUsers);
router.post('/enroll-user',                       authorizeByMatrix(MODULE_KEYS.EMPLOYEES, 'write'),  createUser);
router.patch('/users/:id/toggle-status',          authorizeByMatrix(MODULE_KEYS.EMPLOYEES, 'write'),  toggleUserStatus);
router.post('/bulk-upload', upload.single('file'), authorizeByMatrix(MODULE_KEYS.EMPLOYEES, 'write'), bulkUploadUsers);

// System Settings
router.get('/settings',  authorizeByMatrix(MODULE_KEYS.SETTINGS, 'read'),  getSettings);
router.put('/settings',  authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), updateSettings);

export default router;
