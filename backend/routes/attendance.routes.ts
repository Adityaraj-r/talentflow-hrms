import { Router } from "express";
import { 
  getMyAttendance, 
  clockIn, 
  clockOut, 
  getAllAttendance 
} from "../controllers/attendance.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

// These routes require a valid login token. 
// The 'protect' middleware identifies 'who' the user is before letting them proceed.
router.get("/my", protect, getMyAttendance);
router.post("/clock-in", protect, clockIn);
router.post("/clock-out", protect, clockOut);

// Admin & HR exclusive access.
// We chain 'protect' (to verify identity) and 'authorize' (to verify permission).
// Note: If adding a 'Manager' role later, include it in the authorize arguments here.
router.get(
  "/all", 
  protect, 
  authorize("ADMIN", "HR_MANAGER"), 
  getAllAttendance
);

export default router;