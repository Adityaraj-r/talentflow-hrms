import express from "express";
import {
  getSummary,
  getWorkforceData,
  getAttendanceData,
  getDepartmentData,
  getLeaveData,
  getEmployeePerformance,
  getDepartmentWorkingHours
} from "../controllers/reports.controller";

const router = express.Router();

// KPI summary
router.get("/summary", getSummary);

// Workforce analytics
router.get("/workforce", getWorkforceData);

// Attendance analytics
router.get("/attendance", getAttendanceData);

// Department distribution
router.get("/departments", getDepartmentData);

// Leave breakdown
router.get("/leaves", getLeaveData);

// Performance table
router.get("/performance", getEmployeePerformance);

router.get("/department-hours", getDepartmentWorkingHours);

export default router;