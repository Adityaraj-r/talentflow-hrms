import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrixStrict, MODULE_KEYS } from '../middleware/role.middleware';

const router = Router();

const perfRead = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'read');
const perfWrite = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'write');
const perfDelete = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'delete');

router.use(protect as any);

router.post('/cycles', perfDelete, PerformanceController.createCycle);
router.get('/cycles', perfRead, PerformanceController.getCycles);
router.get('/cycles/:id', perfRead, PerformanceController.getCycleById);
router.put('/cycles/:id', perfWrite, PerformanceController.updateCycle);
router.delete('/cycles/:id', perfDelete, PerformanceController.deleteCycle);

router.get('/stats', perfRead, PerformanceController.getStats);
router.get('/dashboard-analytics', perfRead, PerformanceController.getDashboardAnalytics);
router.get('/analytics-summary', perfRead, PerformanceController.getAnalyticsSummary);

router.post('/reviews/assign', perfWrite, PerformanceController.assignReview);
router.post('/reviews/:id/confirm-goals', perfWrite, PerformanceController.confirmGoals);

router.post('/self-assessment', perfWrite, PerformanceController.submitSelfAssessment);
router.post('/manager-review', perfWrite, PerformanceController.submitManagerReview);
router.patch('/hr-review/:id', perfWrite, PerformanceController.submitHRReview);
router.patch('/ceo-review/:id', perfWrite, PerformanceController.submitCeoReview);
router.patch('/calibrate/:id', perfWrite, PerformanceController.submitCalibration);
router.patch('/finalize/:id', perfDelete, PerformanceController.finalizeReview);
router.patch('/release-feedback/:id', perfWrite, PerformanceController.releaseFeedback);

router.get('/my-review/:cycleId', perfRead, PerformanceController.getMyReview);

router.get('/reviews/pending', perfRead, PerformanceController.getPendingReviews);
router.get('/reviews/all', perfRead, PerformanceController.getAllReviews);
router.get('/reviews/employee/:employeeId', perfRead, PerformanceController.getEmployeeReviews);
router.get('/reviews/:reviewId/goals', perfRead, PerformanceController.getGoalsForReview);
router.get('/reviews/:id', perfRead, PerformanceController.getReviewById);

router.put('/reviews/:id/submit', perfWrite, PerformanceController.submitReview);
router.put('/reviews/:id/approve', perfDelete, PerformanceController.approveReview);

export default router;
