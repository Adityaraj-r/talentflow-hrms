import express from "express";
import { syncDepartmentsFromUsers } from "../controllers/departmentSyncController";
import { protect } from "../middleware/auth.middleware";
import { authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware";
const router = express.Router();

router.use(protect);
router.post(
  "/sync-from-users",
  authorizeByMatrix(MODULE_KEYS.SETTINGS, "write"),
  syncDepartmentsFromUsers
);

export default router;
