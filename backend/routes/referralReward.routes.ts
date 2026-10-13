import express from "express";
import { protect } from "../middleware/auth.middleware";
import { authorize, authorizeByMatrixAny, MODULE_KEYS } from "../middleware/role.middleware";
import {
  getRewardQueue,
  approveRewardHR,
  approveRewardFinance,
  getRewardAnalytics,
} from "../controllers/referralReward.controller";

const router = express.Router();

router.use(protect as any);

const rewardReadModules = authorizeByMatrixAny([
  { module: MODULE_KEYS.RECRUITMENT, action: "read" },
  { module: MODULE_KEYS.PAYROLL, action: "read" },
]);

router.get(
  "/queue",
  rewardReadModules,
  authorize("ADMIN", "SUPER_ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "FINANCE_MANAGER", "PAYROLL_OFFICER"),
  getRewardQueue
);
router.get(
  "/analytics",
  rewardReadModules,
  authorize("ADMIN", "SUPER_ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "FINANCE_MANAGER", "PAYROLL_OFFICER"),
  getRewardAnalytics
);
router.patch(
  "/:id/approve-hr",
  authorizeByMatrixAny([{ module: MODULE_KEYS.RECRUITMENT, action: "write" }]),
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"),
  approveRewardHR
);
router.patch(
  "/:id/approve-finance",
  authorizeByMatrixAny([{ module: MODULE_KEYS.PAYROLL, action: "write" }]),
  authorize("ADMIN", "SUPER_ADMIN", "FINANCE_MANAGER", "PAYROLL_OFFICER"),
  approveRewardFinance
);

export default router;
