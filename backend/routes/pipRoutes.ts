import { Router } from 'express'
import { PIPController } from '../controllers/pipController'
import { protect } from '../middleware/auth.middleware'
import { authorizeByMatrixStrict, MODULE_KEYS } from '../middleware/role.middleware'

const router = Router()
router.use(protect as any)

const perfRead = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'read')
const perfWrite = authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'write')

router.get('/', perfRead, PIPController.getPIPs)
router.post('/', perfWrite, PIPController.createPIP)
router.put('/:id', perfWrite, PIPController.updatePIP)

export default router
