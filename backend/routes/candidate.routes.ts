import express from "express";
import {
  createCandidate,
  getCandidates,
  updateCandidateStage,
  deleteCandidate,
  rejectCandidate 
} from "../controllers/candidate.controller";

const router = express.Router();

router.post("/", createCandidate);
router.get("/", getCandidates);
router.put("/:id", updateCandidateStage);
router.delete("/:id", deleteCandidate);
router.patch("/:id/reject", rejectCandidate);
router.patch("/:id/stage", updateCandidateStage);

export default router;
