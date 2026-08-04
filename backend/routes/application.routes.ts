import express from "express"
import { applyJob, getApplications, getApplicationById, updateApplicationStatus, getPublicApplicationStatus, scheduleInterviewAndSendMail, evaluateCandidate, updateBgvDetails, advanceApplication, getApplicationWorkflowStatus } from "../controllers/application.controller"
import upload from "../middleware/upload"
import { protect } from "../middleware/auth.middleware"
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware"
import { requireApplicationStatusRole, requireRecruitmentOperator, requireRecruitmentReadRole } from "../middleware/recruitmentRbac.middleware"

const router = express.Router()

router.post(
  "/apply",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 }
  ]),
  applyJob
)

router.get("/public-status/:id", getPublicApplicationStatus)

router.use(protect as any)

router.get("/", requireRecruitmentReadRole, getApplications)
router.get("/:id", requireRecruitmentReadRole, getApplicationById)
router.get("/:id/workflow-status", requireRecruitmentReadRole, getApplicationWorkflowStatus);
router.post("/:id/advance", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, advanceApplication);
router.put(
  "/:id/status",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  requireApplicationStatusRole,
  updateApplicationStatus
)
router.patch(
  "/:id/status",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  requireApplicationStatusRole,
  updateApplicationStatus
)
router.post(
  "/:id/schedule-interview",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  requireRecruitmentOperator,
  scheduleInterviewAndSendMail
)
router.post(
  "/:id/evaluate",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  evaluateCandidate
)
router.put(
  "/:id/bgv",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  updateBgvDetails
)

export default router
