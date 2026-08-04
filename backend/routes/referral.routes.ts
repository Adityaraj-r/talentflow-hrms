import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getOpenJobsForReferral,
  createReferral,
  getMyReferrals,
  cancelReferral,
  verifyReferralToken,
} from "../controllers/referral.controller";

const router = express.Router();

router.get("/verify-token", verifyReferralToken);

router.use(protect as any);

router.get("/open-jobs", getOpenJobsForReferral);
router.post("/", createReferral);
router.get("/my-referrals", getMyReferrals);
router.delete("/:id", cancelReferral);

export default router;
