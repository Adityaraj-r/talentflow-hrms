import express from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getRoles);           // Fetch Matrix
router.post('/', createRole);        // Add Column
router.put('/:id', updateRole);      // Save Cell Changes
router.delete('/:id', deleteRole);   // Remove Column

export default router;