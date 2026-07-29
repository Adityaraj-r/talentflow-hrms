import express from 'express';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOfferStatus,
  ceoApproveOffer,
  getOfferDashboard,
  getOfferAnalytics,
  getOfferApprovals,
  approveOffer,
  rejectOffer,
  negotiateOffer,
  sendOffer,
  getOfferPdf,
} from '../controllers/offer.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';
import {
  requireRecruitmentApprover,
  requireRecruitmentOperator,
  requireRecruitmentReadRole,
} from '../middleware/recruitmentRbac.middleware';

const router = express.Router();

router.use(protect as any);

router.get('/dashboard', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOfferDashboard);
router.get('/analytics', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOfferAnalytics);
router.get('/approvals', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOfferApprovals);
router.get('/', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOffers);
router.get('/:id/pdf', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOfferPdf);
router.get('/:id', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getOfferById);
router.post(
  '/',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentOperator,
  createOffer
);
router.patch(
  '/:id/status',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentOperator,
  updateOfferStatus
);
router.patch(
  '/:id/approve',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentApprover,
  approveOffer
);
router.patch(
  '/:id/reject',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentApprover,
  rejectOffer
);
router.patch(
  '/:id/negotiate',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentApprover,
  negotiateOffer
);
router.patch(
  '/:id/send',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentOperator,
  sendOffer
);
router.put(
  '/:id/ceo-approve',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  requireRecruitmentApprover,
  ceoApproveOffer
);

export default router;
