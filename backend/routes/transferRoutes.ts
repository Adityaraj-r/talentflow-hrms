import express from 'express';
import { 
    createTransferRequest, 
    getAllTransfers, 
    updateTransferStatus ,
    getEmployeeLatestTransfer
} from '../controllers/transferController';

const router = express.Router();

//  /api/transfers/submit
router.post('/submit', createTransferRequest);

//  /api/transfers/all
router.get('/all', getAllTransfers);

//  /api/transfers/update/:id
router.patch('/update/:id', updateTransferStatus);

//  /api/transfers/status
router.get('/status/:employeeId', getEmployeeLatestTransfer);

export default router;