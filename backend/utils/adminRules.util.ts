import mongoose from 'mongoose';
import User from '../models/User.model';

export const normalizeRoleKey = (r: string | undefined): string =>
  (r || '').toUpperCase().replace(/[\s_]/g, '');

export function isPrivilegedSystemRoleName(role: string | undefined): boolean {
  const n = normalizeRoleKey(role);
  return n === 'ADMIN' || n === 'SUPERADMIN';
}

export function isAssignableRoleStable(roleName: string): boolean {
  const n = normalizeRoleKey(roleName);
  if (!n) return false;
  if (n === 'SUPERADMIN') return false;
  return true;
}

export async function countOtherActiveAdmins(excludeUserId: string): Promise<number> {
  let oid: mongoose.Types.ObjectId;
  try {
    oid = new mongoose.Types.ObjectId(excludeUserId);
  } catch {
    return 0;
  }
  return User.countDocuments({
    _id: { $ne: oid },
    isDeleted: { $ne: true },
    isActive: true,
    $or: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }, { role: 'SUPER ADMIN' }],
  });
}

export async function checkAdminSafeguard(params: {
  userId: string;
  operation: 'delete' | 'deactivate' | 'role_change';
  nextRole?: string;
  nextIsActive?: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await User.findById(params.userId);
  if (!user) return { ok: true };

  if (!isPrivilegedSystemRoleName(String(user.role))) return { ok: true };

  let stripsAdmin = false;
  if (params.operation === 'delete') stripsAdmin = true;
  if (params.operation === 'deactivate' && params.nextIsActive === false) stripsAdmin = true;
  if (
    params.operation === 'role_change' &&
    params.nextRole !== undefined &&
    !isPrivilegedSystemRoleName(params.nextRole)
  ) {
    stripsAdmin = true;
  }

  if (!stripsAdmin) return { ok: true };

  const others = await countOtherActiveAdmins(params.userId);
  if (others < 1) {
    return {
      ok: false,
      message: 'The system must always retain at least one active administrator account.',
    };
  }
  return { ok: true };
}
