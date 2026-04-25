import Role from '../models/Role.model';

const enterpriseRoles = [
  {
    name: "ADMIN",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: true, delete: true },
      employees: { read: true, write: true, delete: true },
      recruitment: { read: true, write: false, delete: false },
      payroll: { read: true, write: true, delete: true },
      attendance: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      roles: { read: true, write: true, delete: true },
      audit: { read: true, write: false, delete: false },
      performance: { read: false, write: false, delete: false },
    }
  },
  {
    name: "SUPER_ADMIN",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: true, delete: true },
      employees: { read: true, write: true, delete: true },
      recruitment: { read: true, write: true, delete: true },
      payroll: { read: true, write: true, delete: true },
      attendance: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      roles: { read: true, write: true, delete: true },
      audit: { read: true, write: false, delete: false },
      performance: { read: false, write: false, delete: false },
    }
  },
  {
    name: "CEO",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: false },
    }
  },
  {
    name: "COUNTRY_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: false, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: false, delete: false },
    }
  },
  {
    name: "OPERATIONS_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: true, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: false, delete: false },
    }
  },
  {
    name: "FINANCE_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      payroll: { read: true, write: true, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: false, delete: false },
    }
  },
  {
    name: "HR_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: true, delete: true },
      recruitment: { read: true, write: true, delete: true },
      payroll: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: true },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: true },
    }
  },
  {
    name: "HR_OFFICER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: true, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: false },
    }
  },
  {
    name: "PAYROLL_OFFICER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      payroll: { read: true, write: true, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: false, delete: false },
    }
  },
  {
    name: "PROJECT_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: false, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: false, delete: false },
    }
  },
  {
    name: "DEPARTMENT_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: false },
    }
  },
  {
    name: "DIRECT_MANAGER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: false },
    }
  },
  {
    name: "EMPLOYEE",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: true, write: true, delete: false },
    }
  }
];

export const seedRoles = async () => {
  try {
    console.log('Checking role definitions...');

    for (const roleDef of enterpriseRoles) {
      const existingRole = await Role.findOne({ name: roleDef.name });

      if (!existingRole) {
        console.log(`Creating missing role: ${roleDef.name}`);
        await Role.create(roleDef);
      } else {
        console.log(`Role already exists (skipping): ${roleDef.name}`);
        if (roleDef.name === 'ADMIN') {
          await Role.updateOne(
            { name: 'ADMIN' },
            {
              $set: {
                'permissions.recruitment': { read: true, write: false, delete: false }
              }
            }
          );
          console.log('ADMIN recruitment permissions synced to read-only (write/delete false).');
        }
      }
    }

    for (const roleDef of enterpriseRoles) {
      const p = (roleDef.permissions as { payroll?: { read: boolean; write: boolean; delete: boolean } }).payroll;
      if (p) {
        await Role.updateOne({ name: roleDef.name }, { $set: { "permissions.payroll": p } });
      }
    }
    console.log("Payroll permissions synced on system roles.");

    for (const roleDef of enterpriseRoles) {
      const a = (roleDef.permissions as { audit: { read: boolean; write: boolean; delete: boolean } }).audit;
      await Role.updateOne({ name: roleDef.name }, { $set: { "permissions.audit": a } });
    }
    console.log("Audit permissions synced on system roles.");

    for (const roleDef of enterpriseRoles) {
      const s = (roleDef.permissions as { settings: { read: boolean; write: boolean; delete: boolean } }).settings;
      await Role.updateOne({ name: roleDef.name }, { $set: { "permissions.settings": s } });
    }
    console.log("Settings permissions synced on system roles.");

    for (const roleDef of enterpriseRoles) {
      const perf = (roleDef.permissions as { performance?: { read: boolean; write: boolean; delete: boolean } }).performance;
      if (perf) {
        await Role.updateOne({ name: roleDef.name }, { $set: { "permissions.performance": perf } });
      }
    }
    console.log("Performance (PMS) permissions synced on system roles.");

    console.log('Role seeder check complete.');
  } catch (error) {
    console.error('Role seeding failed:', error);
  }

};
