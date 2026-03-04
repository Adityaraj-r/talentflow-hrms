import express from "express"
import { applyJob, getApplications, updateApplicationStatus, getApplicationStatus  } from "../controllers/application.controller"

const router = express.Router()

router.post("/apply", applyJob)

router.get("/", getApplications)
router.get("/status/:email", getApplicationStatus)
router.put("/:id/status", updateApplicationStatus)
export default router