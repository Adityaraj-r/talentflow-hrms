import { Router } from "express";
import {
  getMyTasks,
  getAllTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskAnalytics,
  getAssignableUsers,
} from "../controllers/task.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(protect);

router.get(
  "/my-tasks",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "FINANCE_MANAGER",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "PAYROLL_OFFICER",
    "PROJECT_MANAGER",
    "OPERATIONS_MANAGER",
    "EMPLOYEE"
  ),
  getMyTasks
);

router.get(
  "/",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  getAllTasks
);

router.post(
  "/",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  createTask
);

router.get(
  "/analytics",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "CEO",
    "COUNTRY_MANAGER",
    "HR_MANAGER",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  getTaskAnalytics
);

router.get(
  "/assignable-users",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  getAssignableUsers
);

router.patch(
  "/:id/status",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "FINANCE_MANAGER",
    "PAYROLL_OFFICER",
    "OPERATIONS_MANAGER",
    "EMPLOYEE"
  ),
  updateTaskStatus
);

router.patch(
  "/:id",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  updateTask
);

router.delete(
  "/:id",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER"
  ),
  deleteTask
);

export default router;