import express from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  addEmployeeToDepartment,
  removeEmployeeFromDepartment,
} from '../controllers/departmentController'; 

import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();
router.use(protect as any);


router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);


router.use(authorize('CEO', 'COUNTRY_MANAGER', 'HR_MANAGER', 'ADMIN') as any); 

router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.post('/:id/employees', addEmployeeToDepartment);
router.delete('/:id/employees/:employeeId', removeEmployeeFromDepartment);

export default router;