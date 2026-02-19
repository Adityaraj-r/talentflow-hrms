import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect as any);

router.post('/cycles', PerformanceController.createCycle);
router.get('/cycles', PerformanceController.getCycles);
router.get('/cycles/:id', PerformanceController.getCycleById);
router.put('/cycles/:id', PerformanceController.updateCycle);
router.delete('/cycles/:id', PerformanceController.deleteCycle);

router.get('/stats', PerformanceController.getStats);

export default router;