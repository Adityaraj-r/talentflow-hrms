import express from "express"
import { applyJob, getApplications, updateApplicationStatus, getApplicationStatus } from "../controllers/application.controller"
import upload from "../middleware/upload"
import { protect } from "../middleware/auth.middleware"
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware"

const router = express.Router()

router.post(
  "/apply",
  upload.single("resume"),
  applyJob
)

router.get("/status/:email", getApplicationStatus)

router.use(protect as any)

router.get("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getApplications)
router.put("/:id/status", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), updateApplicationStatus)

export default router
