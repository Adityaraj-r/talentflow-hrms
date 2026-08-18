import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getOpenJobsForReferral,
  createReferral,
  getMyReferrals,
  cancelReferral,
  verifyReferralToken,
  generateShareableLink,
  getReferralPolicy,
  updateReferralPolicy,
  getReferralConflicts,
  resolveReferralConflict,
  resendInvitation,
} from "../controllers/referral.controller";
import {
  getEmployeePerformanceReport,
  getAdvancedFunnelAnalytics,
  getJobDepartmentAnalytics,
  getSlaTrackingReport,
  getReferralTimeline,
  getEmployeeReferralDetail,
  parseResumeEndpoint,
  matchJobEndpoint,
} from "../controllers/referralAnalytics.controller";

const router = express.Router();

router.get("/verify-token", verifyReferralToken);
router.get("/verify-token/:token", verifyReferralToken);

router.use(protect as any);

// Analytics & Reports
router.get("/reports/employee-performance", getEmployeePerformanceReport);
router.get("/reports/employee-detail/:employeeId", getEmployeeReferralDetail);
router.get("/reports/funnel", getAdvancedFunnelAnalytics);
router.get("/reports/job-department", getJobDepartmentAnalytics);
router.get("/reports/sla-tracking", getSlaTrackingReport);

// AI Enhancement Endpoints
router.post("/parse-resume", parseResumeEndpoint);
router.post("/:id/ai-match", matchJobEndpoint);

// Policy & Conflicts
router.get("/policy", getReferralPolicy);
router.put("/policy", updateReferralPolicy);
router.get("/conflicts", getReferralConflicts);
router.post("/:id/resolve-conflict", resolveReferralConflict);

// General Referral Actions
router.get("/open-jobs", getOpenJobsForReferral);
router.post("/", createReferral);
router.post("/shareable-link", generateShareableLink);
router.get("/my-referrals", getMyReferrals);
router.post("/:id/resend-invitation", resendInvitation);
router.get("/:id/timeline", getReferralTimeline);
router.delete("/:id", cancelReferral);

export default router;
