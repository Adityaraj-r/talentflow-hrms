import express from "express";
import {
  createRequisition,
  getPendingRequisitions,
  getRequisitionHistory,
  approveRequisition,
  rejectRequisition,
  getRequisitionStats,

} from "../controllers/requisition.controller";

const router = express.Router();

router.post("/", createRequisition);
router.get("/stats", getRequisitionStats);

router.get("/pending", getPendingRequisitions);

router.get("/history", getRequisitionHistory);

router.put("/:id/approve", approveRequisition);

router.put("/:id/reject", rejectRequisition);

export default router;
