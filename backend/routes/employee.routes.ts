import express from "express";
import {
  getAllEmployees,
  getRecentHires,
  getActiveOnboarding,
  getEmployeeById,
  getManageOnboarding,
  offboardEmployee,
  getMyDocuments,
  getEmployeeDirectory
} from "../controllers/employee.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

const allowRoles =
  (...roles: string[]) =>
  (req: any, res: any, next: any) => {
    if (roles.includes(req.user?.role)) return next();
    return res.status(403).json({ success: false, error: "Access denied" });
  };

router.get(
  "/directory",
  protect,
  allowRoles("ADMIN", "HR_MANAGER", "HR_OFFICER", "CEO", "COUNTRY_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"),
  getEmployeeDirectory
);

router.get(
  "/",
  protect,
  allowRoles("ADMIN", "HR_MANAGER", "HR_OFFICER", "CEO", "COUNTRY_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"),
  getAllEmployees
);

router.get(
  "/recent-hires",
  protect,
  allowRoles("ADMIN", "HR_MANAGER", "CEO"),
  getRecentHires
);

router.get(
  "/active-onboarding",
  protect,
  allowRoles("ADMIN", "HR_MANAGER", "HR_OFFICER"),
  getActiveOnboarding
);

router.get(
  "/manage-onboarding",
  protect,
  allowRoles("ADMIN", "HR_MANAGER", "HR_OFFICER"),
  getManageOnboarding
);

router.get(
  "/my-documents",
  protect,
  getMyDocuments
);

router.get(
  "/:id",
  protect,
  allowRoles("ADMIN", 
    "HR_MANAGER", 
    "HR_OFFICER", 
    "CEO", 
    "COUNTRY_MANAGER", 
    "DEPARTMENT_MANAGER", 
    "DIRECT_MANAGER", 
    "PROJECT_MANAGER", 
    "PAYROLL_OFFICER",
    "FINANCE_MANAGER",
    "EMPLOYEE"),
  getEmployeeById
);

router.post(
  "/:id/offboard",
  protect,
  allowRoles("ADMIN","HR_MANAGER"),
  offboardEmployee
);

export default router;