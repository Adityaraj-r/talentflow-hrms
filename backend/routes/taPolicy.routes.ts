import express from 'express';
import { getTAPolicy, updateTAPolicy } from '../controllers/taPolicy.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', protect, getTAPolicy);

router.put('/', protect, authorize('HR_MANAGER', 'ADMIN', 'SUPER ADMIN'), updateTAPolicy);

export default router;