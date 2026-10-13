import express from 'express';
import { AppraisalCycleController } from '../controllers/appraisalCycle.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.post(
  '/',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'HR_OFFICER') as express.RequestHandler,
  catchAsync(AppraisalCycleController.createCycle)
);

router.get(
  '/',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'HR_OFFICER', 'ADMIN', 'CEO', 'FINANCE_MANAGER') as express.RequestHandler,
  catchAsync(AppraisalCycleController.getCycles)
);

router.get(
  '/me/appraisal-result',
  protect as express.RequestHandler,
  authorize('EMPLOYEE') as express.RequestHandler,
  catchAsync(AppraisalCycleController.getMyPublishedResult)
);

router.get(
  '/:id',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'HR_OFFICER', 'ADMIN', 'CEO', 'FINANCE_MANAGER') as express.RequestHandler,
  catchAsync(AppraisalCycleController.getCycleById)
);

router.patch(
  '/:id/status',
  protect as express.RequestHandler,
  authorize('HR_MANAGER', 'HR_OFFICER') as express.RequestHandler,
  catchAsync(AppraisalCycleController.transitionStatus)
);

router.delete(
  '/:id',
  protect as express.RequestHandler,
  authorize('HR_MANAGER') as express.RequestHandler,
  catchAsync(AppraisalCycleController.softDeleteCycle)
);

export default router;
