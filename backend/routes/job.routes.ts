import express from "express";
import {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  getPublishedJobs,
  getAllJobs,
} from "../controllers/job.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";
import { requireRecruitmentApprover, requireRecruitmentOperator, requireRecruitmentReadRole } from "../middleware/recruitmentRbac.middleware";

const router = express.Router();

router.get("/published", getPublishedJobs);

router.use(protect as any);

router.get("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), requireRecruitmentReadRole, getAllJobs);
router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, createJob);
router.put("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentOperator, updateJob);
router.put("/:id/publish", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, publishJob);
router.put("/:id/close", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), requireRecruitmentApprover, closeJob);

export default router;
