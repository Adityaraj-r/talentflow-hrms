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
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";

const router = express.Router();

router.use(protect as any);

router.get("/",                 authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), getCandidates);
router.get("/:id",              authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), getCandidateById);
router.post("/",                authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), createCandidate);
router.put("/:id",              authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), updateCandidate);
router.patch("/:id/stage",      authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), updateCandidateStage);
router.patch("/:id/reject",     authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), rejectCandidate);
router.delete("/:id",           authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'delete'), deleteCandidate);

export default router;
