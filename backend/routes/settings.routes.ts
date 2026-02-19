import express from 'express';
import { getSettings, updateSettings, getCompanyInfo } from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/company-info', getCompanyInfo);


router.use(protect as any);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;