import { Router } from 'express'
import { GoalController } from '../controllers/goalController'
import { protect } from '../middleware/auth.middleware'
import { authorizeByMatrixStrict, MODULE_KEYS } from '../middleware/role.middleware'

const router = Router()
router.use(protect as any)

const perfRead = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'read')
const perfWrite = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'write')
const perfDelete = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'delete')

router.get('/my-goals', perfRead, GoalController.getMyGoals)
router.get('/team-goals', perfRead, GoalController.getTeamGoals)
router.post('/', perfWrite, GoalController.createGoal)
router.put('/:id', perfWrite, GoalController.updateGoal)
router.delete('/:id', perfDelete, GoalController.deleteGoal)

export default router
