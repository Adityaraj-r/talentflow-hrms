import express from "express";
import {
  getRecruitmentAnalyticsFunnel,
  getRecruitmentAnalyticsInsights,
  getRecruitmentAnalyticsOverview,
  getRecruitmentAnalyticsRecruiters,
  getRecruitmentAnalyticsSources,
  getRecruitmentAnalyticsVelocity,
} from "../controllers/recruitmentAnalytics.controller";
import { protect } from "../middleware/auth.middleware";
import { requireRecruitmentReadRole } from "../middleware/recruitmentRbac.middleware";

const router = express.Router();

router.use(protect as any);
router.use(requireRecruitmentReadRole);

router.get("/overview", getRecruitmentAnalyticsOverview);
router.get("/funnel", getRecruitmentAnalyticsFunnel);
router.get("/recruiters", getRecruitmentAnalyticsRecruiters);
router.get("/sources", getRecruitmentAnalyticsSources);
router.get("/velocity", getRecruitmentAnalyticsVelocity);
router.get("/insights", getRecruitmentAnalyticsInsights);

export default router;
