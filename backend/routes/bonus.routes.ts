import express from 'express';
import { BonusController } from '../controllers/bonus.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.post(
  '/run/:cycleId',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'FINANCE_MANAGER') as express.RequestHandler,
  catchAsync(BonusController.runBonusForCycle)
);

router.get(
  '/preview/:cycleId',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'FINANCE_MANAGER', 'ADMIN', 'CEO') as express.RequestHandler,
  catchAsync(BonusController.getBonusPreview)
);

export default router;
