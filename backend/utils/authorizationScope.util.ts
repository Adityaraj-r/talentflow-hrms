import { Types } from "mongoose";

export type ManagerRole = "DIRECT_MANAGER" | "DEPARTMENT_MANAGER";

export const buildEmployeeManagerScope = (
  role: string,
  department?: string | null,
  employeeCode?: string | null
): Record<string, unknown> | null => {
  if (role === "DIRECT_MANAGER") {
    return employeeCode
      ? { reportingManagerId: employeeCode, role: "EMPLOYEE" }
      : { _id: { $exists: false } };
  }

  if (role === "DEPARTMENT_MANAGER") {
    return department ? { department } : { _id: { $exists: false } };
  }

  return null;
};

export const employeeMatchesManagerScope = (
  role: string,
  target: { department?: string | null; reportingManagerId?: string | null; role?: string | null },
  scope: { department?: string | null; employeeCode?: string | null }
): boolean => {
  if (role === "DEPARTMENT_MANAGER") {
    return Boolean(scope.department && target.department === scope.department);
  }
  if (role === "DIRECT_MANAGER") {
    return Boolean(
      scope.employeeCode &&
        target.reportingManagerId === scope.employeeCode &&
        target.role === "EMPLOYEE"
    );
  }
  return true;
};

export const filterEmployeeSensitiveFields = <T extends Record<string, any>>(
  employee: T,
  role: string
): T => {
  if (!["FINANCE_MANAGER", "PAYROLL_OFFICER"].includes(role)) delete employee.bankDetails;
  if (!["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"].includes(role)) delete employee.kycDetails;
  return employee;
};

export const buildAttendanceQuery = (
  options: {
    date?: unknown;
    requestedUserId?: unknown;
    scopedUserIds?: Array<string | Types.ObjectId>;
  }
): Record<string, unknown> => {
  const clauses: Record<string, unknown>[] = [];
  if (options.date) clauses.push({ date: options.date });
  if (options.requestedUserId) clauses.push({ userId: options.requestedUserId });
  if (options.scopedUserIds) {
    clauses.push({ userId: { $in: options.scopedUserIds } });
  }
  if (!clauses.length) return {};
  return clauses.length === 1 ? clauses[0] : { $and: clauses };
};
