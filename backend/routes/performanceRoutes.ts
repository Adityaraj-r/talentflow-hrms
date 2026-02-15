import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { authenticate } from '../middleware/auth.middleware';  // ← RE-ENABLED

const router = Router();

// All routes require authentication
router.use(authenticate);  // ← RE-ENABLED

// Performance Cycle Routes
router.post('/cycles', PerformanceController.createCycle);           // Create cycle
router.get('/cycles', PerformanceController.getCycles);              // Get all cycles
router.get('/cycles/:id', PerformanceController.getCycleById);       // Get single cycle
router.put('/cycles/:id', PerformanceController.updateCycle);        // Update cycle
router.delete('/cycles/:id', PerformanceController.deleteCycle);     // Delete cycle

// Stats Route
router.get('/stats', PerformanceController.getStats);                // Dashboard stats

export default router;
