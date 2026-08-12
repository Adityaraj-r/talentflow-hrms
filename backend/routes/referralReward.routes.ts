import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getRewardQueue,
  approveRewardHR,
  approveRewardFinance,
  getRewardAnalytics,
} from "../controllers/referralReward.controller";

const router = express.Router();

router.use(protect as any);

router.get("/queue", getRewardQueue);
router.get("/analytics", getRewardAnalytics);
router.patch("/:id/approve-hr", approveRewardHR);
router.patch("/:id/approve-finance", approveRewardFinance);

export default router;
