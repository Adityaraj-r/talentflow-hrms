import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect as any);

router.post('/cycles', authorize('HR_MANAGER', 'SUPER_ADMIN'), PerformanceController.createCycle);
router.get('/cycles', PerformanceController.getCycles);
router.get('/cycles/:id', PerformanceController.getCycleById);
router.put('/cycles/:id', authorize('HR_MANAGER', 'SUPER_ADMIN'), PerformanceController.updateCycle);
router.delete('/cycles/:id', authorize('HR_MANAGER', 'SUPER_ADMIN'), PerformanceController.deleteCycle);

router.get('/stats', PerformanceController.getStats);

router.get('/analytics-summary', PerformanceController.getAnalyticsSummary);

// Named routes before /:id wildcards.
router.post('/self-assessment', authorize('EMPLOYEE'), PerformanceController.submitSelfAssessment);
router.post('/manager-review', authorize('DIRECTMANAGER', 'DEPARTMENTMANAGER', 'SUPER ADMIN'), PerformanceController.submitManagerReview);
router.patch('/hr-review/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.submitHRReview);
router.patch('/finalize/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.finalizeReview);
router.get('/my-review/:cycleId', authorize('EMPLOYEE'), PerformanceController.getMyReview);

router.post('/reviews/assign', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.assignReview);
router.get('/reviews/pending', PerformanceController.getPendingReviews);
router.get('/reviews/all', PerformanceController.getAllReviews);
router.get('/reviews/employee/:employeeId', PerformanceController.getEmployeeReviews);
router.get('/reviews/:id', PerformanceController.getReviewById);
router.put('/reviews/:id/submit', PerformanceController.submitReview);
router.put('/reviews/:id/approve', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.approveReview);

export default router;
