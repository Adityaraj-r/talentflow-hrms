import { Response } from "express"
import mongoose from "mongoose"
import { AuthRequest } from "../middleware/auth.middleware"
import Payroll, { EMPLOYEE_SLIP_VISIBLE_STATUSES, type PayrollRunStatus } from "../models/payroll.model"
import Attendance from "../models/Attendance.model"
import Ticket from "../models/ticket.model"
import Indemnity from "../models/indemnity.model"
import User from "../models/User.model"
import Employee from "../models/Employee.model"
import { generatePayslip } from "../utils/payslip.generator"
import { getOrCreatePayrollSettings } from "../models/payrollCompanySettings.model"
import {
  computeEmployeePayrollLine,
  getPeriodBounds,
  assertAttendancePeriodLocked,
  applyAdvanceTicketBalances,
} from "../services/payrollCalculation.service"
import { logPayrollAudit } from "../utils/payrollAudit.util"

const norm = (r: string) => r.toUpperCase().replace(/[\s_]/g, "")

const isPayrollOfficer = (role: string) => norm(role) === "PAYROLLOFFICER"
const isHRManager = (role: string) => norm(role) === "HRMANAGER"
const isFinanceManager = (role: string) => norm(role) === "FINANCEMANAGER"
const isCEO = (role: string) => norm(role) === "CEO"
const isAdmin = (role: string) => ["ADMIN", "SUPERADMIN"].includes(norm(role))

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const getPayrollSettings = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await getOrCreatePayrollSettings()
    res.json({ success: true, data: doc })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updatePayrollSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role || ""))
      return res.status(403).json({ success: false, error: "Only administrators can update payroll settings" })
    const doc = await getOrCreatePayrollSettings()
    const allowed = [
      "ceoApprovalThresholdTotalNet",
      "defaultMonthWorkingHours",
      "otRateMultiplier",
      "pfEmployeePercent",
      "pfWageCeiling",
      "esiEmployeePercent",
      "esiEmployerPercent",
      "esiGrossCeiling",
      "professionalTaxMonthlySlab",
      "useComputedPf",
      "useComputedEsi",
      "useComputedPt",
      "useComputedTds",
      "tdsDefaultMonthlyEstimate",
    ] as const
    const before = doc.toObject()
    for (const k of allowed) {
      if (req.body[k] !== undefined) (doc as any)[k] = req.body[k]
    }
    await doc.save()
    await logPayrollAudit({
      req,
      action: "payroll_settings_update",
      entityType: "PayrollCompanySettings",
      entityId: doc._id.toString(),
      before: before as any,
      after: doc.toObject() as any,
    })
    res.json({ success: true, data: doc })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── PREVIEW (no persist) ────────────────────────────────────────────────────

export const calculatePayrollPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, userId, adjustments } = req.body
    if (!month || !year || !userId)
      return res.status(400).json({ success: false, error: "month, year, userId required" })

    const user = await User.findById(userId).select("employeeId")
    if (!user?.employeeId)
      return res.status(400).json({ success: false, error: "User not linked to employee" })

    const employee = await Employee.findById(user.employeeId)
    if (!employee?.salary?.basic)
      return res.status(400).json({ success: false, error: "No salary structure" })

    const settings = await getOrCreatePayrollSettings()
    const period = getPeriodBounds(month, Number(year))
    const line = await computeEmployeePayrollLine({
      userId,
      employee,
      settings,
      period,
      adjustments,
    })
    res.json({ success: true, data: { line, period } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function recalcTotals(payroll: InstanceType<typeof Payroll>, settings: Awaited<ReturnType<typeof getOrCreatePayrollSettings>>) {
  payroll.totalGross = payroll.employees.reduce((s, e) => s + e.grossPay, 0)
  payroll.totalNet = payroll.employees.reduce((s, e) => s + e.netPay, 0)
  payroll.ceoApprovalRequired = payroll.totalNet > (settings.ceoApprovalThresholdTotalNet || 0)
}

// ─── GENERATE ────────────────────────────────────────────────────────────────

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || ""
    if (!isPayrollOfficer(userRole) && !isAdmin(userRole))
      return res.status(403).json({ success: false, error: "Only Payroll Officers or Admins can generate payroll" })

    const {
      month,
      year,
      employeeIds,
      adjustments = {} as Record<string, any>,
      replaceExisting = false,
      requireAttendancePeriodLocked = true,
      runKind = "regular",
      offCycleLabel,
      skipAttendanceLockCheck = false,
    } = req.body

    if (!month || !year || !employeeIds?.length)
      return res.status(400).json({ success: false, error: "month, year, employeeIds required" })

    if (runKind === "off_cycle" && !offCycleLabel)
      return res.status(400).json({ success: false, error: "offCycleLabel required for off_cycle runs" })

    const settings = await getOrCreatePayrollSettings()
    const period = getPeriodBounds(month, Number(year))

    if (requireAttendancePeriodLocked && !skipAttendanceLockCheck) {
      try {
        await assertAttendancePeriodLocked(period.startStr, period.endStr)
      } catch (e: any) {
        return res.status(400).json({ success: false, error: e.message })
      }
    }

    let existing: InstanceType<typeof Payroll> | null = null
    if (runKind === "off_cycle") {
      existing = await Payroll.findOne({ month, year, runKind: "off_cycle", offCycleLabel })
      if (existing)
        return res.status(400).json({ success: false, error: "Off-cycle payroll with this label already exists" })
    } else {
      existing = await Payroll.findOne({
        month,
        year,
        $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
      })
    }

    if (existing && replaceExisting) {
      if (existing.status !== "Generated")
        return res.status(400).json({
          success: false,
          error: "replaceExisting only allowed when status is Generated",
        })
      existing.employees = existing.employees.filter(e => !employeeIds.includes(e.employeeId))
      await existing.save()
    } else if (existing && !replaceExisting) {
      const dup = employeeIds.filter((id: string) => existing!.employees.some(e => e.employeeId === id))
      if (dup.length)
        return res.status(400).json({
          success: false,
          error: `Payroll already includes ${dup.length} employee(s). Use replaceExisting while Generated.`,
        })
    }

    const employeesPayroll: any[] = []
    const skippedDetails: { userId: string; reason: string }[] = []

    for (const userId of employeeIds) {
      const user = await User.findById(userId).select("employeeId")
      if (!user?.employeeId) {
        skippedDetails.push({ userId, reason: "No employeeId on user" })
        continue
      }
      const employee = await Employee.findById(user.employeeId)
      if (!employee?.salary?.basic) {
        skippedDetails.push({ userId, reason: "Ineligible: missing Employee.salary.basic" })
        continue
      }
      try {
        const line = await computeEmployeePayrollLine({
          userId,
          employee,
          settings,
          period,
          adjustments: adjustments[userId],
        })
        employeesPayroll.push(line)
      } catch (err: any) {
        skippedDetails.push({ userId, reason: err.message || "Calculation failed" })
      }
    }

    if (!employeesPayroll.length)
      return res.status(400).json({
        success: false,
        error: "No eligible employees processed",
        skippedDetails,
      })

    const actor = req.user?.email || req.user?.id || "system"
    const now = new Date()

    let payroll: InstanceType<typeof Payroll>
    if (existing) {
      existing.employees.push(...employeesPayroll)
      recalcTotals(existing, settings)
      if (!existing.generatedBy) existing.generatedBy = actor
      if (!existing.generatedAt) existing.generatedAt = now
      payroll = await existing.save()
    } else {
      payroll = await Payroll.create({
        month,
        year,
        runKind,
        offCycleLabel: runKind === "off_cycle" ? offCycleLabel : undefined,
        employees: employeesPayroll,
        status: "Generated",
        generatedBy: actor,
        generatedAt: now,
        totalGross: 0,
        totalNet: 0,
        ceoApprovalRequired: false,
      })
      recalcTotals(payroll, settings)
      await payroll.save()
    }

    await logPayrollAudit({
      req,
      action: "payroll_generate",
      entityType: "Payroll",
      entityId: payroll._id.toString(),
      after: { employeeCount: payroll.employees.length, totalNet: payroll.totalNet },
    })

    res.status(201).json({
      success: true,
      data: payroll,
      skippedDetails,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── PENDING (eligible only) ────────────────────────────────────────────────

export const getPendingPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toLocaleString("default", { month: "long" })
    const year = Number(req.query.year) || new Date().getFullYear()

    const users = await User.find({
      employeeId: { $ne: null },
      isDeleted: { $ne: true },
      isActive: true,
    })
      .select("_id employeeId")
      .lean()

    const empObjectIds = users
      .map(u => u.employeeId)
      .filter((id): id is mongoose.Types.ObjectId => id != null)

    const employeesWithSalary = await Employee.find({
      _id: { $in: empObjectIds },
      "salary.basic": { $gt: 0 },
    })
      .select("_id")
      .lean()

    const salaryOk = new Set(employeesWithSalary.map(e => e._id.toString()))

    const eligible: mongoose.Types.ObjectId[] = []
    const ineligible: { userId: string; reason: string }[] = []

    for (const u of users) {
      const eid = u.employeeId?.toString()
      if (eid && salaryOk.has(eid)) eligible.push(u._id as mongoose.Types.ObjectId)
      else ineligible.push({ userId: u._id.toString(), reason: "No salary.basic on Employee" })
    }

    const existing = await Payroll.findOne({
      month,
      year,
      $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
    })
      .select("employees.employeeId")
      .lean()

    const processed = new Set(existing?.employees.map(e => e.employeeId.toString()) || [])

    const pendingIds = eligible.filter(id => !processed.has(id.toString()))
    const pendingUsers = await User.find({ _id: { $in: pendingIds } })
      .select("firstName lastName email department role employeeCode")
      .lean()

    res.json({
      success: true,
      data: {
        total: pendingIds.length,
        pending: pendingUsers,
        ineligibleSample: ineligible.slice(0, 50),
        ineligibleCount: ineligible.length,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── RECORDS & ANALYTICS ─────────────────────────────────────────────────────

export const getPayrollRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (norm(req.user?.role || "") === "EMPLOYEE")
      return res.status(403).json({ success: false, error: "Employees cannot list all payroll records" })

    const { month, year, runKind } = req.query
    const filter: Record<string, unknown> = {}
    if (month) filter.month = month
    if (year) filter.year = Number(year)
    if (runKind) filter.runKind = runKind

    const records = await Payroll.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getPayrollAnalyticsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const r = norm(req.user?.role || "")
    if (!["CEO", "HRMANAGER", "FINANCEMANAGER", "ADMIN", "SUPERADMIN", "PAYROLLOFFICER"].includes(r))
      return res.status(403).json({ success: false, error: "Insufficient role for payroll analytics" })

    const year = Number(req.query.year) || new Date().getFullYear()
    const runs = await Payroll.find({ year, status: { $in: ["Disbursed", "Locked", "Paid"] } }).select(
      "month year totalGross totalNet employees status"
    )
    const byMonth = runs.map(r => ({
      month: r.month,
      year: r.year,
      totalGross: r.totalGross,
      totalNet: r.totalNet,
      headcount: r.employees?.length || 0,
      status: r.status,
    }))
    res.json({ success: true, data: { year, runs: byMonth } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── WORKFLOW ────────────────────────────────────────────────────────────────

export const patchPayrollWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { action, paymentReference, paymentMethod } = req.body
    const role = req.user?.role || ""
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    const before = { status: payroll.status, totalNet: payroll.totalNet }

    switch (action) {
      case "verify": {
        if (!isFinanceManager(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "Finance Manager or Admin only" })
        if (payroll.status !== "Generated")
          return res.status(400).json({ success: false, error: "Invalid state for verify" })
        payroll.status = "Verified"
        payroll.verifiedBy = req.user?.email
        payroll.verifiedAt = new Date()
        break
      }
      case "hr_approve": {
        if (!isHRManager(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "HR Manager or Admin only" })
        if (payroll.status !== "Verified")
          return res.status(400).json({ success: false, error: "Payroll must be Verified first" })
        for (const line of payroll.employees) {
          await applyAdvanceTicketBalances(line.advanceAllocations || [])
        }
        payroll.hrApprovedBy = req.user?.email
        payroll.hrApprovedAt = new Date()
        payroll.status = payroll.ceoApprovalRequired ? "HR_Approved" : "CEO_Approved"
        break
      }
      case "ceo_approve": {
        if (!isCEO(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "CEO or Admin only" })
        if (payroll.status !== "HR_Approved")
          return res.status(400).json({ success: false, error: "CEO approval not required or invalid state" })
        payroll.ceoApprovedBy = req.user?.email
        payroll.ceoApprovedAt = new Date()
        payroll.status = "CEO_Approved"
        break
      }
      case "disburse": {
        if (!isPayrollOfficer(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "Payroll Officer or Admin only" })
        if (payroll.status !== "CEO_Approved")
          return res.status(400).json({ success: false, error: "Must be CEO_Approved before disbursement" })
        const secret = process.env.PAYROLL_DISBURSE_SECRET
        if (secret) {
          const token = req.headers["x-payroll-disburse-confirmation"] as string
          if (!token || token !== secret)
            return res.status(403).json({
              success: false,
              error: "Disbursement confirmation required (header x-payroll-disburse-confirmation)",
            })
        }
        payroll.status = "Disbursed"
        payroll.disbursedBy = req.user?.email
        payroll.disbursedAt = new Date()
        payroll.paymentReference = paymentReference
        payroll.paymentMethod = paymentMethod || "bank_transfer"
        payroll.paymentStatus = "completed"
        break
      }
      case "lock": {
        if (!isFinanceManager(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "Finance Manager or Admin only" })
        if (payroll.status !== "Disbursed" && payroll.status !== "Paid")
          return res.status(400).json({ success: false, error: "Must be disbursed before lock" })
        payroll.status = "Locked"
        payroll.lockedBy = req.user?.email
        payroll.lockedAt = new Date()
        break
      }
      default:
        return res.status(400).json({ success: false, error: "Unknown workflow action" })
    }

    await payroll.save()
    await logPayrollAudit({
      req,
      action: `payroll_workflow_${action}`,
      entityType: "Payroll",
      entityId: payroll._id.toString(),
      before,
      after: { status: payroll.status, totalNet: payroll.totalNet },
    })

    res.json({ success: true, data: payroll })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/** Legacy PATCH /:id/status — bridges old UI to the new workflow */
export const updatePayrollStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentReference } = req.body
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    if (status === "HR Approved") {
      if (payroll.status === "Generated") {
        payroll.status = "Verified"
        payroll.verifiedBy = req.user?.email || "legacy"
        payroll.verifiedAt = new Date()
        await payroll.save()
      }
      req.body = { action: "hr_approve" }
      return patchPayrollWorkflow(req, res)
    }

    if (status === "Paid") {
      if (
        payroll.ceoApprovalRequired &&
        (payroll.status === "HR_Approved" || payroll.status === "HR Approved")
      ) {
        return res.status(400).json({
          success: false,
          error: "CEO approval required before marking paid / disbursed",
        })
      }
      if (["HR_Approved", "HR Approved", "Verified", "Generated"].includes(payroll.status)) {
        if (payroll.status !== "CEO_Approved") {
          payroll.status = "CEO_Approved"
          payroll.ceoApprovedBy = payroll.ceoApprovedBy || req.user?.email || "legacy"
          payroll.ceoApprovedAt = payroll.ceoApprovedAt || new Date()
          await payroll.save()
        }
      }
      req.body = { action: "disburse", paymentReference }
      return patchPayrollWorkflow(req, res)
    }

    return res.status(400).json({ success: false, error: "Use PATCH .../workflow or legacy HR Approved / Paid" })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── BANK CSV ────────────────────────────────────────────────────────────────

export const exportPayrollBankCsv = async (req: AuthRequest, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll)
      return res.status(404).json({ success: false, error: "Payroll not found" })
    if (!["CEO_Approved", "Disbursed", "Verified", "HR_Approved", "Generated"].includes(payroll.status))
      return res.status(400).json({ success: false, error: "Invalid status for bank export" })

    const rows: string[] = ["employeeCode,name,accountNumber,ifsc,bankName,amount,reference"]
    const ref = payroll.paymentReference || `PAY-${payroll._id}`

    for (const line of payroll.employees) {
      const user = await User.findById(line.employeeId).select("employeeId firstName lastName")
      if (!user?.employeeId) continue
      const emp = await Employee.findById(user.employeeId).select("employeeCode bankDetails firstName lastName")
      const bd = emp?.bankDetails
      const name = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : ""
      const code = emp?.employeeCode || ""
      const acct = bd?.accountNumber || ""
      const ifsc = bd?.ifscCode || ""
      const bank = (bd?.bankName || "").replace(/,/g, " ")
      rows.push(
        [code, name, acct, ifsc, bank, String(line.netPay), ref].map(f => `"${f}"`).join(",")
      )
    }

    payroll.bankExportGeneratedAt = new Date()
    await payroll.save()

    await logPayrollAudit({
      req,
      action: "payroll_bank_export",
      entityType: "Payroll",
      entityId: payroll._id.toString(),
      metadata: { rows: payroll.employees.length },
    })

    const csv = rows.join("\n")
    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename=payroll-bank-${payroll._id}.csv`)
    res.send(csv)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── SLIPS ───────────────────────────────────────────────────────────────────

const slipVisible = (status: string) =>
  EMPLOYEE_SLIP_VISIBLE_STATUSES.includes(status as PayrollRunStatus)

export const getSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId, employeeId } = req.params
    const userRole = req.user?.role?.toUpperCase() || ""
    const userId = req.user?.id

    if (userRole.replace(/ /g, "_") === "EMPLOYEE" && userId !== employeeId)
      return res.status(403).json({ success: false, error: "You can only view your own salary slip" })

    const payroll = await Payroll.findById(payrollId)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    const empNorm = userRole.replace(/ /g, "_") === "EMPLOYEE"
    if (empNorm && !slipVisible(payroll.status))
      return res.status(403).json({ success: false, error: "Payslip not yet available" })

    const emp = payroll.employees.find(e => e.employeeId === employeeId)
    if (!emp) return res.status(404).json({ success: false, error: "Employee not in this payroll" })

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

export const downloadPayslip = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId, employeeId } = req.params
    const userRole = req.user?.role?.toUpperCase() || ""
    const userId = req.user?.id

    if (userRole.replace(/ /g, "_") === "EMPLOYEE" && userId !== employeeId)
      return res.status(403).json({ success: false, error: "You can only download your own payslip" })

    const payroll = await Payroll.findById(payrollId)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    if (userRole.replace(/ /g, "_") === "EMPLOYEE" && !slipVisible(payroll.status))
      return res.status(403).json({ success: false, error: "Payslip not yet available for download" })

    const emp = payroll.employees.find(e => e.employeeId === employeeId)
    if (!emp) return res.status(404).json({ success: false, error: "Employee not found in payroll" })

    generatePayslip(res, payroll, emp as any)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getEmployeePayrollHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params
    const userRole = req.user?.role?.toUpperCase() || ""
    const requesterId = req.user?.id

    if (userRole.replace(/ /g, "_") === "EMPLOYEE" && requesterId !== userId)
      return res.status(403).json({ success: false, error: "Access denied" })

    const records = await Payroll.find({
      "employees.employeeId": userId,
      status: { $in: [...EMPLOYEE_SLIP_VISIBLE_STATUSES] },
    }).sort({ year: -1, createdAt: -1 })

    const history = records.map(r => {
      const slip = r.employees.find(e => e.employeeId === userId)
      return {
        payrollId: r._id,
        month: r.month,
        year: r.year,
        status: r.status,
        netPay: slip?.netPay || 0,
        grossPay: slip?.grossPay || 0,
        basic: slip?.earnings?.basic ?? (slip as any)?.basic,
        totalDeductions: slip?.totalDeductions ?? (slip as any)?.deductions,
      }
    })

    res.json({ success: true, data: history })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ─── TICKETS ─────────────────────────────────────────────────────────────────

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type } = req.query
    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (type) filter.type = type

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
      amount: req.body.amount ? Number(req.body.amount) : undefined,
      requestedBy: req.user?.email || "unknown",
      status: "Pending",
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
    if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found" })

    if (ticket.status !== "Pending")
      return res.status(400).json({ success: false, error: "Only pending tickets can be actioned" })

    ticket.status = status
    if (status === "Approved") {
      ticket.approvedBy = req.user?.email
      ticket.approvalDate = new Date()
      if (ticket.type === "advance" && ticket.amount != null)
        ticket.remainingAmount = Number(ticket.amount)
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

// ─── INDEMNITY (unchanged logic) ─────────────────────────────────────────────

export const calculateIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const { basicSalary, joiningDate, lastWorkingDate } = req.body

    if (!basicSalary || !joiningDate || !lastWorkingDate)
      return res.status(400).json({ success: false, error: "basicSalary, joiningDate and lastWorkingDate are required" })

    const joining = new Date(joiningDate)
    const leaving = new Date(lastWorkingDate)

    if (leaving <= joining)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const msPerYear = 1000 * 60 * 60 * 24 * 365.25
    const yearsOfService = (leaving.getTime() - joining.getTime()) / msPerYear

    let calculatedAmount = 0
    let formula = "Not eligible (< 1 year of service)"

    if (yearsOfService >= 1 && yearsOfService <= 5) {
      calculatedAmount = basicSalary * yearsOfService * 0.5
      formula = "Basic × Years × 0.5"
    } else if (yearsOfService > 5) {
      calculatedAmount = basicSalary * yearsOfService
      formula = "Basic × Years"
    }

    res.json({
      success: true,
      data: {
        yearsOfService: Math.round(yearsOfService * 100) / 100,
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
    const filter: Record<string, unknown> = {}
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

    const msPerYear = 1000 * 60 * 60 * 24 * 365.25
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
      employeeId,
      employeeName,
      joiningDate,
      lastWorkingDate,
      yearsOfService: Math.round(yearsOfService * 100) / 100,
      basicSalary: Number(basicSalary),
      calculatedAmount,
      reason,
      notes,
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
    if (!record) return res.status(404).json({ success: false, error: "Indemnity record not found" })

    if (record.status === "Paid")
      return res.status(400).json({ success: false, error: "Paid indemnities cannot be modified" })

    record.status = status
    if (status === "Approved") {
      record.approvedBy = req.user?.email
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
