import express from "express";
import {
  createCandidate,
  getCandidates,
  updateCandidateStage,
  deleteCandidate,
  rejectCandidate 
} from "../controllers/candidate.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

router.use(protect as any);
router.use(authorize('HR_MANAGER', 'ADMIN', 'CEO', 'COUNTRY_MANAGER', 'DEPARTMENT_MANAGER') as any);
router.post("/", createCandidate);
router.get("/", getCandidates);
router.put("/:id", updateCandidateStage);
router.delete("/:id", deleteCandidate);
router.patch("/:id/reject", rejectCandidate);
router.patch("/:id/stage", updateCandidateStage);

export default router;