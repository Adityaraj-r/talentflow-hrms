import express from "express"
import { applyJob, getApplications, updateApplicationStatus, getApplicationStatus  } from "../controllers/application.controller"

const router = express.Router()

// Candidate Apply
router.post("/apply", applyJob)

// HR View Applications
router.get("/", getApplications)
router.get("/status/:email", getApplicationStatus)
router.put("/:id/status", updateApplicationStatus)
export default router