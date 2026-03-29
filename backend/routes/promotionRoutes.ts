import express from 'express';
import {
    nominateForPromotion,
    getAllPromotions,
    updatePromotionStatus
} from '../controllers/promotionController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.post('/nominate', authorize( 'HR_MANAGER', ), nominateForPromotion);

router.get('/all', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER', 'HR_MANAGER'), getAllPromotions);

router.patch('/update/:id', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER'), updatePromotionStatus);

export default router;