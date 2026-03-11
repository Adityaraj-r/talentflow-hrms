import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import Payroll from "../models/payroll.model"
import Attendance from "../models/Attendance.model"
import Ticket from "../models/ticket.model"
import Indemnity from "../models/indemnity.model"
import User from "../models/User.model"
import Employee from "../models/Employee.model"
import { generatePayslip } from "../utils/payslip.generator"

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PAYROLL_OFFICER_ROLES = ["PAYROLL_OFFICER", "PAYROLLOFFICER"]
const HR_ROLES              = ["HR_MANAGER", "HRMANAGER", "HR_OFFICER", "HROFFICER"]

const isPayrollOfficer = (role: string) =>
  PAYROLL_OFFICER_ROLES.includes(role.toUpperCase().replace(/ /g, "_"))

const isHRManager = (role: string) =>
  ["HR_MANAGER", "HRMANAGER"].includes(role.toUpperCase().replace(/ /g, "_"))

// ─── BULK PAYROLL RUN ────────────────────────────────────────────────────────

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || ""
    if (!isPayrollOfficer(userRole))
      return res.status(403).json({ success: false, error: "Only Payroll Officers can generate payroll" })

    const { month, year, employeeIds } = req.body

    if (!month || !year || !employeeIds?.length)
      return res.status(400).json({ success: false, error: "month, year, employeeIds required" })

    // ── Check for existing payroll this month ────────────────────────────────
    const existing = await Payroll.findOne({ month, year })
    if (existing) {
      const alreadyProcessed = employeeIds.filter((id: string) =>
        existing.employees.some(e => e.employeeId === id)
      )
      if (alreadyProcessed.length > 0)
        return res.status(400).json({
          success: false,
          error: `Payroll already generated for ${alreadyProcessed.length} employee(s) this month`,
        })
    }

    const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
    const startDate  = new Date(year, monthIndex, 1)
    const endDate    = new Date(year, monthIndex + 1, 0)
    const totalDays  = endDate.getDate()
    const startStr   = startDate.toISOString().split("T")[0]
    const endStr     = endDate.toISOString().split("T")[0]

    const employeesPayroll: any[] = []
    const skipped: string[]       = []

    for (const userId of employeeIds) {
      const user = await User.findById(userId).select("employeeId firstName lastName email")
      if (!user) { skipped.push(userId); continue }

      // ── Fetch from SalaryStructure collection directly ───────────────────
      const employee = await Employee.findById(user.employeeId).select("salary employeeCode")
      if (!employee?.salary?.basic) { skipped.push(userId); continue }

      const basic      = Number(employee.salary.basic)                   || 0
      const hra        = Number(employee.salary.allowances?.hra)         || 0
      const transport  = Number(employee.salary.allowances?.transport)   || 0
      const medical    = Number(employee.salary.allowances?.medical)     || 0
      const otherAllow = Number(employee.salary.allowances?.other)       || 0
      const pf         = Number(employee.salary.deductions?.pf)          || 0
      const tax        = Number(employee.salary.deductions?.tax)         || 0
      const insurance  = Number(employee.salary.deductions?.insurance)   || 0

      // ── LOP from Attendance ──────────────────────────────────────────────
      const halfDayCount = await Attendance.countDocuments({
        userId, status: "Half Day",
        date: { $gte: startStr, $lte: endStr },
      })
      const absentCount = await Attendance.countDocuments({
        userId, status: "Absent",
        date: { $gte: startStr, $lte: endStr },
      })

      const lopDays    = absentCount + halfDayCount * 0.5
      const perDay     = basic / totalDays
      const lopDed     = lopDays * perDay
      const deductions = pf + tax + insurance + lopDed
      const netPay     = basic + hra + transport + medical + otherAllow - deductions

      employeesPayroll.push({
        employeeId:  userId,
        basic,
        hra,
        allowances:  transport + medical + otherAllow,
        bonus:       0,
        deductions:  Math.round(deductions),
        lopDays,
        netPay:      Math.round(netPay),
      })
    }

    if (employeesPayroll.length === 0)
      return res.status(400).json({
        success: false,
        error: "No valid employees with salary structure found",
        skipped,
      })

    // ── Upsert — append to existing month record or create new ───────────────
    let payroll
    if (existing) {
      existing.employees.push(...employeesPayroll)
      payroll = await existing.save()
    } else {
      payroll = await Payroll.create({
        month, year,
        employees: employeesPayroll,
        status: "Generated",
      })
    }

    res.status(201).json({ success: true, data: payroll, skipped })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── PENDING PAYROLL THIS MONTH ───────────────────────────────────────────────
// Returns employees who have a salary structure but NO payroll record this month

export const getPendingPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toLocaleString("default", { month: "long" })
    const year  = Number(req.query.year)      || new Date().getFullYear()

    // All users with a salary structure
    const usersWithSalary = await User.find({
      employeeId: { $ne: null },
      isDeleted:  { $ne: true },
      isActive:   true,
    }).select("_id")
    const allUserIds = usersWithSalary.map(u => u._id.toString())

    // Users already in this month's payroll
    const existing = await Payroll.findOne({ month, year })
    const processedIds = existing
      ? existing.employees.map(e => e.employeeId.toString())
      : []

    // Pending = have salary structure but NOT yet in payroll
    const pendingIds = allUserIds.filter(id => !processedIds.includes(id))

    const pendingUsers = await User.find({ _id: { $in: pendingIds } })
      .select("firstName lastName email department role employeeCode")

    res.json({
      success: true,
      data: {
        total:   pendingIds.length,
        pending: pendingUsers,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── GET PAYROLL RECORDS ──────────────────────────────────────────────────────

export const getPayrollRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query
    const filter: any = {}
    if (month) filter.month = month
    if (year)  filter.year  = Number(year)

    const records = await Payroll.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────

export const updatePayrollStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body
    const userRole   = (req.user?.role || "").toUpperCase().replace(/ /g, "_")

    const payroll = await Payroll.findById(req.params.id)
    if (!payroll)
      return res.status(404).json({ success: false, error: "Payroll not found" })

    // ── Role-based transition guard ──────────────────────────────────────────
    if (status === "HR Approved") {
      if (!isHRManager(userRole))
        return res.status(403).json({ success: false, error: "Only HR Manager can approve payroll" })
      if (payroll.status !== "Generated")
        return res.status(400).json({ success: false, error: "Only Generated payroll can be approved" })
    }

    if (status === "Paid") {
      if (!isPayrollOfficer(userRole))
        return res.status(403).json({ success: false, error: "Only Payroll Officer can mark as Paid" })
      if (payroll.status !== "HR Approved")
        return res.status(400).json({ success: false, error: "Payroll must be HR Approved before marking Paid" })
    }

    payroll.status = status
    await payroll.save()
    res.json({ success: true, data: payroll })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── GET SALARY SLIP ──────────────────────────────────────────────────────────

export const getSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId, employeeId } = req.params
    const userRole = req.user?.role?.toUpperCase() || ""
    const userId   = req.user?.id

    if (userRole === "EMPLOYEE" && userId !== employeeId)
      return res.status(403).json({ success: false, error: "You can only view your own salary slip" })

    const payroll = await Payroll.findById(payrollId)
    if (!payroll)
      return res.status(404).json({ success: false, error: "Payroll not found" })

    // Employees can only see slip after HR Approved or Paid
    if (userRole === "EMPLOYEE" && !["HR Approved", "Paid"].includes(payroll.status))
      return res.status(403).json({ success: false, error: "Payslip not yet available" })

    const emp = payroll.employees.find(e => e.employeeId === employeeId)
    if (!emp)
      return res.status(404).json({ success: false, error: "Employee not in this payroll" })

    res.json({
      success: true,
      data: {
        payroll: { month: payroll.month, year: payroll.year, status: payroll.status },
        slip: emp,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── DOWNLOAD PAYSLIP ─────────────────────────────────────────────────────────

export const downloadPayslip = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId, employeeId } = req.params
    const userRole = req.user?.role?.toUpperCase() || ""
    const userId   = req.user?.id

    if (userRole === "EMPLOYEE" && userId !== employeeId)
      return res.status(403).json({ success: false, error: "You can only download your own payslip" })

    const payroll = await Payroll.findById(payrollId)
    if (!payroll)
      return res.status(404).json({ success: false, error: "Payroll not found" })

    // Employees can only download after HR Approved or Paid
    if (userRole === "EMPLOYEE" && !["HR Approved", "Paid"].includes(payroll.status))
      return res.status(403).json({ success: false, error: "Payslip not yet available for download" })

    const emp = payroll.employees.find(e => e.employeeId === employeeId)
    if (!emp)
      return res.status(404).json({ success: false, error: "Employee not found in payroll" })

    generatePayslip(res, payroll, emp)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── PAYROLL HISTORY FOR ONE EMPLOYEE ────────────────────────────────────────

export const getEmployeePayrollHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params
    const userRole   = req.user?.role?.toUpperCase() || ""
    const requesterId = req.user?.id

    // Employees can only view their own history
    if (userRole === "EMPLOYEE" && requesterId !== userId)
      return res.status(403).json({ success: false, error: "Access denied" })

    const records = await Payroll.find({
      "employees.employeeId": userId,
      status: { $in: ["HR Approved", "Paid"] },  // only show approved/paid to employee
    }).sort({ year: -1, createdAt: -1 })

    const history = records.map(r => {
      const slip = r.employees.find(e => e.employeeId === userId)
      return {
        payrollId: r._id,
        month:     r.month,
        year:      r.year,
        status:    r.status,
        netPay:    slip?.netPay || 0,
        basic:     slip?.basic  || 0,
        deductions: slip?.deductions || 0,
      }
    })

    res.json({ success: true, data: history })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type } = req.query
    const filter: any = {}
    if (status) filter.status = status
    if (type)   filter.type   = type

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: tickets })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, employeeName, type, reason } = req.body

    if (!employeeId || !employeeName || !type || !reason)
      return res.status(400).json({ success: false, error: "employeeId, employeeName, type and reason are required" })

    if (type === "advance" && !req.body.amount)
      return res.status(400).json({ success: false, error: "Amount is required for salary advances" })

    if (type === "travel" && (!req.body.destination || !req.body.departureDate))
      return res.status(400).json({ success: false, error: "Destination and departure date are required for travel tickets" })

    const ticket = await Ticket.create({
      ...req.body,
      amount:      req.body.amount ? Number(req.body.amount) : undefined,
      requestedBy: req.user?.email || "unknown",
      status:      "Pending",
    })

    res.status(201).json({ success: true, data: ticket })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = req.body

    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ success: false, error: "Status must be Approved or Rejected" })

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket)
      return res.status(404).json({ success: false, error: "Ticket not found" })

    if (ticket.status !== "Pending")
      return res.status(400).json({ success: false, error: "Only pending tickets can be actioned" })

    ticket.status = status
    if (status === "Approved") {
      ticket.approvedBy   = req.user?.email
      ticket.approvalDate = new Date()
    }
    if (status === "Rejected") {
      if (!rejectionReason)
        return res.status(400).json({ success: false, error: "Rejection reason is required" })
      ticket.rejectionReason = rejectionReason
    }

    await ticket.save()
    res.json({ success: true, data: ticket })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── INDEMNITY ────────────────────────────────────────────────────────────────

export const calculateIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const { basicSalary, joiningDate, lastWorkingDate } = req.body

    if (!basicSalary || !joiningDate || !lastWorkingDate)
      return res.status(400).json({ success: false, error: "basicSalary, joiningDate and lastWorkingDate are required" })

    const joining  = new Date(joiningDate)
    const leaving  = new Date(lastWorkingDate)

    if (leaving <= joining)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const msPerYear      = 1000 * 60 * 60 * 24 * 365.25
    const yearsOfService = (leaving.getTime() - joining.getTime()) / msPerYear

    let calculatedAmount = 0
    let formula          = "Not eligible (< 1 year of service)"

    if (yearsOfService >= 1 && yearsOfService <= 5) {
      calculatedAmount = basicSalary * yearsOfService * 0.5
      formula          = "Basic × Years × 0.5"
    } else if (yearsOfService > 5) {
      calculatedAmount = basicSalary * yearsOfService
      formula          = "Basic × Years"
    }

    res.json({
      success: true,
      data: {
        yearsOfService:   Math.round(yearsOfService * 100) / 100,
        calculatedAmount: Math.round(calculatedAmount),
        breakdown: { basicSalary, formula },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getIndemnities = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query
    const filter: any = {}
    if (status) filter.status = status

    const records = await Indemnity.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const createIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, employeeName, joiningDate, lastWorkingDate, basicSalary, reason, notes } = req.body

    if (!employeeId || !employeeName || !joiningDate || !lastWorkingDate || !basicSalary || !reason)
      return res.status(400).json({ success: false, error: "All required fields must be provided" })

    const joining = new Date(joiningDate)
    const leaving = new Date(lastWorkingDate)

    if (leaving <= joining)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const msPerYear      = 1000 * 60 * 60 * 24 * 365.25
    const yearsOfService = (leaving.getTime() - joining.getTime()) / msPerYear

    let calculatedAmount = 0
    if (yearsOfService >= 1 && yearsOfService <= 5) {
      calculatedAmount = Math.round(Number(basicSalary) * yearsOfService * 0.5)
    } else if (yearsOfService > 5) {
      calculatedAmount = Math.round(Number(basicSalary) * yearsOfService)
    }

    const existingRecord = await Indemnity.findOne({ employeeId, status: { $in: ["Pending", "Approved"] } })
    if (existingRecord)
      return res.status(400).json({ success: false, error: "An active indemnity record already exists for this employee" })

    const record = await Indemnity.create({
      employeeId, employeeName, joiningDate, lastWorkingDate,
      yearsOfService:   Math.round(yearsOfService * 100) / 100,
      basicSalary:      Number(basicSalary),
      calculatedAmount,
      reason, notes,
      requestedBy: req.user?.email || "unknown",
    })

    res.status(201).json({ success: true, data: record })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateIndemnityStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    if (!["Approved", "Rejected", "Paid"].includes(status))
      return res.status(400).json({ success: false, error: "Status must be Approved, Rejected or Paid" })

    const record = await Indemnity.findById(req.params.id)
    if (!record)
      return res.status(404).json({ success: false, error: "Indemnity record not found" })

    if (record.status === "Paid")
      return res.status(400).json({ success: false, error: "Paid indemnities cannot be modified" })

    record.status = status
    if (status === "Approved") {
      record.approvedBy   = req.user?.email
      record.approvalDate = new Date()
    }
    if (status === "Paid") {
      record.paymentDate = new Date()
    }

    await record.save()
    res.json({ success: true, data: record })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}
