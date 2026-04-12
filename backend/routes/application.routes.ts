import express from "express"
import { applyJob, getApplications, updateApplicationStatus, getPublicApplicationStatus, scheduleInterviewAndSendMail } from "../controllers/application.controller"
import upload from "../middleware/upload"
import { protect } from "../middleware/auth.middleware"
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware"

const router = express.Router()

router.post(
  "/apply",
  upload.single("resume"),
  applyJob
)

router.get("/public-status/:id", getPublicApplicationStatus)

router.use(protect as any)

router.get("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getApplications)
router.put(
  "/:id/status",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  (req: any, res: any, next: any) => {
    const role = (req.user?.role || "").toString().toUpperCase().replace(/\s+/g, "_")
    if (role === "OPERATIONS_MANAGER") return res.status(403).json({ message: "Access denied" })
    next()
  },
  updateApplicationStatus
)
router.post(
  "/:id/schedule-interview",
  authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"),
  (req: any, res: any, next: any) => {
    const role = (req.user?.role || "").toString().toUpperCase().replace(/\s+/g, "_")
    if (role === "OPERATIONS_MANAGER") return res.status(403).json({ message: "Access denied" })
    next()
  },
  scheduleInterviewAndSendMail
)

export default router
