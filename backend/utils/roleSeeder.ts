import Role from '../models/Role.model';

export const enterpriseRoles = [
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
    name: "CEO",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: false, delete: false },
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
      recruitment: { read: false, write: false, delete: false },
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
      recruitment: { read: false, write: false, delete: false },
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
    name: "INTERVIEWER",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: false, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      audit: { read: false, write: false, delete: false },
      performance: { read: false, write: false, delete: false },
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
      recruitment: { read: false, write: false, delete: false },
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
  const operations = enterpriseRoles.map((roleDef) => ({
    updateOne: {
      filter: { name: roleDef.name },
      update: {
        $setOnInsert: {
          name: roleDef.name,
          isSystemRole: roleDef.isSystemRole,
          permissions: roleDef.permissions,
        },
      },
      upsert: true,
    },
  }));

  const result = await Role.bulkWrite(operations as any);
  console.log(
    `Canonical roles ensured (${enterpriseRoles.length}; inserted ${result.upsertedCount ?? 0}).`
  );
};
