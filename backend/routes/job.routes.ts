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

const router = express.Router();

router.get("/published", getPublishedJobs);

router.use(protect as any);

router.get("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read"), getAllJobs);
router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), createJob);
router.put("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), updateJob);
router.put("/:id/publish", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), publishJob);
router.put("/:id/close", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), closeJob);

export default router;
