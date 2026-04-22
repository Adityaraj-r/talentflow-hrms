import express from 'express';
import { getSettings, updateSettings, getCompanyInfo } from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';
import { adminMutationLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

router.get('/company-info', getCompanyInfo);

router.use(protect as any);

router.get('/settings', authorizeByMatrix(MODULE_KEYS.SETTINGS, 'read'), getSettings);
router.put('/settings', adminMutationLimiter, authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write'), updateSettings);

export default router;
