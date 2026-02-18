import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', protect, admin, getAuditLogs);

export default router;