import mongoose from "mongoose"
import Payroll from "../models/payroll.model"
import User from "../models/User.model"
import Employee from "../models/Employee.model"
import Ticket from "../models/ticket.model"
import { getOrCreatePayrollSettings } from "../models/payrollCompanySettings.model"
import type { IEmployeePayroll } from "../models/payroll.model"
import { computeEmployeePayrollLine, getPeriodBounds } from "../services/payrollCalculation.service"

function recalcTotals(
  payroll: InstanceType<typeof Payroll>,
  settings: Awaited<ReturnType<typeof getOrCreatePayrollSettings>>
) {
  payroll.totalGross = payroll.employees.reduce((s, e) => s + e.grossPay, 0)
  payroll.totalNet = payroll.employees.reduce((s, e) => s + e.netPay, 0)
  payroll.ceoApprovalRequired = payroll.totalNet > (settings.ceoApprovalThresholdTotalNet || 0)
}

function calendarMonthYear(d: Date): { month: string; year: number } {
  const month = d.toLocaleString("en-US", { month: "long" })
  const year = d.getFullYear()
  return { month, year }
}

function addMonths(base: Date, delta: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + delta)
  return d
}

async function ensureSalariesForPayrollSample(maxToSet: number): Promise<void> {
  if (process.env.NODE_ENV === "production") return
  let n = 0
  const users = await User.find({
    employeeId: { $exists: true, $ne: null },
    isDeleted: { $ne: true },
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .limit(40)

  for (const u of users) {
    if (n >= maxToSet) break
    const emp = await Employee.findById(u.employeeId)
    if (!emp) continue
    const b = Number(emp.salary?.basic) || 0
    if (b > 0) continue
    if (!emp.salary) emp.salary = {}
    emp.salary.basic = 45000 + n * 2500
    emp.salary.currency = emp.salary.currency || "INR"
    emp.salary.allowances = emp.salary.allowances || {}
    if (emp.salary.allowances.hra == null) emp.salary.allowances.hra = 18000
    if (emp.salary.allowances.transport == null) emp.salary.allowances.transport = 2000
    if (emp.salary.allowances.medical == null) emp.salary.allowances.medical = 1250
    if (emp.salary.allowances.other == null) emp.salary.allowances.other = 0
    emp.salary.deductions = emp.salary.deductions || {}
    if (emp.salary.deductions.pf == null) emp.salary.deductions.pf = 1800
    if (emp.salary.deductions.tax == null) emp.salary.deductions.tax = 2500
    if (emp.salary.deductions.insurance == null) emp.salary.deductions.insurance = 500
    if (!emp.bankDetails?.accountNumber) {
      emp.bankDetails = {
        accountHolderName: `${emp.firstName} ${emp.lastName}`.trim(),
        accountNumber: `50100${String(n + 1).padStart(5, "0")}`,
        bankName: "Sample Bank",
        branchName: "HQ",
        ifscCode: "SBIN0001234",
      }
    }
    await emp.save()
    n++
  }
}

async function pickFiveUserIds(): Promise<string[]> {
  const users = await User.find({
    employeeId: { $exists: true, $ne: null },
    isDeleted: { $ne: true },
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean()

  const ids: string[] = []
  for (const u of users) {
    if (ids.length >= 5) break
    const emp = await Employee.findById(u.employeeId).select("salary.basic").lean()
    if (emp && Number(emp.salary?.basic) > 0) ids.push(String(u._id))
  }
  return ids
}

async function buildLines(userIds: string[], month: string, year: number): Promise<IEmployeePayroll[]> {
  const settings = await getOrCreatePayrollSettings()
  const period = getPeriodBounds(month, year)
  const lines: IEmployeePayroll[] = []
  for (const userId of userIds) {
    const user = await User.findById(userId).select("employeeId").lean()
    if (!user?.employeeId) continue
    const employee = await Employee.findById(user.employeeId)
    if (!employee?.salary?.basic) continue
    try {
      const line = await computeEmployeePayrollLine({
        userId,
        employee,
        settings,
        period,
        adjustments: undefined,
      })
      lines.push(line)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[seedPayrollSample] skip user ${userId}:`, msg)
    }
  }
  return lines
}

async function seedLockedPreviousMonth(userIds: string[]): Promise<void> {
  const { month, year } = calendarMonthYear(addMonths(new Date(), -1))
  const exists = await Payroll.findOne({
    month,
    year,
    $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
  })
    .select("_id")
    .lean()
  if (exists) return

  const lines = await buildLines(userIds, month, year)
  if (lines.length === 0) return

  const settings = await getOrCreatePayrollSettings()
  const now = new Date()
  const payroll = await Payroll.create({
    month,
    year,
    runKind: "regular",
    employees: lines,
    status: "Locked",
    generatedBy: "system",
    generatedAt: now,
    verifiedBy: "system",
    verifiedAt: now,
    hrApprovedBy: "system",
    hrApprovedAt: now,
    ceoApprovedBy: "system",
    ceoApprovedAt: now,
    disbursedBy: "system",
    disbursedAt: now,
    lockedBy: "system",
    lockedAt: now,
    paymentReference: `NEFT-${month}-${year}`,
    paymentMethod: "bank_transfer",
    paymentStatus: "completed",
    totalGross: 0,
    totalNet: 0,
    ceoApprovalRequired: false,
  })
  recalcTotals(payroll, settings)
  await payroll.save()
  console.log(`[seedPayrollSample] Locked payroll ${month} ${year} (${lines.length} employees).`)
}

async function seedGeneratedCurrentMonth(userIds: string[]): Promise<void> {
  const { month, year } = calendarMonthYear(new Date())
  const exists = await Payroll.findOne({
    month,
    year,
    $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
  })
    .select("_id")
    .lean()
  if (exists) return

  const lines = await buildLines(userIds, month, year)
  if (lines.length === 0) return

  const settings = await getOrCreatePayrollSettings()
  const now = new Date()
  const payroll = await Payroll.create({
    month,
    year,
    runKind: "regular",
    employees: lines,
    status: "Generated",
    generatedBy: "system",
    generatedAt: now,
    totalGross: 0,
    totalNet: 0,
    ceoApprovalRequired: false,
  })
  recalcTotals(payroll, settings)
  await payroll.save()
  console.log(`[seedPayrollSample] Generated payroll ${month} ${year} (${lines.length} employees).`)
}

async function seedSampleTicketIfEmpty(userIds: string[]): Promise<void> {
  const n = await Ticket.countDocuments()
  if (n > 0 || userIds.length === 0) return
  const u = await User.findById(userIds[0]).lean()
  const emp = u?.employeeId ? await Employee.findById(u.employeeId).lean() : null
  const name = emp ? `${emp.firstName} ${emp.lastName}`.trim() : "Employee"
  await Ticket.create({
    employeeId: userIds[0],
    employeeName: name,
    type: "advance",
    amount: 8000,
    reason: "Salary advance",
    requestedBy: "sample-data",
    status: "Pending",
  })
  console.log("[seedPayrollSample] Sample advance ticket created.")
}

export async function seedPayrollSampleData(): Promise<void> {
  if (process.env.SEED_PAYROLL_SAMPLE === "0") return
  if (mongoose.connection.readyState !== 1) return

  await ensureSalariesForPayrollSample(5)
  const userIds = await pickFiveUserIds()
  if (userIds.length < 5) {
    console.log(
      `[seedPayrollSample] Need at least 5 users with employee links and salary.basic; found ${userIds.length}.`
    )
    return
  }

  await seedLockedPreviousMonth(userIds)
  await seedGeneratedCurrentMonth(userIds)
  await seedSampleTicketIfEmpty(userIds)
}
