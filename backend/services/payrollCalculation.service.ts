import mongoose from "mongoose"
import Attendance from "../models/Attendance.model"
import Leave from "../models/Leave.model"
import Ticket from "../models/ticket.model"
import Employee from "../models/Employee.model"
import { PerformanceReviewModel, ReviewStatus } from "../models/PerformanceReview"
import type { IPayrollCompanySettings } from "../models/payrollCompanySettings.model"
import { applyStatutoryDeductions } from "./payrollStatutory.service"
import type { IAdvanceAllocation, IEmployeePayroll } from "../models/payroll.model"

const CALC_VERSION = "v2.1"

export type PeriodBounds = {
  startStr: string
  endStr: string
  totalDays: number
  month: string
  year: number
}

export function getPeriodBounds(month: string, year: number): PeriodBounds {
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
  const startDate = new Date(Date.UTC(year, monthIndex, 1))
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0))
  return {
    startStr: startDate.toISOString().split("T")[0],
    endStr: endDate.toISOString().split("T")[0],
    totalDays: endDate.getUTCDate(),
    month,
    year,
  }
}

/** Proration factor for mid-month join/exit on fixed monthly components */
export function computeProrationFactor(
  joiningDate: Date | undefined,
  exitDate: Date | undefined,
  periodStart: Date,
  periodEnd: Date
): number {
  let start = periodStart.getTime()
  let end = periodEnd.getTime()
  if (joiningDate && joiningDate.getTime() > start) start = joiningDate.getTime()
  if (exitDate && exitDate.getTime() < end) end = exitDate.getTime()
  if (end < start) return 0
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
  const monthDays =
    Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(1, Math.max(0, days / monthDays))
}

async function lwpAndPendingLeaveDays(
  userId: mongoose.Types.ObjectId,
  startStr: string,
  endStr: string
): Promise<{ lwp: number; pendingUnpaid: number }> {
  const periodStart = new Date(`${startStr}T00:00:00.000Z`)
  const periodEnd = new Date(`${endStr}T23:59:59.999Z`)

  const overlapDays = (ls: Date, le: Date) => {
    const start = ls.getTime() > periodStart.getTime() ? ls : periodStart
    const end = le.getTime() < periodEnd.getTime() ? le : periodEnd
    if (end.getTime() < start.getTime()) return 0
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const lwps = await Leave.find({
    userId,
    status: "Approved",
    leaveType: "LWP",
    startDate: { $lte: periodEnd },
    endDate: { $gte: periodStart },
  })
  let lwp = 0
  for (const lv of lwps) lwp += overlapDays(new Date(lv.startDate), new Date(lv.endDate))

  const pending = await Leave.find({
    userId,
    status: "Pending",
    startDate: { $lte: periodEnd },
    endDate: { $gte: periodStart },
  })
  let pendingUnpaid = 0
  for (const lv of pending) {
    if (lv.leaveType === "LWP") pendingUnpaid += overlapDays(new Date(lv.startDate), new Date(lv.endDate))
    else pendingUnpaid += overlapDays(new Date(lv.startDate), new Date(lv.endDate))
  }

  return { lwp, pendingUnpaid }
}

async function approvedOvertimeHours(
  userId: mongoose.Types.ObjectId,
  startStr: string,
  endStr: string
): Promise<number> {
  const agg = await Attendance.aggregate<{ h: number }>([
    {
      $match: {
        userId,
        date: { $gte: startStr, $lte: endStr },
        isOtApproved: true,
        overtimeHours: { $gt: 0 },
      },
    },
    { $group: { _id: null, h: { $sum: "$overtimeHours" } } },
  ])
  return agg[0]?.h || 0
}

async function performanceBonusForUser(
  userOid: mongoose.Types.ObjectId,
  month: number,
  year: number
): Promise<number> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  const reviews = await PerformanceReviewModel.find({
    employeeId: userOid,
    status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
    updatedAt: { $gte: start, $lte: end },
  }).limit(5)
  if (!reviews.length) return 0
  const avg =
    reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length
  return Math.round(Math.max(0, avg - 3) * 2000)
}

async function fifoAdvanceDeductions(
  userIdStr: string,
  maxDeduct: number
): Promise<{ allocations: IAdvanceAllocation[]; total: number }> {
  const advances = await Ticket.find({
    employeeId: userIdStr,
    type: "advance",
    status: "Approved",
    $or: [
      { remainingAmount: { $gt: 0 } },
      { $and: [{ remainingAmount: { $exists: false } }, { amount: { $gt: 0 } }] },
    ],
  }).sort({ approvalDate: 1, createdAt: 1 })

  const allocations: IAdvanceAllocation[] = []
  let total = 0
  let room = maxDeduct

  for (const t of advances) {
    if (room <= 0) break
    const tid = (t._id as mongoose.Types.ObjectId).toString()
    const rem =
      t.remainingAmount != null ? t.remainingAmount : Number(t.amount || 0)
    if (rem <= 0) continue
    const take = Math.min(rem, room)
    allocations.push({ ticketId: tid, amount: take })
    total += take
    room -= take
  }

  return { allocations, total }
}

export type PerUserAdjustments = {
  bonus?: number
  overtime?: number
  useLopOverride?: boolean
  lopDaysOverride?: number
}

export type AttendanceLockStatus = {
  total: number
  locked: number
  unlocked: number
  /** Up to 12 calendar dates (YYYY-MM-DD) that still have at least one unlocked row */
  sampleUnlockedDates: string[]
}

/** Counts locked vs total attendance rows in range; used for payroll gating and error detail. */
export async function getAttendanceLockStatus(
  startStr: string,
  endStr: string
): Promise<AttendanceLockStatus> {
  const total = await Attendance.countDocuments({ date: { $gte: startStr, $lte: endStr } })
  const locked = await Attendance.countDocuments({
    date: { $gte: startStr, $lte: endStr },
    isLocked: true,
  })
  const unlocked = total - locked
  const sampleDocs = await Attendance.find({
    date: { $gte: startStr, $lte: endStr },
    $or: [{ isLocked: false }, { isLocked: { $exists: false } }],
  })
    .select("date")
    .sort({ date: 1 })
    .limit(40)
    .lean()
  const seen = new Set<string>()
  const sampleUnlockedDates: string[] = []
  for (const d of sampleDocs) {
    const day = String((d as { date?: string }).date || "")
    if (day && !seen.has(day)) {
      seen.add(day)
      sampleUnlockedDates.push(day)
      if (sampleUnlockedDates.length >= 12) break
    }
  }
  return { total, locked, unlocked, sampleUnlockedDates }
}

export async function assertAttendancePeriodLocked(startStr: string, endStr: string): Promise<void> {
  const s = await getAttendanceLockStatus(startStr, endStr)
  if (s.total === 0) return
  if (s.locked !== s.total) {
    const samples = s.sampleUnlockedDates.slice(0, 5).join(", ") || "—"
    throw new Error(
      `PAYROLL_LOCK: ${s.unlocked} of ${s.total} attendance rows are not locked (${s.locked} locked). Lock all attendance for ${startStr} through ${endStr} before payroll. Sample dates with unlocked rows: ${samples}.`
    )
  }
}

export async function computeEmployeePayrollLine(params: {
  userId: string
  employee: InstanceType<typeof Employee>
  settings: IPayrollCompanySettings
  period: PeriodBounds
  adjustments?: PerUserAdjustments
}): Promise<IEmployeePayroll> {
  const { userId, employee, settings, period, adjustments = {} } = params
  const uid = new mongoose.Types.ObjectId(userId)

  const periodStart = new Date(`${period.startStr}T00:00:00.000Z`)
  const periodEnd = new Date(`${period.endStr}T23:59:59.999Z`)
  const prorationFactor = computeProrationFactor(
    employee.joiningDate ? new Date(employee.joiningDate) : undefined,
    employee.exitDate ? new Date(employee.exitDate) : undefined,
    periodStart,
    periodEnd
  )

  const basicFull = Number(employee.salary?.basic) || 0
  const hraFull = Number(employee.salary?.allowances?.hra) || 0
  const tr = Number(employee.salary?.allowances?.transport) || 0
  const med = Number(employee.salary?.allowances?.medical) || 0
  const oth = Number(employee.salary?.allowances?.other) || 0

  const basic = Math.round(basicFull * prorationFactor)
  const hra = Math.round(hraFull * prorationFactor)
  const allowances = Math.round((tr + med + oth) * prorationFactor)

  const halfDayCount = await Attendance.countDocuments({
    userId: uid,
    status: "Half Day",
    date: { $gte: period.startStr, $lte: period.endStr },
  })
  const absentCount = await Attendance.countDocuments({
    userId: uid,
    status: "Absent",
    date: { $gte: period.startStr, $lte: period.endStr },
  })

  const { lwp, pendingUnpaid } = await lwpAndPendingLeaveDays(uid, period.startStr, period.endStr)
  let lopDays = absentCount + halfDayCount * 0.5 + lwp + pendingUnpaid

  if (adjustments.useLopOverride)
    lopDays = Math.max(0, Number(adjustments.lopDaysOverride) || 0)

  const perDayBasic = basicFull / Math.max(1, period.totalDays)
  const lopAmount = Math.round(lopDays * perDayBasic * prorationFactor)

  const otHours = await approvedOvertimeHours(uid, period.startStr, period.endStr)
  const hourly = basicFull / Math.max(1, settings.defaultMonthWorkingHours)
  const overtimeFromHours = Math.round(otHours * hourly * settings.otRateMultiplier)
  const overtimeExtra = Math.round(Number(adjustments.overtime) || 0)
  const overtime = overtimeFromHours + overtimeExtra

  const bonus = Math.round(Number(adjustments.bonus) || 0)

  const mIdx = new Date(`${period.month} 1, ${period.year}`).getMonth()
  const mStart = new Date(period.year, mIdx, 1)
  const mEnd = new Date(period.year, mIdx + 1, 0, 23, 59, 59, 999)
  const travelReimb = await Ticket.aggregate<{ s: number }>([
    {
      $match: {
        employeeId: userId,
        type: "travel",
        status: "Approved",
        $or: [
          { approvalDate: { $gte: mStart, $lte: mEnd } },
          { approvalDate: { $exists: false }, createdAt: { $gte: mStart, $lte: mEnd } },
        ],
      },
    },
    { $group: { _id: null, s: { $sum: "$amount" } } },
  ])
  const reimbursement = Math.round(travelReimb[0]?.s || 0)

  const perfBonus = await performanceBonusForUser(
    uid,
    new Date(`${period.month} 1, ${period.year}`).getMonth() + 1,
    period.year
  )

  const earnings = {
    basic,
    hra,
    allowances,
    bonus,
    overtime,
    reimbursement,
    performanceBonus: perfBonus,
  }

  const grossPay =
    earnings.basic +
    earnings.hra +
    earnings.allowances +
    earnings.bonus +
    earnings.overtime +
    earnings.reimbursement +
    earnings.performanceBonus

  const fixedPf = Number(employee.salary?.deductions?.pf) || 0
  const fixedInsurance = Number(employee.salary?.deductions?.insurance) || 0
  const fixedOther = Number(employee.salary?.deductions?.other) || 0
  const fixedTax = Number(employee.salary?.deductions?.tax) || 0

  const stat = applyStatutoryDeductions(settings, {
    basic: basicFull,
    gross: grossPay,
    fixedPf,
    fixedEsi: 0,
    fixedPt: 0,
    fixedTds: fixedTax,
    insurance: fixedInsurance,
    other: fixedOther,
  })

  const preAdvanceTotal =
    stat.pf +
    stat.esi +
    stat.pt +
    stat.tds +
    fixedInsurance +
    fixedOther +
    lopAmount

  const maxAdvance = Math.max(0, grossPay - preAdvanceTotal)
  const { allocations, total: advanceTotal } = await fifoAdvanceDeductions(userId, maxAdvance)

  const deductions = {
    pf: stat.pf,
    esi: stat.esi,
    pt: stat.pt,
    tds: stat.tds,
    insurance: fixedInsurance,
    other: fixedOther,
    lopAmount,
    advanceTotal,
  }

  const totalDeductions =
    deductions.pf +
    deductions.esi +
    deductions.pt +
    deductions.tds +
    deductions.insurance +
    deductions.other +
    deductions.lopAmount +
    deductions.advanceTotal

  const netPay = Math.round(grossPay - totalDeductions)

  return {
    employeeId: userId,
    earnings,
    deductions,
    grossPay: Math.round(grossPay),
    totalDeductions: Math.round(totalDeductions),
    netPay,
    lopDays,
    prorationFactor,
    advanceAllocations: allocations,
    calculationVersion: CALC_VERSION,
    computedAt: new Date(),
  }
}

export async function applyAdvanceTicketBalances(allocations: IAdvanceAllocation[]): Promise<void> {
  for (const a of allocations) {
    const t = await Ticket.findById(a.ticketId)
    if (!t || t.type !== "advance") continue
    const rem =
      t.remainingAmount != null ? t.remainingAmount : Number(t.amount || 0)
    const next = Math.max(0, rem - a.amount)
    t.remainingAmount = next
    await t.save()
  }
}
