import express from 'express';
import { getWorkforceAnalytics } from '../controllers/executive.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.get('/analytics/workforce', authorize('CEO', 'COUNTRY_MANAGER'), getWorkforceAnalytics);

export default router;