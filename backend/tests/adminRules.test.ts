import { describe, it, expect } from 'vitest';
import { normalizeRoleKey, isPrivilegedSystemRoleName } from '../utils/adminRules.util';

describe('adminRules', () => {
  it('normalizes role strings', () => {
    expect(normalizeRoleKey('SUPER ADMIN')).toBe('SUPERADMIN');
    expect(normalizeRoleKey('SUPER_ADMIN')).toBe('SUPERADMIN');
  });

  it('identifies privileged system roles', () => {
    expect(isPrivilegedSystemRoleName('ADMIN')).toBe(true);
    expect(isPrivilegedSystemRoleName('SUPER ADMIN')).toBe(true);
    expect(isPrivilegedSystemRoleName('HR_MANAGER')).toBe(false);
  });
});
