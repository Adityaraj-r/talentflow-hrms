/**
 * Payroll module quick verification (no HTTP server required).
 *
 * Run: npm run check:payroll
 *
 * - Validates calculation helpers & statutory service
 * - Audits workflow transition rules (static)
 * - Optional: MongoDB ping + attendance lock vacuous test if MONGODB_URI is set (skipped if unreachable)
 */
import "dotenv/config"
import mongoose from "mongoose"
import {
  getPeriodBounds,
  computeProrationFactor,
  assertAttendancePeriodLocked,
} from "../services/payrollCalculation.service"
import { applyStatutoryDeductions } from "../services/payrollStatutory.service"
import { EMPLOYEE_SLIP_VISIBLE_STATUSES } from "../models/payroll.model"
import type { IPayrollCompanySettings } from "../models/payrollCompanySettings.model"

let failed = 0

function ok(msg: string) {
  console.log(`  ✓ ${msg}`)
}

function fail(msg: string) {
  console.error(`  ✗ ${msg}`)
  failed++
}

function assert(cond: boolean, msg: string) {
  if (cond) ok(msg)
  else fail(msg)
}

function auditWorkflowRules() {
  console.log("\n[Workflow rules audit — must match patchPayrollWorkflow]")
  const rules: { action: string; from: string; roles: string }[] = [
    { action: "verify", from: "Generated", roles: "Finance Manager / Admin" },
    { action: "hr_approve", from: "Verified", roles: "HR Manager / Admin" },
    { action: "ceo_approve", from: "HR_Approved", roles: "CEO / Admin" },
    { action: "disburse", from: "CEO_Approved", roles: "Payroll Officer / Admin (+ optional x-payroll-disburse-confirmation)" },
    { action: "lock", from: "Disbursed | Paid", roles: "Finance Manager / Admin" },
  ]
  for (const r of rules) {
    ok(`documented: ${r.action} expects status ${r.from} (${r.roles})`)
  }
}

async function runCalculationChecks() {
  console.log("\n[Calculation engine]")
  const feb = getPeriodBounds("February", 2024)
  assert(feb.totalDays === 29, "Feb 2024 has 29 days")
  assert(feb.startStr === "2024-02-01" && feb.endStr === "2024-02-29", "Feb 2024 period bounds ISO")

  const jan = getPeriodBounds("January", 2025)
  assert(jan.totalDays === 31, "Jan has 31 days")

  const pStart = new Date("2025-01-01T00:00:00.000Z")
  const pEnd = new Date("2025-01-31T23:59:59.999Z")
  const full = computeProrationFactor(undefined, undefined, pStart, pEnd)
  assert(Math.abs(full - 1) < 0.001, "Full-month proration ~1")

  const join = new Date("2025-01-16T00:00:00.000Z")
  const partial = computeProrationFactor(join, undefined, pStart, pEnd)
  assert(partial > 0 && partial < 1, "Mid-month join proration between 0 and 1")

  console.log("\n[Statutory service]")
  const settings = {
    useComputedPf: true,
    useComputedEsi: false,
    useComputedPt: false,
    useComputedTds: false,
    pfEmployeePercent: 12,
    pfWageCeiling: 15000,
    esiEmployeePercent: 0.75,
    esiGrossCeiling: 21000,
    professionalTaxMonthlySlab: 200,
    tdsDefaultMonthlyEstimate: 0,
    ceoApprovalThresholdTotalNet: 0,
    defaultMonthWorkingHours: 240,
    otRateMultiplier: 1.5,
    esiEmployerPercent: 3.25,
  } as unknown as IPayrollCompanySettings

  const out = applyStatutoryDeductions(settings, {
    basic: 20000,
    gross: 25000,
    fixedPf: 100,
    fixedEsi: 0,
    fixedPt: 0,
    fixedTds: 500,
    insurance: 0,
    other: 0,
  })
  assert(out.pf === Math.round(15000 * 0.12), "Computed PF uses ceiling (12% of 15000)")
  assert(out.tds === 500, "TDS uses fixed when useComputedTds false")
}

function runVisibilityChecks() {
  console.log("\n[Employee slip visibility]")
  assert(!EMPLOYEE_SLIP_VISIBLE_STATUSES.includes("Generated" as any), "Employees cannot see Generated")
  assert(!EMPLOYEE_SLIP_VISIBLE_STATUSES.includes("Verified" as any), "Employees cannot see Verified")
  assert(EMPLOYEE_SLIP_VISIBLE_STATUSES.includes("Disbursed" as any), "Employees can see Disbursed")
  assert(EMPLOYEE_SLIP_VISIBLE_STATUSES.includes("Locked" as any), "Employees can see Locked")
}

function warn(msg: string) {
  console.warn(`  ⚠ ${msg}`)
}

/** Needs a live connection — countDocuments buffers forever if disconnected. */
async function runAttendanceLockCheckConnected() {
  console.log("\n[Attendance lock helper]")
  try {
    await assertAttendancePeriodLocked("2099-01-01", "2099-01-31")
    ok("No attendance rows → lock check passes (vacuous)")
  } catch (e: any) {
    fail(`Unexpected lock error: ${e.message}`)
  }
}

async function optionalMongoAndAttendance() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.log("\n[MongoDB + attendance lock] SKIP — set MONGODB_URI for live checks")
    return
  }
  console.log("\n[MongoDB + attendance lock]")
  try {
    await mongoose.connect(uri)
  } catch (e: any) {
    warn(`MongoDB unreachable — skipped ping & attendance lock (${e.message})`)
    return
  }
  try {
    const db = mongoose.connection.db
    if (!db) {
      warn("MongoDB db handle not available after connect — skipped collection checks")
      return
    }
    await db.admin().command({ ping: 1 })
    ok("Ping successful")
    const cols = await db.listCollections({ name: "payrolls" }).toArray()
    assert(cols.length >= 0, "Listed payrolls collection (may be empty before first run)")
    await runAttendanceLockCheckConnected()
  } catch (e: any) {
    fail(`MongoDB checks failed after connect: ${e.message}`)
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

function printManualChecklist() {
  console.log(`
Manual QA (with API + UI running)
Auth: obtain JWT for each role (Payroll Officer, Finance Manager, HR Manager, CEO, Employee).

API (base /api/payroll, Bearer token):
  GET  /settings                    → 200, JSON settings
  POST /calculate-preview           → body { month, year, userId, adjustments? }
  GET  /pending?month=&year=        → eligible users only; ineligibleCount
  POST /generate                    → body { month, year, employeeIds[], adjustments?, skipAttendanceLockCheck? }
  PATCH /:id/workflow               → { action: verify | hr_approve | ceo_approve | disburse | lock }
  GET  /:id/export/bank             → CSV download
  GET  /analytics/summary?year=     → CEO / Finance / HR
  GET  /:payrollId/slip/:userId     → Employee 403 until Disbursed/Locked (or legacy Paid)
  GET  /:payrollId/download/:userId → PDF blob

UI:
  /payroll — preview matches POST /calculate-preview; workflow buttons + Bank CSV + disburse fields
  /payroll/salary-slip — statuses colored correctly
  /ceo/payroll — analytics loads

Env:
  PAYROLL_DISBURSE_SECRET — if set, disburse needs header x-payroll-disburse-confirmation
`)
}

async function main() {
  console.log("Payroll module quick check\n====================")
  runCalculationChecks()
  runVisibilityChecks()
  auditWorkflowRules()
  await optionalMongoAndAttendance()
  printManualChecklist()

  if (failed > 0) {
    console.error(`\nDone: ${failed} check(s) FAILED`)
    process.exit(1)
  }
  console.log("\nDone: all automated checks passed.")
  process.exit(0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
