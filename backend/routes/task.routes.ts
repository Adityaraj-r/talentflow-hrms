import { Router } from "express";
import { getMyTasks, createTask } from "../controllers/task.controller";
import { protect } from "../middleware/auth.middleware"; 

const router = Router();

// Used by employees to see what's on their plate.
// The 'protect' middleware ensures we know exactly which user is calling this 
// so we can filter tasks assigned to them.
router.get("/my-tasks", protect, getMyTasks);

// Endpoint for workload distribution.
// Note: Currently, any authenticated user can create a task. 
// If you want to restrict this to only Managers/Admins, add the 'authorize' middleware here.
router.post("/create", protect, createTask);

export default router;