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
import multer from 'multer';
import { markManualAttendance, markBulkAttendance } from '../controllers/attendance.controller';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/my', getMyAttendance);
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);    

router.get('/all', authorize('ADMIN', 'HR_MANAGER', 'CEO'), getAllAttendance);
router.post('/auto-checkout', authorize('ADMIN'), runAutoCheckout); 
router.post('/manual', authorize('ADMIN', 'HR_MANAGER'), markManualAttendance);
router.post('/bulk', authorize('ADMIN', 'HR_MANAGER'), upload.single('file'), markBulkAttendance);

export default router;