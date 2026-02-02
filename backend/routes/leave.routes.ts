import { Router } from "express";
import { 
  applyLeave, 
  getMyLeaves, 
  getAllLeaves, 
  updateLeaveStatus 
} from "../controllers/leave.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

// Employee-facing endpoints for creating and tracking their own requests.
router.post("/apply", protect, applyLeave);
router.get("/my", protect, getMyLeaves);

// Management endpoints. 
// These require elevated permissions to ensure employees can't approve their own leaves.
router.get(
  "/all", 
  protect, 
  authorize("ADMIN", "HR_MANAGER"), 
  getAllLeaves
);

// We use PATCH here because we are only updating a specific part (status/comments) 
// of the leave record, not replacing the whole thing.
router.patch(
  "/:id/status", 
  protect, 
  authorize("ADMIN", "HR_MANAGER"), 
  updateLeaveStatus
);

export default router;