import express from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.get('/', protect as express.RequestHandler, catchAsync(NotificationController.getNotifications));

router.patch(
  '/:id/read',
  protect as express.RequestHandler,
  catchAsync(NotificationController.markRead)
);

export default router;
