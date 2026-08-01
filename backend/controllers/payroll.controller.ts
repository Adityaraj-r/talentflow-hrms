import { Response } from "express"
import mongoose from "mongoose"
import { AuthRequest } from "../middleware/auth.middleware"
import Payroll, { EMPLOYEE_SLIP_VISIBLE_STATUSES, type PayrollRunStatus } from "../models/payroll.model"
import Attendance from "../models/Attendance.model"
import Ticket from "../models/ticket.model"
import Indemnity from "../models/indemnity.model"
import User from "../models/User.model"
import Employee from "../models/Employee.model"
import Settings from "../models/Settings.model"
import { getActivePolicy, calculateSlabTax } from '../services/payrollPolicy.service';
import { generatePayslip, computePayslipYearToDate } from "../utils/payslip.generator"
import { getOrCreatePayrollSettings } from "../models/payrollCompanySettings.model"
import {
  computeEmployeePayrollLine,
  getPeriodBounds,
  getAttendanceLockStatus,
  applyAdvanceTicketBalances,
  markPerformanceBonusPaid,   // NEW
} from "../services/payrollCalculation.service"
import { logPayrollAudit } from "../utils/payrollAudit.util"
import PayrollAuditLog from "../models/payrollAuditLog.model"
import {
  isTeamPayrollViewerRole,
  getPayrollTeamUserIdStrings,
  filterPayrollLeanDocForTeam,
} from "../utils/payrollTeamScope.util"

const norm = (r: string) => r.toUpperCase().replace(/[\s_]/g, "")

const isPayrollOfficer = (role: string) => norm(role) === "PAYROLLOFFICER"
const isHRManager = (role: string) => norm(role) === "HRMANAGER"
const isFinanceManager = (role: string) => norm(role) === "FINANCEMANAGER"
const isCEO = (role: string) => norm(role) === "CEO"
const isAdmin = (role: string) => ["ADMIN", "SUPERADMIN"].includes(norm(role))

const canProcessPayroll = (role: string) =>
  isPayrollOfficer(role) || isAdmin(role)

function assertAdminDualControl(
  payroll: { generatedBy?: string },
  req: AuthRequest,
  action: string
): string | null {
  const dual = new Set(["verify", "hr_approve", "ceo_approve", "disburse", "lock", "reject"])
  if (!dual.has(action) || !isAdmin(req.user?.role || "")) return null
  const gen = String(payroll.generatedBy || "").trim().toLowerCase()
  const em = String(req.user?.email || "").trim().toLowerCase()
  if (gen && em && gen === em)
    return "Dual control: the same account cannot generate and approve or disburse this payroll run"
  return null
}

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

export const calculatePayrollPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, userId, adjustments } = req.body
    if (!month || !year || !userId)
      return res.status(400).json({ success: false, error: "month, year, userId required" })

    if (!canProcessPayroll(req.user?.role || ""))
      return res.status(403).json({ success: false, error: "Not allowed to run payroll calculations" })

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

function recalcTotals(
  payroll: InstanceType<typeof Payroll>,
  settings: Awaited<ReturnType<typeof getOrCreatePayrollSettings>>
) {
  payroll.totalGross = payroll.employees.reduce(
    (s, e) => s + e.grossPay,
    0
  )

  payroll.totalNet = payroll.employees.reduce(
    (s, e) => s + e.netPay,
    0
  )

  // CEO approval is mandatory for every payroll run
  payroll.ceoApprovalRequired = true

  // Finance approval is required only when payroll has more than 10 employees
  payroll.financeApprovalRequired = payroll.employees.length > 10
}

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  let regenerationPayroll: InstanceType<typeof Payroll> | null = null
  try {
    const userRole = req.user?.role || ""
    if (!canProcessPayroll(userRole))
      return res.status(403).json({
        success: false,
        error: "Only Payroll Officers or Admins can generate payroll"
      })

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
    if (
      replaceExisting &&
      !isPayrollOfficer(userRole) &&
      !isAdmin(userRole)
    ) {
      return res.status(403).json({
        success: false,
        error: "Only Payroll Officers or Admins can regenerate payroll",
      });
    }
    if (!month || !year || !employeeIds?.length)
      return res.status(400).json({ success: false, error: "month, year, employeeIds required" })

    if (runKind === "off_cycle" && !offCycleLabel)
      return res.status(400).json({ success: false, error: "offCycleLabel required for off_cycle runs" })

    const settings = await getOrCreatePayrollSettings()
    const period = getPeriodBounds(month, Number(year))

    if (requireAttendancePeriodLocked && !skipAttendanceLockCheck) {
      const lockStatus = await getAttendanceLockStatus(period.startStr, period.endStr)
      if (lockStatus.total > 0 && lockStatus.locked !== lockStatus.total) {
        return res.status(400).json({
          success: false,
          error: `Attendance lock required: ${lockStatus.unlocked} of ${lockStatus.total} attendance row(s) are not locked (${lockStatus.locked} locked). Lock all attendance for ${period.month} ${period.year} in the Attendance module, then run payroll again. Use "Skip attendance lock check" only when appropriate.`,
          code: "PAYROLL_LOCK",
          payrollLock: {
            periodStart: period.startStr,
            periodEnd: period.endStr,
            month: period.month,
            year: period.year,
            totalRows: lockStatus.total,
            lockedRows: lockStatus.locked,
            unlockedRows: lockStatus.unlocked,
            sampleUnlockedDates: lockStatus.sampleUnlockedDates,
          },
        })
      }
    }

    let existing: InstanceType<typeof Payroll> | null = null
    if (runKind === "off_cycle") {
      existing = await Payroll.findOne({
        month,
        year,
        runKind: "off_cycle",
        offCycleLabel,
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Off-cycle payroll with this label already exists",
        })
      }
    } else {
      existing = await Payroll.findOne({
        month,
        year,
        $or: [
          { runKind: "regular" },
          { runKind: { $exists: false } },
        ],
      })
    }

    if (existing && replaceExisting) {
      if (existing.status !== "Generated") {
        return res.status(400).json({
          success: false,
          error: "replaceExisting only allowed when status is Generated",
        })
      }

      const lockedPayroll = await Payroll.findOneAndUpdate(
        {
          _id: existing._id,
          status: "Generated",
          regenerationInProgress: { $ne: true },
        },
        {
          $set: {
            regenerationInProgress: true,
          },
        },
        {
          new: true,
        }
      )

      if (!lockedPayroll) {
        return res.status(409).json({
          success: false,
          error: "Payroll regeneration is already in progress",
        })
      }

      existing = lockedPayroll
      existing.employees = existing.employees.filter(
        e => !employeeIds.includes(e.employeeId)
      )

      existing.rejectionReason = undefined
      existing.rejectedBy = undefined
      existing.rejectedAt = undefined
      existing.rejectedAtStage = undefined

      await existing.save()
      regenerationPayroll = existing
    } else if (existing && !replaceExisting) {
      if (existing.status !== "Generated")
        return res.status(400).json({
          success: false,
          error: `Cannot add employees to this payroll run — it has already moved to "${existing.status}". Use an off-cycle run for late additions instead.`,
        })
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

    if (!employeesPayroll.length) {
      if (regenerationPayroll) {
        regenerationPayroll.regenerationInProgress = false
        await regenerationPayroll.save()
      }

      return res.status(400).json({
        success: false,
        error: "No eligible employees processed",
        skippedDetails,
      })
    }

    const actor = req.user?.email || req.user?.id || "system"
    const now = new Date()

    let payroll: InstanceType<typeof Payroll>
    if (existing) {
      // Employees selected for regeneration were already removed above.
      // Append the newly calculated payroll records.
      existing.employees.push(...employeesPayroll)

      existing.status = "Generated"

      existing.rejectionReason = undefined
      existing.rejectedBy = undefined
      existing.rejectedAt = undefined
      existing.rejectedAtStage = undefined

      recalcTotals(existing, settings)

      existing.generatedBy = actor
      existing.generatedAt = now
      existing.regenerationInProgress = false

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

    for (const line of employeesPayroll) {
      if (Number(line.earnings?.performanceBonus) > 0) {
        await markPerformanceBonusPaid(line.employeeId, payroll._id.toString())
      }
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
    if (regenerationPayroll) {
      regenerationPayroll.regenerationInProgress = false
      await regenerationPayroll.save()
    }

    res.status(500).json({
      success: false,
      error: err.message,
    })
  }
}

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
    let pendingUsers = await User.find({ _id: { $in: pendingIds } })
      .select("firstName lastName email department role employeeCode")
      .lean()

    if (req.user && isTeamPayrollViewerRole(req.user.role)) {
      const allowed = await getPayrollTeamUserIdStrings({
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        department: req.user.department,
      })
      pendingUsers = pendingUsers.filter(u => allowed.has(String(u._id)))
    }

    res.json({
      success: true,
      data: {
        total: pendingUsers.length,
        pending: pendingUsers,
        ineligibleSample: ineligible.slice(0, 50),
        ineligibleCount: ineligible.length,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getPayrollRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (norm(req.user?.role || "") === "EMPLOYEE")
      return res.status(403).json({ success: false, error: "Employees cannot list all payroll records" })

    const { month, year, runKind } = req.query
    const filter: Record<string, unknown> = {}
    if (month) filter.month = month
    if (year) filter.year = Number(year)
    if (runKind) filter.runKind = runKind

    let records = await Payroll.find(filter).sort({ createdAt: -1 }).lean()

    if (req.user && isTeamPayrollViewerRole(req.user.role)) {
      const allowed = await getPayrollTeamUserIdStrings({
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        department: req.user.department,
      })
      const filtered: typeof records = []
      for (const doc of records) {
        const next = filterPayrollLeanDocForTeam(doc as never, allowed)
        if (next) filtered.push(next as unknown as (typeof records)[0])
      }
      records = filtered
    }

    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getPayrollAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const skip = Math.max(0, Number(req.query.skip) || 0)
    const logs = await PayrollAuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    res.json({ success: true, data: logs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getPayrollComplianceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const month =
      (req.query.month as string) || new Date().toLocaleString("default", { month: "long" })
    const year = Number(req.query.year) || new Date().getFullYear()
    const runs = await Payroll.find({
      month,
      year,
      status: { $in: ["Disbursed", "Locked", "Paid"] },
      $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
    }).lean()

    let pf = 0
    let esi = 0
    let tds = 0
    let pt = 0
    let headcount = 0
    for (const r of runs) {
      for (const e of r.employees || []) {
        headcount += 1
        pf += Number((e as { deductions?: { pf?: number } }).deductions?.pf) || 0
        esi += Number((e as { deductions?: { esi?: number } }).deductions?.esi) || 0
        tds += Number((e as { deductions?: { tds?: number } }).deductions?.tds) || 0
        pt += Number((e as { deductions?: { pt?: number } }).deductions?.pt) || 0
      }
    }

    res.json({
      success: true,
      data: {
        month,
        year,
        runs: runs.length,
        employeeLines: headcount,
        totals: { pf, esi, tds, pt, statutory: pf + esi + tds + pt },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getPayrollAnalyticsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const r = norm(req.user?.role || "")
    if (
      ![
        "CEO",
        "HRMANAGER",
        "FINANCEMANAGER",
        "ADMIN",
        "SUPERADMIN",
        "PAYROLLOFFICER",
        "COUNTRYMANAGER",
      ].includes(r)
    )
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

export const patchPayrollWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { action, paymentReference, paymentMethod } = req.body
    const role = req.user?.role || ""
    if (!action || typeof action !== "string")
      return res.status(400).json({ success: false, error: "action required" })

    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    const dualErr = assertAdminDualControl(payroll, req, action)
    if (dualErr) return res.status(403).json({ success: false, error: dualErr })

    const before = { status: payroll.status, totalNet: payroll.totalNet }

    switch (action) {
      case "verify": {
        if (payroll.rejectionReason) {
          return res.status(400).json({
            success: false,
            error: "Payroll must be regenerated before verification."
          })
        }
        if (!isFinanceManager(role) && !isAdmin(role))
          return res.status(403).json({ success: false, error: "Finance Manager or Admin only" })
        if (payroll.status !== "Generated")
          return res.status(400).json({ success: false, error: "Invalid state for verify" })
        payroll.status = "Verified"
        payroll.verifiedBy = req.user?.email
        payroll.verifiedAt = new Date()
        break
      }
      // NEW:
      case "hr_approve": {
        if (!isHRManager(role) && !isAdmin(role))
          return res.status(403).json({
            success: false,
            error: "HR Manager or Admin only"
          })

        if (
          payroll.financeApprovalRequired &&
          payroll.status !== "Verified"
        )
          return res.status(400).json({
            success: false,
            error:
              "Payroll must be Verified by Finance Manager first (run has more than 10 employees)"
          })

        if (
          !payroll.financeApprovalRequired &&
          !["Generated", "Verified"].includes(payroll.status)
        )
          return res.status(400).json({
            success: false,
            error: "Invalid state for HR approval"
          })


        payroll.hrApprovedBy = req.user?.email
        payroll.hrApprovedAt = new Date()

        // CEO approval is mandatory for every payroll run
        payroll.status = "HR_Approved"

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
        if (!isPayrollOfficer(role) && !isFinanceManager(role) && !isAdmin(role))
          return res.status(403).json({
            success: false,
            error: "Finance Manager, Payroll Officer, or Admin only",
          })

        if (payroll.status !== "CEO_Approved")
          return res.status(400).json({
            success: false,
            error: "Must be CEO_Approved before disbursement"
          })

        const secret = process.env.PAYROLL_DISBURSE_SECRET

        if (secret) {
          const token = req.headers["x-payroll-disburse-confirmation"] as string

          if (!token || token !== secret)
            return res.status(403).json({
              success: false,
              error: "Disbursement confirmation required (header x-payroll-disburse-confirmation)",
            })
        }

        if (!payroll.advanceBalancesApplied) {
          for (const employee of payroll.employees) {
            if (employee.advanceAllocations?.length) {
              await applyAdvanceTicketBalances(employee.advanceAllocations)
            }
          }

          payroll.advanceBalancesApplied = true
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
      case "reject": {
        const { reason } = req.body
        if (payroll.rejectionReason) {
          return res.status(400).json({
            success: false,
            error: "Payroll has already been rejected. Wait for Payroll Officer to regenerate it."
          })
        }
        if (!reason || typeof reason !== "string" || !reason.trim())
          return res.status(400).json({ success: false, error: "A rejection reason is required" })

        let stage: string
        if (payroll.status === "Generated") {
          if (!isFinanceManager(role) && !isAdmin(role))
            return res.status(403).json({ success: false, error: "Finance Manager or Admin only" })
          stage = "verify"
        } else if (payroll.status === "Verified") {
          if (!isHRManager(role) && !isAdmin(role))
            return res.status(403).json({ success: false, error: "HR Manager or Admin only" })
          stage = "hr_approve"
        } else if (payroll.status === "HR_Approved") {
          if (!isCEO(role) && !isAdmin(role))
            return res.status(403).json({ success: false, error: "CEO or Admin only" })
          stage = "ceo_approve"
        } else {
          return res.status(400).json({ success: false, error: "This run cannot be rejected from its current state" })
        }

        payroll.status = "Generated"
        payroll.verifiedBy = undefined
        payroll.verifiedAt = undefined
        payroll.hrApprovedBy = undefined
        payroll.hrApprovedAt = undefined
        payroll.rejectionReason = reason.trim()
        payroll.rejectedBy = req.user?.email
        payroll.rejectedAt = new Date()
        payroll.rejectedAtStage = stage
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

export const updatePayrollStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentReference } = req.body
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) return res.status(404).json({ success: false, error: "Payroll not found" })

    if (status === "HR Approved") {
      if (payroll.status === "Generated") {
        if (payroll.financeApprovalRequired)
          return res.status(400).json({
            success: false,
            error: "This run has more than 10 employees and requires Finance Manager verification first",
          })
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

const slipVisible = (status: string) =>
  EMPLOYEE_SLIP_VISIBLE_STATUSES.includes(status as PayrollRunStatus)

function formatEmployeeAddress(emp: Record<string, unknown> | null | undefined): string {
  if (!emp?.address || typeof emp.address !== "object") return ""
  const a = emp.address as Record<string, string | undefined>
  return [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ")
}

function payslipCurrencySymbol(settingsCur?: string, empCur?: string): string {
  const c = String(empCur || settingsCur || "INR").toUpperCase()
  if (c === "USD") return "$"
  if (c === "EUR") return "€"
  return "₹"
}

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

    if (req.user && !empNorm && isTeamPayrollViewerRole(req.user.role)) {
      const allowed = await getPayrollTeamUserIdStrings({
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        department: req.user.department,
      })
      if (!allowed.has(String(employeeId)))
        return res.status(403).json({ success: false, error: "Outside your team scope" })
    }

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
    const rawPid = req.params.payrollId
    const rawEid = req.params.employeeId
    const payrollId = typeof rawPid === "string" ? rawPid : rawPid?.[0]
    const employeeId = typeof rawEid === "string" ? rawEid : rawEid?.[0]
    if (!payrollId || !employeeId)
      return res.status(400).json({ success: false, error: "Invalid payroll or employee id" })

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

    const isEmp = userRole.replace(/ /g, "_") === "EMPLOYEE"
    if (req.user && !isEmp && isTeamPayrollViewerRole(req.user.role)) {
      const allowed = await getPayrollTeamUserIdStrings({
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        department: req.user.department,
      })
      if (!allowed.has(String(employeeId)))
        return res.status(403).json({ success: false, error: "Outside your team scope" })
    }

    const settingsDoc = await Settings.findOne().lean()
    const paySettings = await getOrCreatePayrollSettings()
    const user = await User.findById(employeeId).lean()
    const employee = user?.employeeId
      ? await Employee.findById(user.employeeId).lean()
      : null

    const period = getPeriodBounds(payroll.month, payroll.year)
    const ytd = await computePayslipYearToDate(payroll.year, payroll.month, employeeId)

    const employerName = "Indux Tech.Pvt. Ltd."
    const employerAddress =
      (settingsDoc as { address?: string } | null)?.address ||
      process.env.PAYSLIP_COMPANY_ADDRESS ||
      ""
    const companyPhone =
      (settingsDoc as { phone?: string } | null)?.phone ||
      process.env.PAYSLIP_COMPANY_PHONE ||
      ""
    const companyEmail =
      (settingsDoc as { companyEmail?: string } | null)?.companyEmail ||
      process.env.PAYSLIP_COMPANY_EMAIL ||
      ""

    const employeeName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Employee"
      : "Employee"
    const codeStr = employee?.employeeCode || employeeId
    const fileBase =
      String(codeStr)
        .replace(/[^\w.-]/g, "_")
        .replace(/^\.+|\.+$/g, "") || "payslip"

    generatePayslip(res, {
      payroll: {
        month: payroll.month,
        year: payroll.year,
        disbursedAt: payroll.disbursedAt,
        generatedAt: payroll.generatedAt,
      },
      slip: emp as any,
      period,
      employerName,
      employerAddress,
      employeeName,
      employeeCode: String(codeStr),
      position: employee?.designation || employee?.role || "—",
      employeeAddress:
        formatEmployeeAddress(employee as unknown as Record<string, unknown>) ||
        (employee?.currentAddress as string | undefined)?.trim() ||
        "—",
      employeePhone: employee?.phoneNumber || user?.phoneNumber || "",
      employeeEmail: employee?.workEmail || employee?.email || user?.email || "",
      paymentMethod: employee?.bankDetails?.accountNumber ? "Bank Transfer" : "—",
      companyPhone,
      companyEmail,
      currencySymbol: payslipCurrencySymbol(
        (settingsDoc as { currency?: string } | null)?.currency,
        employee?.salary?.currency
      ),
      defaultMonthWorkingHours: paySettings.defaultMonthWorkingHours || 240,
      ytd,
      fileBaseName: fileBase,
    })
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

    if (req.user && isTeamPayrollViewerRole(req.user.role) && requesterId !== userId) {
      const allowed = await getPayrollTeamUserIdStrings({
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        department: req.user.department,
      })
      if (!allowed.has(String(userId)))
        return res.status(403).json({ success: false, error: "Access denied" })
    }

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

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type } = req.query
    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (type) filter.type = type

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean()
    
    const userIds = tickets.map(t => t.employeeId).filter(id => mongoose.Types.ObjectId.isValid(id))
    const users = await User.find({ _id: { $in: userIds } }).select('employeeCode')
    const userMap = new Map(users.map(u => [u._id.toString(), u.employeeCode]))
    
    const data = tickets.map(t => ({
      ...t,
      employeeCode: userMap.get(t.employeeId as string) || 'N/A'
    }))

    res.json({ success: true, data })
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
       workflowStage: "PENDING_FINANCE",
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

   
 const role = req.user?.role

const normalizedRole = (role || "")
  .toUpperCase()
  .replace(/[\s_-]/g, "")

if (status === "Approved") {

  // Finance Manager Approval
  if (
    normalizedRole === "FINANCEMANAGER" &&
    ticket.workflowStage === "PENDING_FINANCE"
  ) {
    ticket.workflowStage = "PENDING_PAYROLL"
  }

  // Payroll Officer Final Approval
  else if (
    normalizedRole === "PAYROLLOFFICER" &&
    ticket.workflowStage === "PENDING_PAYROLL"
  ) {
    ticket.workflowStage = "APPROVED"
    ticket.status = "Approved"
    ticket.approvedBy = req.user?.email
    ticket.approvalDate = new Date()

    if (ticket.type === "advance" && ticket.amount != null) {
      ticket.remainingAmount = Number(ticket.amount)
    }
  }

  else {
    return res.status(403).json({
      success: false,
      error: "You are not allowed to approve this ticket",
    })
  }
}
 if (status === "Rejected") {
  if (!rejectionReason) {
    return res.status(400).json({
      success: false,
      error: "Rejection reason is required",
    })
  }

  ticket.status = "Rejected"
  ticket.workflowStage = "REJECTED"
  ticket.rejectionReason = rejectionReason
}
    await ticket.save()
    res.json({ success: true, data: ticket })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// --- Indemnity/Gratuity — Payment of Gratuity Act, 1972 ---
const GRATUITY_CEILING = 2000000 // ₹20,00,000 statutory ceiling (Sec 4(3); also IT Act Sec 10(10) exemption limit)
const EXEMPT_REASONS = ["death", "permanent-disablement"] // bypass the 5-year eligibility rule

function getRoundedYearsOfService(joining: Date, leaving: Date) {
  let years = leaving.getFullYear() - joining.getFullYear()
  let months = leaving.getMonth() - joining.getMonth()
  let days = leaving.getDate() - joining.getDate()

  if (days < 0) {
    months -= 1
    days += new Date(leaving.getFullYear(), leaving.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const roundedYears = months > 6 || (months === 6 && days > 0) ? years + 1 : years

  return { years, months, days, roundedYears }
}

function computeGratuity(basicPlusDA: number, roundedYears: number, reason: string) {
  const eligible = roundedYears >= 5 || EXEMPT_REASONS.includes(reason)

  if (!eligible) {
    return {
      amount: 0,
      formula: "Not eligible — minimum 5 years of continuous service required (except death/disablement)",
      cappedAtCeiling: false,
    }
  }

  const rawAmount = (15 * basicPlusDA * roundedYears) / 26
  const cappedAtCeiling = rawAmount > GRATUITY_CEILING
  const amount = Math.round(Math.min(rawAmount, GRATUITY_CEILING))

  return { amount, formula: "(15 × Last drawn Basic+DA × Completed years of service) / 26", cappedAtCeiling }
}
export const calculateIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const { basicSalary, da = 0, joiningDate, lastWorkingDate, reason = "" } = req.body

    if (!basicSalary || !joiningDate || !lastWorkingDate)
      return res.status(400).json({ success: false, error: "basicSalary, joiningDate and lastWorkingDate are required" })

    const joining = new Date(joiningDate)
    const leaving = new Date(lastWorkingDate)

    if (leaving <= joining)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const { years, months, days, roundedYears } = getRoundedYearsOfService(joining, leaving)
    const basicPlusDA = Number(basicSalary) + Number(da)
    const { amount, formula, cappedAtCeiling } = computeGratuity(basicPlusDA, roundedYears, reason)

    res.json({
      success: true,
      data: {
        yearsOfService: { years, months, days },
        roundedYearsOfService: roundedYears,
        calculatedAmount: amount,
        breakdown: { basicSalary: Number(basicSalary), da: Number(da), formula, cappedAtCeiling },
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

    const records = await Indemnity.find(filter).sort({ createdAt: -1 }).lean()
    
    const userIds = records.map(r => r.employeeId).filter(id => mongoose.Types.ObjectId.isValid(id))
    const users = await User.find({ _id: { $in: userIds } }).select('employeeCode')
    const userMap = new Map(users.map(u => [u._id.toString(), u.employeeCode]))
    
    const data = records.map(r => ({
      ...r,
      employeeCode: userMap.get(r.employeeId as string) || 'N/A'
    }))

    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const createIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, employeeName, joiningDate, lastWorkingDate, basicSalary, da = 0, reason, notes } = req.body

    if (!employeeId || !employeeName || !joiningDate || !lastWorkingDate || !basicSalary || !reason)
      return res.status(400).json({ success: false, error: "All required fields must be provided" })

    const joining = new Date(joiningDate)
    const leaving = new Date(lastWorkingDate)

    if (leaving <= joining)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const { years, months, days, roundedYears } = getRoundedYearsOfService(joining, leaving)
    const basicPlusDA = Number(basicSalary) + Number(da)
    const { amount } = computeGratuity(basicPlusDA, roundedYears, reason)

    if (roundedYears < 5 && !EXEMPT_REASONS.includes(reason))
      return res.status(400).json({ success: false, error: "Employee is not eligible — minimum 5 years of continuous service required" })

    const existingRecord = await Indemnity.findOne({ employeeId, status: { $in: ["Pending", "Approved"] } })
    if (existingRecord)
      return res.status(400).json({ success: false, error: "An active indemnity record already exists for this employee" })

    const record = await Indemnity.create({
      employeeId,
      employeeName,
      joiningDate,
      lastWorkingDate,
      yearsOfService: roundedYears,
      roundedYearsOfService: roundedYears,
      basicSalary: Number(basicSalary),
      da: Number(da),
      calculatedAmount: amount,
      reason,
      notes,
      requestedBy: req.user?.email || "unknown",
      workflowStage: "PENDING_FINANCE",
    })

    res.status(201).json({ success: true, data: record })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateIndemnityStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { action, rejectionReason } = req.body
    const role = req.user?.role || ""

    const validActions = ["finance_approve", "hr_approve", "ceo_approve", "reject", "mark_paid", "resubmit"]
    if (!action || !validActions.includes(action))
      return res.status(400).json({ success: false, error: `action must be one of: ${validActions.join(", ")}` })

    const record = await Indemnity.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, error: "Indemnity record not found" })

    if (record.status === "Paid")
      return res.status(400).json({ success: false, error: "Paid indemnities cannot be modified" })

    if (action === "reject") {
      const stageRoleOk =
        (record.workflowStage === "PENDING_FINANCE" && (isFinanceManager(role) || isAdmin(role))) ||
        (record.workflowStage === "PENDING_HR" && (isHRManager(role) || isAdmin(role))) ||
        (record.workflowStage === "PENDING_CEO" && (isCEO(role) || isAdmin(role)))

      if (!stageRoleOk)
        return res.status(403).json({ success: false, error: "You are not allowed to reject this request at its current stage" })

      record.rejectedAtStage = record.workflowStage
      record.rejectionReason = rejectionReason?.trim() || undefined
      record.rejectedBy = req.user?.email
      record.rejectedAt = new Date()

      // Sent back to Payroll Officer — sits here until they explicitly resubmit
      record.workflowStage = "REJECTED_RESUBMIT"
      record.status = "Pending"
      record.financeApprovedBy = undefined
      record.financeApprovedAt = undefined
      record.hrApprovedBy = undefined
      record.hrApprovedAt = undefined

      await record.save()
      return res.json({ success: true, data: record })
    }

    if (action === "resubmit") {
      if (!isPayrollOfficer(role) && !isAdmin(role))
        return res.status(403).json({ success: false, error: "Payroll Officer or Admin only" })
      if (record.workflowStage !== "REJECTED_RESUBMIT")
        return res.status(400).json({ success: false, error: "Only a rejected request can be resubmitted" })
      record.workflowStage = "PENDING_FINANCE"
      await record.save()
      return res.json({ success: true, data: record })
    }

    if (action === "finance_approve") {
      if (!isFinanceManager(role) && !isAdmin(role))
        return res.status(403).json({ success: false, error: "Finance Manager or Admin only" })
      if (record.workflowStage !== "PENDING_FINANCE")
        return res.status(400).json({ success: false, error: "Invalid state for Finance approval" })
      record.financeApprovedBy = req.user?.email
      record.financeApprovedAt = new Date()
      record.workflowStage = "PENDING_HR"
      // Clear any prior rejection trail — this approval supersedes it
      record.rejectionReason = undefined
      record.rejectedBy = undefined
      record.rejectedAt = undefined
      record.rejectedAtStage = undefined
      await record.save()
      return res.json({ success: true, data: record })
    }

    if (action === "hr_approve") {
      if (!isHRManager(role) && !isAdmin(role))
        return res.status(403).json({ success: false, error: "HR Manager or Admin only" })
      if (record.workflowStage !== "PENDING_HR")
        return res.status(400).json({ success: false, error: "Invalid state for HR approval" })
      record.hrApprovedBy = req.user?.email
      record.hrApprovedAt = new Date()
      record.workflowStage = "PENDING_CEO"
      await record.save()
      return res.json({ success: true, data: record })
    }

    if (action === "ceo_approve") {
      if (!isCEO(role) && !isAdmin(role))
        return res.status(403).json({ success: false, error: "CEO or Admin only" })
      if (record.workflowStage !== "PENDING_CEO")
        return res.status(400).json({ success: false, error: "Invalid state for CEO approval" })
      record.approvedBy = req.user?.email
      record.approvalDate = new Date()
      record.workflowStage = "APPROVED"
      record.status = "Approved"
      await record.save()
      return res.json({ success: true, data: record })
    }

    if (action === "mark_paid") {
      if (!isPayrollOfficer(role))
        return res.status(403).json({ success: false, error: "Payroll Officer only" })
      if (record.workflowStage !== "APPROVED")
        return res.status(400).json({ success: false, error: "Indemnity must be fully approved (CEO) before marking paid" })
      record.status = "Paid"
      record.paymentDate = new Date()
      await record.save()
      return res.json({ success: true, data: record })
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}
export const editAndResubmitIndemnity = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || ""
    if (!isPayrollOfficer(role) && !isAdmin(role))
      return res.status(403).json({ success: false, error: "Payroll Officer or Admin only" })

    const record = await Indemnity.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, error: "Indemnity record not found" })

    if (record.workflowStage !== "REJECTED_RESUBMIT")
      return res.status(400).json({ success: false, error: "Only a rejected request can be edited and resubmitted" })

    const { joiningDate, lastWorkingDate, reason, notes } = req.body
    const finalJoiningDate = joiningDate ? new Date(joiningDate) : record.joiningDate
    const finalLastWorkingDate = lastWorkingDate ? new Date(lastWorkingDate) : record.lastWorkingDate
    const finalReason = reason || record.reason

    if (finalLastWorkingDate <= finalJoiningDate)
      return res.status(400).json({ success: false, error: "lastWorkingDate must be after joiningDate" })

    const { roundedYears } = getRoundedYearsOfService(finalJoiningDate, finalLastWorkingDate)
    const basicPlusDA = Number(record.basicSalary) + Number(record.da)
    const { amount } = computeGratuity(basicPlusDA, roundedYears, finalReason)

    if (roundedYears < 5 && !EXEMPT_REASONS.includes(finalReason))
      return res.status(400).json({ success: false, error: "Employee is not eligible — minimum 5 years of continuous service required" })

    record.joiningDate = finalJoiningDate
    record.lastWorkingDate = finalLastWorkingDate
    record.reason = finalReason
    record.notes = notes !== undefined ? notes : record.notes
    record.yearsOfService = roundedYears
    record.roundedYearsOfService = roundedYears
    record.calculatedAmount = amount
    record.workflowStage = "PENDING_FINANCE"

    await record.save()
    res.json({ success: true, data: record })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}
