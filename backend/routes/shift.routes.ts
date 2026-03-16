import { Router } from "express";
import { createShift, getAllShifts, deleteShift, assignShift } from "../controllers/shift.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/add", protect, authorize("ADMIN", "HR_MANAGER" , "CEO"), createShift);
router.get("/all", protect, getAllShifts); 
router.delete("/:id", protect, authorize("ADMIN", "HR_MANAGER"), deleteShift);
router.put("/assign", protect, authorize("ADMIN", "HR_MANAGER"), assignShift);

export default router;