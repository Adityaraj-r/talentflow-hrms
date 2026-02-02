import { Router } from "express";
import { createShift, getAllShifts, deleteShift, assignShift } from "../controllers/shift.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

// Only Admin/HR can manage shifts
router.post("/add", protect, authorize("ADMIN", "HR_MANAGER"), createShift);
router.get("/all", protect, getAllShifts); // Employees might need to see shifts too
router.delete("/:id", protect, authorize("ADMIN", "HR_MANAGER"), deleteShift);
//  Add this NEW Route
router.put("/assign", protect, authorize("ADMIN", "HR_MANAGER"), assignShift);

export default router;