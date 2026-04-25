import { Router } from "express";
import {
  // Policy
  createLeavePolicy,
  getAllLeavePolicies,
  updateLeavePolicy,
  deleteLeavePolicy,
  // Balance
  getMyLeaveBalance,
  getAllLeaveBalances,
  initializeBalancesForAllEmployees,
  // Leave requests
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
} from "../controllers/leave.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(protect);

router.get("/policies", getAllLeavePolicies);

router.post(
  "/policies",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  createLeavePolicy
);

router.put(
  "/policies/:id",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  updateLeavePolicy
);

router.delete(
  "/policies/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  deleteLeavePolicy
);


router.get("/balance/my", getMyLeaveBalance);

router.get(
  "/balance/all",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"),
  getAllLeaveBalances
);

router.post(
  "/balance/initialize",
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  initializeBalancesForAllEmployees
);

router.post("/apply", applyLeave);

router.get("/my", getMyLeaves);

router.get(
  "/all",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  getAllLeaves
);

router.patch(
  "/:id/status",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  updateLeaveStatus
);

router.patch("/:id/cancel", cancelLeave);

export default router;