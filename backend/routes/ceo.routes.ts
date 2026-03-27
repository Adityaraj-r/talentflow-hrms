import express from 'express';
import { CeoController } from '../controllers/ceo.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);
router.use(authorize('CEO') as any);

router.get('/dashboard', CeoController.getDashboardMetrics);
router.get('/recruitment-overview', CeoController.getRecruitmentOverview);
router.get('/executive-approvals', CeoController.getExecutiveApprovals);

export default router;
