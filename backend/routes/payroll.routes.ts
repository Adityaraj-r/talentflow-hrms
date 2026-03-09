import express from "express"
import { protect } from "../middleware/auth.middleware"
import { authorize } from "../middleware/role.middleware"
import {
  generatePayroll,
  getPayrollRecords,
  updatePayrollStatus,
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
} from "../controllers/payroll.controller"

const router = express.Router()

router.use(protect)

// ── Payroll ───────────────────────────────────────────────────────────────────
router.post("/generate",
  authorize("PAYROLLOFFICER", "PAYROLL_OFFICER"),
  generatePayroll
)

router.get("/",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  getPayrollRecords
)

router.get("/pending",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  getPendingPayroll
)

// Payroll history for a specific employee
router.get("/history/:userId",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER", "EMPLOYEE"),
  getEmployeePayrollHistory
)

router.patch("/:id/status",
  authorize("HR_MANAGER", "HRMANAGER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  updatePayrollStatus
)

router.get("/:payrollId/slip/:employeeId",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER", "EMPLOYEE"),
  getSalarySlip
)

router.get("/:payrollId/download/:employeeId",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER", "EMPLOYEE"),
  downloadPayslip
)


router.get("/tickets",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  getTickets
)
router.post("/tickets",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  createTicket
)
router.patch("/tickets/:id/status",
  authorize("HR_MANAGER", "HRMANAGER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  updateTicketStatus
)


router.post("/indemnity/calculate",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  calculateIndemnity
)
router.get("/indemnity",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  getIndemnities
)
router.post("/indemnity",
  authorize("HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  createIndemnity
)

router.patch("/indemnity/:id/status",
  authorize("HR_MANAGER", "HRMANAGER", "PAYROLLOFFICER", "PAYROLL_OFFICER"),
  updateIndemnityStatus
)

export default router
