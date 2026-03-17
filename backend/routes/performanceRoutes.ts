import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(protect as any);

// ─── CYCLES (HRMANAGER only for mutations) ────────────────────────────────────
router.post('/cycles', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.createCycle);
router.get('/cycles', PerformanceController.getCycles);
router.get('/cycles/:id', PerformanceController.getCycleById);
router.put('/cycles/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.updateCycle);
router.delete('/cycles/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.deleteCycle);

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', PerformanceController.getStats);

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics-summary', PerformanceController.getAnalyticsSummary);

// ─── PHASE 5: NEW WORKFLOW ENDPOINTS ─────────────────────────────────────────
// IMPORTANT: specific named routes MUST come before /:id wildcard

// Employee self-assessment
router.post('/self-assessment', authorize('EMPLOYEE'), PerformanceController.submitSelfAssessment);

// Manager submits review (Direct or Department Manager)
router.post('/manager-review', authorize('DIRECTMANAGER', 'DEPARTMENTMANAGER', 'SUPER ADMIN'), PerformanceController.submitManagerReview);

// HR Manager adds HR-level review notes
router.patch('/hr-review/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.submitHRReview);

// HR Manager finalizes the review
router.patch('/finalize/:id', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.finalizeReview);

// Employee views their own review for a specific cycle
router.get('/my-review/:cycleId', authorize('EMPLOYEE'), PerformanceController.getMyReview);

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
// NOTE: specific routes before /:id wildcard
router.post('/reviews/assign', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.assignReview);
router.get('/reviews/pending', PerformanceController.getPendingReviews);
router.get('/reviews/all', PerformanceController.getAllReviews);
router.get('/reviews/employee/:employeeId', PerformanceController.getEmployeeReviews);
router.get('/reviews/:id', PerformanceController.getReviewById);          // FIXED: added in Phase 1
router.put('/reviews/:id/submit', PerformanceController.submitReview);
router.put('/reviews/:id/approve', authorize('HRMANAGER', 'SUPER ADMIN'), PerformanceController.approveReview);

export default router;
