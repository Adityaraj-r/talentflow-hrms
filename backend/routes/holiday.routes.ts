import express from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controllers/holiday.controller';
import { protect, authorize } from '../middleware/auth.middleware'; 

const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/add', protect, authorize('ADMIN', 'HR_MANAGER'), addHoliday);
router.delete('/:id', protect, authorize('ADMIN', 'HR_MANAGER'), deleteHoliday);

export default router;