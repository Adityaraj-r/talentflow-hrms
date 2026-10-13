import express from 'express';
import {
    createTransferRequest,
    getAllTransfers,
    getMyTransfers,
    updateTransferStatus,
    getEmployeeLatestTransfer,
    addManagerRecommendation
} from '../controllers/transferController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.post('/submit', createTransferRequest);

router.post('/request', createTransferRequest);

router.get('/my-requests', getMyTransfers);

// UPDATED: Added DEPARTMENT_MANAGER, DIRECT_MANAGER, OPERATIONS_MANAGER, PROJECT_MANAGER
router.get('/all', authorize('ADMIN', 'CEO', 'HR_MANAGER', 'COUNTRY_MANAGER' , 'HR_OFFICER', 'DEPARTMENT_MANAGER', 'DIRECT_MANAGER', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER'), getAllTransfers);

router.patch('/update/:id', authorize('HR_MANAGER', 'CEO', 'COUNTRY_MANAGER'), updateTransferStatus);

// NEW: Endpoint specifically for Managers to add their recommendation
router.patch('/recommend/:id', authorize('DEPARTMENT_MANAGER', 'DIRECT_MANAGER', 'OPERATIONS_MANAGER'), addManagerRecommendation);

router.get('/status/:employeeId', getEmployeeLatestTransfer);

export default router;