import express from "express";
import { protect } from "../middleware/auth.middleware";
import { authorize, authorizeByMatrix, authorizeByMatrixAny, MODULE_KEYS } from "../middleware/role.middleware";
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
const referralReadRoles = authorize("ADMIN", "SUPER_ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER");
const referralRewardReadRoles = authorize("ADMIN", "SUPER_ADMIN", "CEO", "HR_MANAGER", "HR_OFFICER", "FINANCE_MANAGER", "PAYROLL_OFFICER");
const referralReviewRoles = authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER");
const referralPolicyRoles = authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER");

router.get("/verify-token", verifyReferralToken);
router.get("/verify-token/:token", verifyReferralToken);

router.use(protect as any);

// Analytics & Reports
router.get("/reports/employee-performance", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReadRoles, getEmployeePerformanceReport);
router.get("/reports/employee-detail/:employeeId", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReadRoles, getEmployeeReferralDetail);
router.get("/reports/funnel", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReadRoles, getAdvancedFunnelAnalytics);
router.get("/reports/job-department", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReadRoles, getJobDepartmentAnalytics);
router.get("/reports/sla-tracking", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReadRoles, getSlaTrackingReport);

// AI Enhancement Endpoints
router.post("/parse-resume", parseResumeEndpoint);
router.post("/:id/ai-match", matchJobEndpoint);

// Policy & Conflicts
router.get(
  "/policy",
  authorizeByMatrixAny([
    { module: MODULE_KEYS.RECRUITMENT, action: "read" },
    { module: MODULE_KEYS.PAYROLL, action: "read" },
  ]),
  referralRewardReadRoles,
  getReferralPolicy
);
router.put("/policy", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), referralPolicyRoles, updateReferralPolicy);
router.get("/conflicts", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), referralReviewRoles, getReferralConflicts);
router.post("/:id/resolve-conflict", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), referralReviewRoles, resolveReferralConflict);

// General Referral Actions
router.get("/open-jobs", getOpenJobsForReferral);
router.post("/", createReferral);
router.post("/shareable-link", generateShareableLink);
router.get("/my-referrals", getMyReferrals);
router.post("/:id/resend-invitation", resendInvitation);
router.get("/:id/timeline", getReferralTimeline);
router.delete("/:id", cancelReferral);

export default router;
