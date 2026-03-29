import { Router } from 'express'
import { PIPController } from '../controllers/pipController'
import { protect } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'

const router = Router()
router.use(protect as any)

router.get('/', authorize('HRMANAGER', 'DIRECTMANAGER', 'DEPARTMENTMANAGER', 'EMPLOYEE', 'SUPER ADMIN'), PIPController.getPIPs)
router.post('/', authorize('HRMANAGER', 'DIRECTMANAGER', 'DEPARTMENTMANAGER', 'SUPER ADMIN'), PIPController.createPIP)
router.put('/:id', authorize('HRMANAGER', 'DIRECTMANAGER', 'DEPARTMENTMANAGER', 'SUPER ADMIN'), PIPController.updatePIP)

export default router
