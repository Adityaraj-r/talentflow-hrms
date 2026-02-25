import express from 'express';
import { 
    getDepartments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    getDepartmentDetails,
    assignManager
} from '../controllers/departmentController';
import { authenticate } from '../middleware/auth.middleware'; 

const router = express.Router();

router.use(authenticate); 

router.get('/', getDepartments);
router.post('/', addDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.get('/:id', getDepartmentDetails);
router.put('/:id/assign-manager', assignManager);

export default router;