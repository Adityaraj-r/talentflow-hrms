import express from 'express';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOfferStatus,
  ceoApproveOffer,
} from '../controllers/offer.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';

const router = express.Router();

router.use(protect as any);

const denyOperationsManager = (req: any, res: any, next: any) => {
  const role = (req.user?.role || '').toString().toUpperCase().replace(/\s+/g, '_');
  if (role === 'OPERATIONS_MANAGER') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const denyExecutiveReadOnly = (req: any, res: any, next: any) => {
  const role = (req.user?.role || '').toString().toUpperCase().replace(/\s+/g, '_');
  if (role === 'CEO' || role === 'COUNTRY_MANAGER') {
    return res.status(403).json({ message: 'Read-only access for this operation' });
  }
  next();
};

router.get('/', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), getOffers);
router.get('/:id', authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), getOfferById);
router.post(
  '/',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  denyOperationsManager,
  denyExecutiveReadOnly,
  createOffer
);
router.patch(
  '/:id/status',
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'),
  denyOperationsManager,
  denyExecutiveReadOnly,
  updateOfferStatus
);
router.put('/:id/ceo-approve', ceoApproveOffer);

export default router;
