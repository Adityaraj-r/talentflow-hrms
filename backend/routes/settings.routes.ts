import express from 'express';
import { getSettings, updateSettings, getCompanyInfo } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/company-info', getCompanyInfo);

router.use(authenticate);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;