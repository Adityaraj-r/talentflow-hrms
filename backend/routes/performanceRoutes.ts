import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';


const router = Router();

// All performance routes require authentication
router.use(protect as any);


// ── Cycle Management (HR_MANAGER only) ──────────────────────────────────────
router.post(  '/cycles',     authorize('HR_MANAGER', 'SUPER ADMIN'), PerformanceController.createCycle);
router.get(   '/cycles',     PerformanceController.getCycles);
router.get(   '/cycles/:id', PerformanceController.getCycleById);
router.put(   '/cycles/:id', authorize('HR_MANAGER', 'SUPER ADMIN'), PerformanceController.updateCycle);
router.delete('/cycles/:id', authorize('HR_MANAGER', 'SUPER ADMIN'), PerformanceController.deleteCycle);


// ── Stats (HR_MANAGER, CEO, SUPER ADMIN) ────────────────────────────────────
router.get('/stats', PerformanceController.getStats);


// ── Reviews ─────────────────────────────────────────────────────────────────

// Assign: HR_MANAGER designates reviewer for an employee
router.post('/reviews/assign',                  authorize('HR_MANAGER', 'SUPER ADMIN'),  PerformanceController.assignReview);

// IMPORTANT: specific routes before :id wildcard routes
router.get('/reviews/pending',                  PerformanceController.getPendingReviews);
router.get('/reviews/all',                      PerformanceController.getAllReviews);
router.get('/reviews/employee/:employeeId',     PerformanceController.getEmployeeReviews);

// ADDED: get single review by ID (fixes ReviewDetailPage fetching ALL reviews)
router.get('/reviews/:id',                      PerformanceController.getReviewById);

// Submit: reviewer (manager) fills in ratings
router.put('/reviews/:id/submit',               PerformanceController.submitReview);

// Approve: HR_MANAGER approves completed reviews
router.put('/reviews/:id/approve',              authorize('HR_MANAGER', 'SUPER ADMIN'),  PerformanceController.approveReview);


// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics/summary', PerformanceController.getAnalyticsSummary);


export default router;
