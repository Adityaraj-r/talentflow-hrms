import express from "express";
import { syncDepartmentsFromUsers } from "../controllers/departmentSyncController";
import { protect } from "../middleware/auth.middleware";
const router = express.Router();

router.use(protect);
router.post("/sync-from-users", syncDepartmentsFromUsers);

export default router;
