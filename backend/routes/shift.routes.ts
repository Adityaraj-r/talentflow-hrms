import { Router } from "express";
import {
  createShift,
  getAllShifts,
  updateShift,
  deleteShift,
  assignShift,
} from "../controllers/shift.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.get("/all", protect, getAllShifts);

router.post(
  "/add",
  protect,
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  createShift
);

router.put(
  "/assign",
  protect,
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"),
  assignShift
);

router.put(
  "/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  updateShift
);

router.delete(
  "/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER"),
  deleteShift
);

export default router;