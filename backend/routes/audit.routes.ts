import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { protect } from '../middleware/auth.middleware';
import { authorizeByMatrix, MODULE_KEYS } from '../middleware/role.middleware';

const router = express.Router();

router.get('/', protect, authorizeByMatrix(MODULE_KEYS.AUDIT, 'read'), getAuditLogs);

export default router;
