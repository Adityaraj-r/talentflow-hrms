import express from "express"
import { applyJob, getApplications, updateApplicationStatus, getPublicApplicationStatus, scheduleInterviewAndSendMail } from "../controllers/application.controller"
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
router.put(
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

export default router
