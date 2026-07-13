import express from 'express';
import {
    initiateOffboarding,
    getAllOffboardingRequests,
    updateOffboardingStatus,
    getEligibleEmployees,
    withdrawOffboardingRequest,
    updateClearance
} from '../controllers/offboardingRequest.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.get('/eligible-employees', authorize('HR_MANAGER', 'DIRECT_MANAGER'), getEligibleEmployees);

router.post('/initiate', authorize('HR_MANAGER', 'DIRECT_MANAGER', 'EMPLOYEE'), initiateOffboarding);

router.get('/all', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER', 'HR_MANAGER', 'HR_OFFICER', 'DIRECT_MANAGER', 'EMPLOYEE'), getAllOffboardingRequests);

router.patch('/update/:id', authorize('ADMIN', 'CEO', 'COUNTRY_MANAGER', 'HR_MANAGER', 'DIRECT_MANAGER'), updateOffboardingStatus);

router.patch('/clearance/:id', authorize('ADMIN', 'HR_MANAGER', 'DIRECT_MANAGER'), updateClearance);

router.patch('/withdraw/:id', authorize('EMPLOYEE'), withdrawOffboardingRequest);

export default router;