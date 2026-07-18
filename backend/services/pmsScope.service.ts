import mongoose from 'mongoose';
import { MODULE_KEYS } from '../middleware/role.middleware';
import Role from '../models/Role.model';

export type PmsScope = 'self' | 'team' | 'department' | 'organization' | 'executive';

export type PmsViewer = {
  _id: mongoose.Types.ObjectId | string;
  role?: string;
  department?: string | null;
};

const normalize = (s: string | undefined) => String(s || '').toUpperCase().replace(/[\s_]/g, '');

async function roleHasPerformance(
  roleName: string | undefined,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  const roles = await Role.find({});
  const doc = roles.find((r) => normalize(r.name) === normalize(roleName));
  const p = doc?.permissions.get(MODULE_KEYS.PERFORMANCE);
  return !!(p && p[action]);
}

/** Whether this user may see another user's PMS row (before row-level checks). */
export async function resolvePmsScope(user: PmsViewer): Promise<PmsScope> {
  const r = normalize(user.role);
  if (r === 'EMPLOYEE') return 'self';
  if (r === 'DIRECTMANAGER') return 'team';
  if (r === 'DEPARTMENTMANAGER') return 'department';
  if (r === 'CEO') return 'executive';
  if (
    r === 'HRMANAGER' ||
    r === 'HROFFICER' ||
    r === 'PAYROLLOFFICER' ||
    r === 'FINANCEMANAGER'
  ) {
    return 'organization';
  }
  return 'organization';
}

export async function canReadPerformanceOrg(user: PmsViewer): Promise<boolean> {
  return roleHasPerformance(user.role, 'read');
}

export async function assertCanViewReview(params: {
  viewer: PmsViewer;
  reviewEmployeeId: mongoose.Types.ObjectId;
  reviewerId?: mongoose.Types.ObjectId;
  employeeDepartment?: string | null;
}): Promise<void> {
  const { viewer, reviewEmployeeId, reviewerId, employeeDepartment } = params;
  const vid = new mongoose.Types.ObjectId(String(viewer._id));
  if (!(await canReadPerformanceOrg(viewer))) {
    throw new Error('Access denied: performance read permission required.');
  }

  const scope = await resolvePmsScope(viewer);
  if (scope === 'self') {
    if (vid.toString() !== reviewEmployeeId.toString()) throw new Error('Access denied.');
    return;
  }
  if (scope === 'team') {
    if (reviewerId && reviewerId.toString() === vid.toString()) return;
    if (vid.toString() === reviewEmployeeId.toString()) return;
    throw new Error('Access denied: not your review assignment.');
  }
  if (scope === 'department') {
    const vd = viewer.department || '';
    const ed = employeeDepartment || '';
    if (vd && ed && vd === ed) return;
    if (reviewerId && reviewerId.toString() === vid.toString()) return;
    throw new Error('Access denied: outside department scope.');
  }
  // organization / executive — HR-wide read already granted
}

export async function assertPayrollReadOnly(user: PmsViewer): Promise<void> {
  const ok = await roleHasPerformance(user.role, 'read');
  const w = await roleHasPerformance(user.role, 'write');
  if (!ok || w) throw new Error('Payroll access to PMS is read-only.');
}
