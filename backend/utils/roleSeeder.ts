import Role from '../models/Role.model';

const enterpriseRoles = [
  // --- SYSTEM ADMINS ---
  {
    name: "Super Admin",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: true, delete: true },
      employees: { read: true, write: true, delete: true },
      recruitment: { read: true, write: true, delete: true },
      payroll: { read: true, write: true, delete: true },
      attendance: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      roles: { read: true, write: true, delete: true }
    }
  },
  
  // --- EXECUTIVE LEVEL ---
  {
    name: "CEO",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false }, // Final Approver
      payroll: { read: true, write: false, delete: false },
      attendance: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "Country Manager",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false }, // View country staff
      recruitment: { read: true, write: true, delete: false }, // Approve for country
      attendance: { read: true, write: false, delete: false },
      payroll: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "Operations Manager",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },

  // --- HR DEPARTMENT ---
  {
    name: "HR Manager",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: true, delete: true },
      recruitment: { read: true, write: true, delete: true },
      payroll: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: true },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "HR Officer",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: true, delete: false },
      recruitment: { read: true, write: true, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "Payroll Officer",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false }, // Need attendance to calc pay
      payroll: { read: true, write: true, delete: false }, // Main function
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },

  // --- MANAGEMENT ---
  {
    name: "Project Manager",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false }, // Team view
      recruitment: { read: true, write: false, delete: false }, // View candidates
      attendance: { read: true, write: true, delete: false }, // Approve timesheets
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "Department Manager",
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: true, write: true, delete: false }, // Staff Requisition
      attendance: { read: true, write: true, delete: false },
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },
  {
    name: "Direct Manager", // Often a line manager or supervisor
    isSystemRole: false,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: true, write: false, delete: false },
      recruitment: { read: false, write: false, delete: false },
      attendance: { read: true, write: true, delete: false },
      payroll: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  },

  // --- GENERAL STAFF ---
  {
    name: "Employee",
    isSystemRole: true,
    permissions: {
      dashboard: { read: true, write: false, delete: false },
      employees: { read: false, write: false, delete: false },
      attendance: { read: true, write: false, delete: false }, // Own records
      recruitment: { read: false, write: false, delete: false },
      payroll: { read: true, write: false, delete: false }, // Own payslips
      settings: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false }
    }
  }
];

export const seedRoles = async () => {
  try {
    console.log('🔄 Checking Role Definitions...');

    for (const roleDef of enterpriseRoles) {
      // Check if role exists by name (case insensitive check recommended but strict string match for now)
      const existingRole = await Role.findOne({ name: roleDef.name });

      if (!existingRole) {
        console.log(`🌱 Creating missing role: ${roleDef.name}`);
        await Role.create(roleDef);
      } else {
        // Optional: Uncomment to force permission updates
        // console.log(`ℹ️ Role already exists: ${roleDef.name}`);
      }
    }
    
    console.log('✅ Role Seeder Check Complete.');
  } catch (error) {
    console.error('❌ Role seeding failed:', error);
  }
};