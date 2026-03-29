import { Router } from 'express'
import { GoalController } from '../controllers/goalController'
import { protect } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'

const router = Router()
router.use(protect as any)

// Specific named routes BEFORE :id wildcard
router.get('/my-goals', authorize('EMPLOYEE'), GoalController.getMyGoals)
router.get('/team-goals', authorize('DIRECTMANAGER', 'DEPARTMENTMANAGER', 'HRMANAGER', 'SUPER ADMIN'), GoalController.getTeamGoals)
router.post('/', authorize('HRMANAGER', 'DIRECTMANAGER', 'DEPARTMENTMANAGER', 'SUPER ADMIN'), GoalController.createGoal)
router.put('/:id', authorize('HRMANAGER', 'DIRECTMANAGER', 'DEPARTMENTMANAGER', 'EMPLOYEE', 'SUPER ADMIN'), GoalController.updateGoal)
router.delete('/:id', authorize('HRMANAGER', 'SUPER ADMIN'), GoalController.deleteGoal)

export default router
