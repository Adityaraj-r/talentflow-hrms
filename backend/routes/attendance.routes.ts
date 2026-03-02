import express from 'express';
import { 
  getMyAttendance, 
  clockIn, 
  clockOut, 
  startBreak, 
  endBreak, 
  getAllAttendance, 
  runAutoCheckout 
} from '../controllers/attendance.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/my', getMyAttendance);
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);    

router.get('/all', authorize('ADMIN', 'HR_MANAGER', 'CEO'), getAllAttendance);
router.post('/auto-checkout', authorize('ADMIN'), runAutoCheckout); 
export default router;