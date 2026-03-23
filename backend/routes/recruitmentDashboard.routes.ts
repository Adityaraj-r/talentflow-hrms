import express from "express";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";
import { getRecruitmentDashboard } from "../controllers/recruitmentDashboard.controller";

const router = express.Router();

router.get(
  "/dashboard",
  protect as any,
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"),
  getRecruitmentDashboard
);

export default router;

