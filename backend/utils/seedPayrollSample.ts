import mongoose from 'mongoose';
import Payroll from '../models/payroll.model';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import { getOrCreatePayrollSettings } from '../models/payrollCompanySettings.model';
import type { IEmployeePayroll } from '../models/payroll.model';
import { computeEmployeePayrollLine, getPeriodBounds } from '../services/payrollCalculation.service';

function recalcTotals(
  payroll: InstanceType<typeof Payroll>,
  settings: Awaited<ReturnType<typeof getOrCreatePayrollSettings>>
) {
  payroll.totalGross = payroll.employees.reduce((s, e) => s + e.grossPay, 0);
  payroll.totalNet = payroll.employees.reduce((s, e) => s + e.netPay, 0);
  payroll.ceoApprovalRequired =
    payroll.totalNet > (settings.ceoApprovalThresholdTotalNet || 0);
}

/**
 * Creates one regular payroll run for the current month from existing users linked to
 * employees with salary.basic — only if no regular run exists for that month.
 * Safe for production: no-op when payroll already present.
 */
export async function seedPayrollSampleData(): Promise<void> {
  if (process.env.SEED_PAYROLL_SAMPLE === '0') {
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  const exists = await Payroll.findOne({
    month,
    year,
    $or: [{ runKind: 'regular' }, { runKind: { $exists: false } }],
  })
    .select('_id')
    .lean();

  if (exists) {
    return;
  }

  const settings = await getOrCreatePayrollSettings();
  const period = getPeriodBounds(month, year);

  const users = await User.find({
    employeeId: { $exists: true, $ne: null },
    isDeleted: { $ne: true },
    isActive: true,
  })
    .select('_id employeeId')
    .limit(40)
    .lean();

  const lines: IEmployeePayroll[] = [];

  for (const u of users) {
    if (!u.employeeId) continue;
    const employee = await Employee.findById(u.employeeId);
    if (!employee?.salary?.basic) continue;
    try {
      const line = await computeEmployeePayrollLine({
        userId: String(u._id),
        employee,
        settings,
        period,
        adjustments: undefined,
      });
      lines.push(line);
    } catch (e: any) {
      console.warn(`[seedPayrollSample] skip user ${u._id}:`, e?.message || e);
    }
  }

  if (!lines.length) {
    console.log('ℹ️ Payroll sample seed skipped — no eligible employees with salary.basic.');
    return;
  }

  const payroll = await Payroll.create({
    month,
    year,
    runKind: 'regular',
    employees: lines,
    status: 'Verified',
    generatedBy: 'system-sample-seed',
    generatedAt: new Date(),
    verifiedBy: 'system-sample-seed',
    verifiedAt: new Date(),
    totalGross: 0,
    totalNet: 0,
    ceoApprovalRequired: false,
  });

  recalcTotals(payroll, settings);
  await payroll.save();

  console.log(
    `✅ Seeded sample payroll for ${month} ${year} (${lines.length} employees) — finance dashboard`
  );
}
