import express from "express";
import {
  createRequisition,
  getPendingRequisitions,
  getRequisitionHistory,
  approveRequisition,
  rejectRequisition,
  getRequisitionStats,
} from "../controllers/requisition.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";

const router = express.Router();

router.use(protect as any);

router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), createRequisition);
router.get("/stats", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getRequisitionStats);
router.get("/pending", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getPendingRequisitions);
router.get("/history", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getRequisitionHistory);
router.put("/:id/approve", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), approveRequisition);
router.put("/:id/reject", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), rejectRequisition);

export default router;
