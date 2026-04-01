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

const router = express.Router();

router.use(protect as any);

const denyOperationsManager = (req: any, res: any, next: any) => {
  const role = (req.user?.role || "").toString().toUpperCase().replace(/\s+/g, "_");
  if (role === "OPERATIONS_MANAGER") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

const denyExecutiveReadOnly = (req: any, res: any, next: any) => {
  const role = (req.user?.role || "").toString().toUpperCase().replace(/\s+/g, "_");
  if (role === "CEO" || role === "COUNTRY_MANAGER") {
    return res.status(403).json({ message: "Read-only access for this operation" });
  }
  next();
};

router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, createRequisition);
router.get("/stats", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getRequisitionStats);
router.get("/pending", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getPendingRequisitions);
router.get("/history", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getRequisitionHistory);
router.patch("/:id/recommendations", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyExecutiveReadOnly, addRequisitionRecommendation);
router.put("/:id/approve", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, approveRequisition);
router.put("/:id/reject", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, rejectRequisition);

export default router;
