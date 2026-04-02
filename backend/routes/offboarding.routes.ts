import express from 'express';
import {
    initiateOffboarding,
    getAllOffboardingRequests,
    updateOffboardingStatus
} from '../controllers/offboardingRequest.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.post('/initiate', authorize('HR_MANAGER'), initiateOffboarding);
router.get('/all', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER', 'HR_MANAGER' ,'HR_OFFICER'), getAllOffboardingRequests);
router.patch('/update/:id', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER'), updateOffboardingStatus);

export default router;