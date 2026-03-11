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

router.post("/apply", protect, applyLeave);
router.get("/my", protect, getMyLeaves);

router.get(
  "/all", 
  protect, 
  authorize("ADMIN", "HR_MANAGER","CEO"), 
  getAllLeaves
);

router.patch(
  "/:id/status", 
  protect, 
  authorize("ADMIN", "HR_MANAGER","CEO"), 
  updateLeaveStatus
);

export default router;