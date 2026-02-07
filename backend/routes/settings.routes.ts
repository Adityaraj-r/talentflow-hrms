import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController'; // ✅ No .ts extension
import { authenticate } from '../middleware/auth.middleware'; // ✅ Changed from authenticateToken

const router = express.Router();

router.use(authenticate);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
