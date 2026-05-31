import express from "express";
import {
  createRequisition,
  getPendingRequisitions,
  getRequisitionHistory,
  approveRequisition,
  rejectRequisition,
  getRequisitionStats,
  addRequisitionRecommendation,
} from "../controllers/requisition.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";
import {
  requireRecruitmentApprover,
  requireRecruitmentOperator,
  requireRequisitionReadRole,
  requireRequisitionRequester,
} from "../middleware/recruitmentRbac.middleware";

const router = express.Router();

router.use(protect as any);

router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRequisitionRequester, createRequisition);
router.get("/stats", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRequisitionReadRole, getRequisitionStats);
router.get("/pending", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRequisitionReadRole, getPendingRequisitions);
router.get("/history", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRequisitionReadRole, getRequisitionHistory);
router.patch("/:id/recommendations", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, addRequisitionRecommendation);
router.put("/:id/approve", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, approveRequisition);
router.put("/:id/reject", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, rejectRequisition);

export default router;
