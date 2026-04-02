import express from 'express';
import {
    createTransferRequest,
    getAllTransfers,
    getMyTransfers,
    updateTransferStatus,
    getEmployeeLatestTransfer
} from '../controllers/transferController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect as any);

router.post('/submit', createTransferRequest);

router.post('/request', createTransferRequest);

router.get('/my-requests', getMyTransfers);

router.get('/all', authorize('ADMIN', 'CEO', 'HR_MANAGER', 'COUNTRY_MANAGER' , 'HR_OFFICER'), getAllTransfers);

router.patch('/update/:id', authorize('ADMIN', 'CEO'), updateTransferStatus);

router.get('/status/:employeeId', getEmployeeLatestTransfer);

export default router;