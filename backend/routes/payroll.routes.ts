import express from "express"
import { protect } from "../middleware/auth.middleware"
import { authorize, authorizeByMatrix, MODULE_KEYS } from "../middleware/role.middleware"
import {
  authorizePayrollWorkflowActor,
  authorizePayrollBankExport,
  authorizePayrollAuditRead,
  authorizePayrollComplianceRead,
} from "../middleware/payrollAccess.middleware"
import {
  generatePayroll,
  getPayrollRecords,
  updatePayrollStatus,
  patchPayrollWorkflow,
  getSalarySlip,
  downloadPayslip,
  getPendingPayroll,
  getEmployeePayrollHistory,
  getTickets,
  createTicket,
  updateTicketStatus,
  calculateIndemnity,
  getIndemnities,
  createIndemnity,
  updateIndemnityStatus,
  getPayrollSettings,
  updatePayrollSettings,
  calculatePayrollPreview,
  exportPayrollBankCsv,
  getPayrollAnalyticsSummary,
  getPayrollAuditLogs,
  getPayrollComplianceSummary,
} from "../controllers/payroll.controller"

const router = express.Router()

router.use(protect)

const payrollRead = authorizeByMatrix(MODULE_KEYS.PAYROLL, "read")
const payrollWrite = authorizeByMatrix(MODULE_KEYS.PAYROLL, "write")

const ticketRoles = [
  "HR_MANAGER",
  "HRMANAGER",
  "HR_OFFICER",
  "HROFFICER",
  "PAYROLLOFFICER",
  "PAYROLL_OFFICER",
  "FINANCE_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
  "SUPER ADMIN",
] as const

const ticketApproveRoles = [
  "HR_MANAGER",
  "HRMANAGER",
  "PAYROLLOFFICER",
  "PAYROLL_OFFICER",
  "FINANCE_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
  "SUPER ADMIN",
] as const

const slipRoles = [
  "HR_MANAGER",
  "HRMANAGER",
  "HR_OFFICER",
  "HROFFICER",
  "PAYROLLOFFICER",
  "PAYROLL_OFFICER",
  "FINANCE_MANAGER",
  "CEO",
  "COUNTRY_MANAGER",
  "DEPARTMENT_MANAGER",
  "DIRECT_MANAGER",
  "OPERATIONS_MANAGER",
  "PROJECT_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
  "SUPER ADMIN",
  "EMPLOYEE",
] as const

router.get("/settings", payrollRead, getPayrollSettings)
router.put("/settings", payrollWrite, updatePayrollSettings)
router.post("/calculate-preview", payrollWrite, calculatePayrollPreview)
router.post("/generate", payrollWrite, generatePayroll)
router.get("/analytics/summary", payrollRead, getPayrollAnalyticsSummary)
router.get("/audit-logs", payrollRead, authorizePayrollAuditRead, getPayrollAuditLogs)
router.get("/compliance/summary", payrollRead, authorizePayrollComplianceRead, getPayrollComplianceSummary)

router.get("/", payrollRead, getPayrollRecords)
router.get("/pending", payrollRead, getPendingPayroll)

router.get("/tickets", authorize(...ticketRoles), getTickets)
router.post("/tickets", authorize(...ticketRoles), createTicket)
router.patch("/tickets/:id/status", authorize(...ticketApproveRoles), updateTicketStatus)

router.post("/indemnity/calculate", authorize(...ticketRoles), calculateIndemnity)
router.get("/indemnity", authorize(...ticketRoles), getIndemnities)
router.post("/indemnity", authorize(...ticketRoles), createIndemnity)
router.patch("/indemnity/:id/status", authorize(...ticketApproveRoles), updateIndemnityStatus)

router.get(
  "/history/:userId",
  authorize(
    "HR_MANAGER",
    "HRMANAGER",
    "HR_OFFICER",
    "HROFFICER",
    "PAYROLLOFFICER",
    "PAYROLL_OFFICER",
    "FINANCE_MANAGER",
    "CEO",
    "COUNTRY_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "OPERATIONS_MANAGER",
    "PROJECT_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
    "SUPER ADMIN",
    "EMPLOYEE"
  ),
  getEmployeePayrollHistory
)

router.patch("/:id/workflow", authorizePayrollWorkflowActor, patchPayrollWorkflow)
router.patch("/:id/status", authorizePayrollWorkflowActor, updatePayrollStatus)
router.get("/:id/export/bank", authorizePayrollBankExport, exportPayrollBankCsv)

router.get("/:payrollId/slip/:employeeId", authorize(...slipRoles), getSalarySlip)
router.get("/:payrollId/download/:employeeId", authorize(...slipRoles), downloadPayslip)

export default router
