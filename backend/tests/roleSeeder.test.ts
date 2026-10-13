import { afterEach, describe, expect, it, vi } from 'vitest';
import Role from '../models/Role.model';
import { enterpriseRoles, seedRoles } from '../utils/roleSeeder';

const modules = [
  'dashboard',
  'employees',
  'recruitment',
  'payroll',
  'attendance',
  'settings',
  'roles',
  'audit',
  'performance',
] as const;

const expectedRows: [string, ...string[]][] = [
  ['ADMIN', 'RWD', 'RWD', 'R', 'RWD', 'RWD', 'RWD', 'RWD', 'R', '-'],
  ['SUPER_ADMIN', 'RWD', 'RWD', 'R', 'RWD', 'RWD', 'RWD', 'RWD', 'R', '-'],
  ['CEO', 'R', 'R', 'R', 'R', 'R', '-', '-', '-', 'RW'],
  ['COUNTRY_MANAGER', 'R', 'R', '-', 'R', 'R', '-', '-', '-', 'R'],
  ['OPERATIONS_MANAGER', 'R', 'R', '-', 'R', 'RW', 'R', '-', '-', 'R'],
  ['FINANCE_MANAGER', 'R', 'R', '-', 'RW', 'R', '-', '-', '-', 'R'],
  ['HR_MANAGER', 'R', 'RWD', 'RWD', 'RW', 'RWD', '-', '-', '-', 'RWD'],
  ['HR_OFFICER', 'R', 'RW', 'RW', 'R', 'RW', '-', '-', '-', 'RW'],
  ['INTERVIEWER', 'R', '-', '-', '-', 'R', '-', '-', '-', '-'],
  ['PAYROLL_OFFICER', 'R', 'R', '-', 'RW', 'R', '-', '-', '-', 'R'],
  ['PROJECT_MANAGER', 'R', 'R', '-', 'R', 'RW', '-', '-', '-', 'R'],
  ['DEPARTMENT_MANAGER', 'R', 'R', 'RW', 'R', 'RW', '-', '-', '-', 'RW'],
  ['DIRECT_MANAGER', 'R', 'R', '-', 'R', 'RW', '-', '-', '-', 'RW'],
  ['EMPLOYEE', 'R', '-', '-', 'R', 'R', '-', '-', '-', 'RW'],
];

const tripleFrom = (grant: string) => ({
  read: grant.includes('R'),
  write: grant.includes('W'),
  delete: grant.includes('D'),
});

afterEach(() => vi.restoreAllMocks());

describe('canonical role seeding', () => {
  it('defines all 14 canonical roles with the supplied module permission matrix', () => {
    expect(enterpriseRoles).toHaveLength(14);
    expect(new Set(enterpriseRoles.map((role) => role.name)).size).toBe(14);

    for (const [name, ...grants] of expectedRows) {
      const role = enterpriseRoles.find((candidate) => candidate.name === name);
      expect(role).toBeDefined();
      expect(Object.keys(role!.permissions).sort()).toEqual([...modules].sort());
      expect(role!.permissions).toEqual(
        Object.fromEntries(modules.map((module, index) => [module, tripleFrom(grants[index])]))
      );
    }
  });

  it('uses insert-only upserts so reruns do not overwrite existing canonical or custom roles', async () => {
    const bulkWrite = vi.spyOn(Role, 'bulkWrite').mockResolvedValue({ upsertedCount: 14 } as never);

    await seedRoles();
    await seedRoles();

    expect(bulkWrite).toHaveBeenCalledTimes(2);
    for (const [operations] of bulkWrite.mock.calls) {
      expect(operations).toHaveLength(14);
      expect(operations.every((operation) => 'updateOne' in operation)).toBe(true);
      for (const operation of operations) {
        if (!('updateOne' in operation)) continue;
        expect(operation.updateOne.upsert).toBe(true);
        expect(operation.updateOne.update).toHaveProperty('$setOnInsert');
        expect(operation.updateOne.update).not.toHaveProperty('$set');
      }
    }
  });
});
