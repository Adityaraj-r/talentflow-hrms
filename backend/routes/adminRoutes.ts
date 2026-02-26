import express, { Router } from 'express';
import multer from 'multer';
import {
  getAdminMetrics,
  getRecentActivities,
  getUserDistribution,
  getDepartmentStats,
  bulkUploadUsers,
  getAllUsers,
  toggleUserStatus,
  getDashboardStats,
} from '../controllers/adminController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/auth.middleware';
import { createUser } from '../controllers/user.controller';
const router: Router = express.Router()
const upload = multer({ dest: 'uploads/' }); // Temporary storage folder

/**
 * @description All routes below require a valid token and Admin privileges
 * Access Control: ADMIN, Admin, or Super Admin roles only.
 */
router.use(protect);
router.use(authorize('ADMIN', 'Admin', 'Super Admin'));

// Update your route list
router.post('/bulk-upload', upload.single('file'), bulkUploadUsers);

/**
 * @route   GET /api/admin/metrics
 * @desc    Fetch dashboard statistics (Total users, active users, growth trends)
 */
router.get('/metrics', getAdminMetrics);

/**
 * @route   GET /api/admin/activities
 * @desc    Retrieve system-wide audit logs and recent user actions
 */
router.get('/activities', getRecentActivities);

/**
 * @route   GET /api/admin/user-distribution
 * @desc    Get headcount categorized by roles for chart visualizations
 */
router.get('/user-distribution', getUserDistribution);

/**
 * @route   GET /api/admin/department-stats
 * @desc    Get employee counts and activity percentages per department
 */
router.get('/department-stats', getDepartmentStats);

/**
 * @route   POST /api/admin/create-user
 * @desc    Create a new user account with hashed credentials
 * @body    { firstName, lastName, email, password, role, department, phoneNumber }
 */
router.post('/enroll-user', createUser);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and search
 */
router.get('/users', getAllUsers);

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    deactivate or reactivate a user account
 */
router.patch('/users/:id/toggle-status', toggleUserStatus);

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update system settings
 */
router.put('/settings', updateSettings);

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Fetch dynamic user counts (Total, Active, Inactive)
 */
router.get('/dashboard-stats', getDashboardStats);

export default router;
