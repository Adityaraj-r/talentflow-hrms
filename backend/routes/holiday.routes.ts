import { Router } from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controllers/holiday.controller';
import { protect } from '../middleware/auth.middleware'; 
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.get('/', protect, getHolidays);
router.post('/add', protect, authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), addHoliday);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), deleteHoliday);

export default router;