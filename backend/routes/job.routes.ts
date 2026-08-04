import express from "express";
import {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  getPublishedJobs,
  getAllJobs,
  deleteJob,
  getJobById,
  getWorkflowTemplates,
  getJobWorkflow,
} from "../controllers/job.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";
import { requireRecruitmentApprover, requireRecruitmentOperator, requireRecruitmentReadRole } from "../middleware/recruitmentRbac.middleware";
import upload from "../middleware/upload";

const router = express.Router();

router.get("/published", getPublishedJobs);

router.use(protect as any);

router.get("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRecruitmentReadRole, getAllJobs);
router.get("/workflow-templates", getWorkflowTemplates);
router.get("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRecruitmentReadRole, getJobById);
router.get("/:id/workflow", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRecruitmentReadRole, getJobWorkflow);
router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, upload.fields([{ name: "uploadJd", maxCount: 1 }, { name: "supportingDocuments", maxCount: 1 }]), createJob);
router.put("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, upload.fields([{ name: "uploadJd", maxCount: 1 }, { name: "supportingDocuments", maxCount: 1 }]), updateJob);
router.put("/:id/publish", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, publishJob);
router.put("/:id/close", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, closeJob);
router.delete("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, deleteJob);

export default router;
