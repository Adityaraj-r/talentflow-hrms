import express from "express";
import { getRecentHires } from "../controllers/employee.controller";
import { getActiveOnboarding } from "../controllers/employee.controller";
import { getEmployeeById } from "../controllers/employee.controller"
import { getManageOnboarding } from "../controllers/employee.controller"

const router = express.Router();

router.get("/recent-hires", getRecentHires);
router.get("/active-onboarding", getActiveOnboarding);
router.get("/manage-onboarding", getManageOnboarding)

router.get("/:id", getEmployeeById)


export default router;
