import express from "express";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

import {
  getSummary,
  getWorkforceData,
  getAttendanceData,
  getDepartmentData,
  getLeaveData,
  getEmployeePerformance,
  getDepartmentWorkingHours,
  getProductivityMetrics,
  getCEOInsights,
  getExportData
} from "../controllers/reports.controller";

const router = express.Router();

router.use(protect);

router.get(
  "/summary",
  authorize(
  "ADMIN",
  "CEO",
  "HR_MANAGER",
  "HR_OFFICER",
  "PAYROLL_OFFICER",
  "OPERATIONS_MANAGER",
  "DEPARTMENT_MANAGER",
  "DIRECT_MANAGER",
  "EMPLOYEE"
),
  getSummary
);

router.get(
  "/workforce",
  authorize("ADMIN", "CEO", "OPERATIONS_MANAGER", "HR_MANAGER"),
  getWorkforceData
);

router.get(
  "/attendance",
  authorize("ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "OPERATIONS_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"),
  getAttendanceData
);

router.get("/departments", getDepartmentData);

router.get(
 "/leaves",
 authorize("ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "OPERATIONS_MANAGER", "DIRECT_MANAGER" ),
 getLeaveData
);

router.get(
  "/performance",
  authorize("ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "OPERATIONS_MANAGER", "DIRECT_MANAGER"),
  getEmployeePerformance
);

router.get(
  "/department-hours",
  authorize("ADMIN", "CEO", "HR_MANAGER", "OPERATIONS_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"),
  getDepartmentWorkingHours
);

router.get(
  "/export",
  authorize("ADMIN"),
  getExportData
);

router.get(
  "/productivity",
  authorize("OPERATIONS_MANAGER", "ADMIN"),
  getProductivityMetrics
);

router.get(
  "/ceo-insights",
  authorize("ADMIN", "CEO", "HR_MANAGER", "OPERATIONS_MANAGER"),
  getCEOInsights
);

export default router;