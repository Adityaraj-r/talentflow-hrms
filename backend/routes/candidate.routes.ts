import express from "express";
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  updateCandidateStage,
  rejectCandidate,
  deleteCandidate
} from "../controllers/candidate.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

router.use(protect as any);
router.use(authorize("CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "ADMIN") as any);

router.get("/",                 getCandidates);
router.get("/:id",              getCandidateById);
router.post("/",                createCandidate);
router.put("/:id",              updateCandidate);
router.patch("/:id/stage",      updateCandidateStage);
router.patch("/:id/reject",     rejectCandidate);
router.delete("/:id",           deleteCandidate);

export default router;
