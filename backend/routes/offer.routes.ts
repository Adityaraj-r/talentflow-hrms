import express from 'express';
import { getOffers, createOffer, updateOfferStatus } from '../controllers/offer.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.get('/', getOffers);
router.post('/', authorize('ADMIN', 'HR', 'SUPER ADMIN') as any, createOffer);
router.patch('/:id/status', authorize('ADMIN', 'HR', 'SUPER ADMIN') as any, updateOfferStatus);

export default router;