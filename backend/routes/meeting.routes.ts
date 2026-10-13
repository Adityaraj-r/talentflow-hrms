import express from 'express';
import { 
  createMeeting, 
  getMeetings, 
  updateMeeting, 
  deleteMeeting 
} from '../controllers/meeting.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(createMeeting)
  .get(getMeetings);

router.route('/:id')
  .put(updateMeeting)
  .delete(deleteMeeting);

export default router;
