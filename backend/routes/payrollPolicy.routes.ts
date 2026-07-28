import express from "express"
import { protect, authorize } from "../middleware/auth.middleware"
import {
  createPolicyVersion,
  getPolicies,
  deactivatePolicy,
  updatePayrollPolicy
} from "../controllers/payrollPolicy.controller"

const router = express.Router()

router.use(protect)

const policyAdminRoles = ["ADMIN", "SUPER_ADMIN", "SUPER ADMIN"] as const

router.get("/payroll-policies", authorize(...policyAdminRoles), getPolicies)
router.post("/payroll-policies", authorize(...policyAdminRoles), createPolicyVersion)
router.patch("/payroll-policies/:id/deactivate", authorize(...policyAdminRoles), deactivatePolicy)
router.put(
    "/payroll-policies/:id",
    updatePayrollPolicy
);

export default router