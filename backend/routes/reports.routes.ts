import express from 'express';
import {
  getSummary,
  getWorkforceData,
  getAttendanceData,
  getDepartmentData,
  getLeaveData
} from '../controllers/reports.controller';

const router = express.Router();

// GET /api/reports/summary - KPI data
router.get('/summary', getSummary);

// GET /api/reports/workforce - Workforce analytics over time
router.get('/workforce', getWorkforceData);

// GET /api/reports/attendance - Attendance analytics
router.get('/attendance', getAttendanceData);

// GET /api/reports/departments - Department distribution
router.get('/departments', getDepartmentData);

// GET /api/reports/leaves - Leave breakdown
router.get('/leaves', getLeaveData);

export default router;