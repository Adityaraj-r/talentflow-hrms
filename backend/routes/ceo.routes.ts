import express from 'express';
import { CeoController } from '../controllers/ceo.controller';
import { getEmployerBrand, putEmployerBrand } from '../controllers/employerBrand.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);
router.use(authorize('CEO') as any);

router.get('/dashboard', CeoController.getDashboardMetrics);
router.get('/recruitment-overview', CeoController.getRecruitmentOverview);
router.get('/executive-approvals', CeoController.getExecutiveApprovals);
router.get('/employer-brand', getEmployerBrand);
router.put('/employer-brand', putEmployerBrand);

export default router;
