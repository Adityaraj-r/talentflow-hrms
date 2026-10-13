import express from "express";
import multer from "multer";
import {
  getMyAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAllAttendance,
  runAutoCheckout,
  markManualAttendance,
  markBulkAttendance,
  approveAttendance,
  lockAttendance,
  unlockAttendance,
  checkLockStatus,
  correctAttendance,
  submitCorrectionRequest,
  getCorrectionRequests,
  reviewCorrectionRequest,
  getMyCorrectionRequests,
  getOvertimePending,
  approveOvertime,
} from "../controllers/attendance.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get("/my", getMyAttendance);
router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);
router.post("/start-break", startBreak);
router.post("/end-break", endBreak);

router.get(
  "/all",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "CEO",
    "COUNTRY_MANAGER", 
    "FINANCE_MANAGER",  
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "PAYROLL_OFFICER"
  ),
  getAllAttendance
);

router.post(
  "/auto-checkout",
  authorize("ADMIN", "SUPER_ADMIN"),
  runAutoCheckout
);

router.post(
  "/manual",
  authorize("ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER_ADMIN"),
  markManualAttendance
);

router.post(
  "/bulk",
  authorize("ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER_ADMIN"),
  upload.single("file"),
  markBulkAttendance
);

router.get(
  "/lock-status",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_OFFICER"),
  checkLockStatus
);

router.post(
  "/lock",
  authorize("ADMIN", "PAYROLL_OFFICER", "HR_MANAGER", "SUPER_ADMIN"),
  lockAttendance
);

router.post(
  "/unlock",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  unlockAttendance
);

router.get("/my-correction-requests", getMyCorrectionRequests);

router.post(
  "/correction-requests",
  submitCorrectionRequest
);

router.get(
  "/correction-requests",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "CEO",
    "EXECUTIVE",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "FINANCE_MANAGER",
    "COUNTRY_MANAGER"
  ),
  getCorrectionRequests
);

router.patch(
  "/correction-requests/:id/review",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "CEO",
    "EXECUTIVE",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "FINANCE_MANAGER",
    "COUNTRY_MANAGER"
  ),
  reviewCorrectionRequest
);

router.get(
  "/overtime-pending",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "FINANCE_MANAGER"  
  ),
  getOvertimePending
);

router.patch(
  "/:id/approve-ot",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  approveOvertime
);

router.patch(
  "/:id/approve",
  authorize(
    "ADMIN",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "SUPER_ADMIN"
  ),
  approveAttendance
);

router.patch(
  "/:id/correct",
  authorize("ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER_ADMIN"),
  correctAttendance
);

export default router;