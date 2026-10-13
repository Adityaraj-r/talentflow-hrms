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
import { requireRecruitmentApprover, requireRecruitmentOperator, requireRecruitmentReadRole } from "../middleware/recruitmentRbac.middleware";

const router = express.Router();

router.use(protect as any);

router.get("/",                 authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getCandidates);
router.get("/:id",              authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'read'), requireRecruitmentReadRole, getCandidateById);
router.post("/",                authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), requireRecruitmentOperator, createCandidate);
router.put("/:id",              authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), requireRecruitmentOperator, updateCandidate);
router.patch("/:id/stage",      authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), requireRecruitmentOperator, updateCandidateStage);
router.patch("/:id/reject",     authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'write'), requireRecruitmentOperator, rejectCandidate);
router.delete("/:id",           authorizeByMatrix(MODULE_KEYS.RECRUITMENT, 'delete'), requireRecruitmentApprover, deleteCandidate);

export default router;
