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

router.post("/", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, createJob);
router.put("/:id", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, updateJob);
router.put("/:id/publish", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, publishJob);
router.put("/:id/close", authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "write"), denyOperationsManager, denyExecutiveReadOnly, closeJob);

export default router;
