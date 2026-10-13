import { beforeEach, describe, expect, it, vi } from "vitest";

const { findRoles, employeeModel, userModel, attendanceModel } = vi.hoisted(() => ({
  findRoles: vi.fn(),
  employeeModel: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn(), countDocuments: vi.fn() },
  userModel: { findById: vi.fn(), find: vi.fn() },
  attendanceModel: { find: vi.fn() },
}));
vi.mock("../models/Role.model", () => ({ default: { find: findRoles } }));
vi.mock("../models/Employee.model", () => ({ default: employeeModel }));
vi.mock("../models/User.model", () => ({ default: userModel }));
vi.mock("../models/Attendance.model", () => ({ default: attendanceModel }));
vi.mock("../models/CorrectionRequest.model", () => ({ default: {} }));
vi.mock("../services/notification.service", () => ({}));

import {
  authorize,
  authorizeByMatrix,
  MODULE_KEYS,
} from "../middleware/role.middleware";
import { getEmployeeById } from "../controllers/employee.controller";
import { getAllAttendance } from "../controllers/attendance.controller";
import {
  buildAttendanceQuery,
  buildEmployeeManagerScope,
  employeeMatchesManagerScope,
  filterEmployeeSensitiveFields,
} from "../utils/authorizationScope.util";

const permission = (overrides: Record<string, Record<string, boolean>> = {}) => ({
  permissions: {
    get: (module: string) => overrides[module],
  },
});

const invoke = async (middleware: any, role: string) => {
  const req: any = { user: { role, email: "test@example.invalid" } };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  const next = vi.fn();
  await middleware(req, res, next);
  return { res, next };
};

describe("Phase 1A authorization remediation", () => {
  beforeEach(() => {
    findRoles.mockReset();
    Object.values(employeeModel).forEach((method: any) => method.mockReset());
    Object.values(userModel).forEach((method: any) => method.mockReset());
    attendanceModel.find.mockReset();
  });

  const response = () => ({
    statusCode: 200,
    body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  });

  it("denies direct managers cross-team employee IDs and allows assigned IDs", async () => {
    employeeModel.findOne.mockReturnValue({ select: () => Promise.resolve({ employeeCode: "M-01", department: "Sales" }) });
    const target: any = {
      _id: "507f1f77bcf86cd799439011",
      reportingManagerId: "M-02",
      role: "EMPLOYEE",
      department: "Sales",
      toObject: () => ({ reportingManagerId: target.reportingManagerId, role: "EMPLOYEE", department: "Sales" }),
    };
    employeeModel.findById.mockResolvedValue(target);
    const req: any = { params: { id: target._id }, user: { id: "manager-user", role: "DIRECT_MANAGER" } };
    const denied = response();
    await getEmployeeById(req, denied as any);
    expect(denied.statusCode).toBe(403);

    target.reportingManagerId = "M-01";
    const allowed = response();
    await getEmployeeById(req, allowed as any);
    expect(allowed.statusCode).toBe(200);
  });

  it("denies department managers employee IDs from another department", async () => {
    employeeModel.findOne.mockReturnValue({ select: () => Promise.resolve({ department: "Sales" }) });
    userModel.findById.mockReturnValue({ select: () => Promise.resolve(null) });
    employeeModel.findById.mockResolvedValue({
      _id: "507f1f77bcf86cd799439012", department: "Finance", toObject: () => ({ department: "Finance" }),
    });
    const res = response();
    await getEmployeeById({
      params: { id: "507f1f77bcf86cd799439012" },
      user: { id: "department-manager", role: "DEPARTMENT_MANAGER", department: "Sales" },
    } as any, res as any);
    expect(res.statusCode).toBe(403);
  });

  it("allows an employee to read their own profile and denies another employee profile", async () => {
    const ownId = "507f1f77bcf86cd799439013";
    const otherId = "507f1f77bcf86cd799439014";
    employeeModel.findById.mockResolvedValue({
      _id: ownId,
      toObject: () => ({ _id: ownId, bankDetails: { accountNumber: "test" }, kycDetails: { panNumber: "test" } }),
    });
    employeeModel.findOne.mockReturnValue({ select: () => Promise.resolve({ _id: ownId }) });
    const allowed = response();
    await getEmployeeById({ params: { id: ownId }, user: { id: "employee-user", email: "employee@example.invalid", role: "EMPLOYEE" } } as any, allowed as any);
    expect(allowed.statusCode).toBe(200);
    expect(allowed.body).not.toHaveProperty("bankDetails");
    expect(allowed.body).not.toHaveProperty("kycDetails");

    employeeModel.findById.mockResolvedValue({ _id: otherId, toObject: () => ({ _id: otherId }) });
    const denied = response();
    await getEmployeeById({ params: { id: otherId }, user: { id: "employee-user", email: "employee@example.invalid", role: "EMPLOYEE" } } as any, denied as any);
    expect(denied.statusCode).toBe(403);
  });

  it("scopes attendance records and intersects a requested cross-team user ID", async () => {
    employeeModel.findOne.mockReturnValue({ select: () => Promise.resolve({ employeeCode: "M-01", department: "Sales" }) });
    employeeModel.find.mockReturnValue({ select: () => Promise.resolve([
      { userId: "team-user", email: "team@example.invalid" },
    ]) });
    userModel.find.mockReturnValue({ select: () => Promise.resolve([]) });
    attendanceModel.find.mockReturnValue({ populate: () => ({ sort: async () => [] }) });
    const res = response();
    await getAllAttendance({
      query: { userId: "outside-team", date: "2026-10-13" },
      user: { id: "manager-user", role: "DIRECT_MANAGER" },
    } as any, res as any);
    const appliedQuery: any = attendanceModel.find.mock.calls[0][0];
    expect(appliedQuery.$and).toContainEqual({ userId: "outside-team" });
    expect(appliedQuery.$and).toContainEqual({ userId: { $in: ["team-user"] } });
    expect(res.statusCode).toBe(200);
  });

  it("limits department-manager attendance queries to employees in the manager's department", async () => {
    employeeModel.findOne.mockReturnValue({ select: () => Promise.resolve({ department: "Sales", employeeCode: "DM-01" }) });
    employeeModel.find.mockReturnValue({ select: () => Promise.resolve([{ userId: "sales-user", email: "sales@example.invalid" }]) });
    userModel.find.mockReturnValue({ select: () => Promise.resolve([]) });
    attendanceModel.find.mockReturnValue({ populate: () => ({ sort: async () => [] }) });
    const res = response();
    await getAllAttendance({ query: {}, user: { id: "dept-manager", role: "DEPARTMENT_MANAGER", department: "Sales" } } as any, res as any);
    expect(employeeModel.find).toHaveBeenCalledWith({ department: "Sales" });
    expect(attendanceModel.find).toHaveBeenCalledWith({ userId: { $in: ["sales-user"] } });
  });

  it("limits direct-manager employee lists and detail lookups to assigned employees", () => {
    expect(buildEmployeeManagerScope("DIRECT_MANAGER", "Sales", "M-01")).toEqual({
      reportingManagerId: "M-01",
      role: "EMPLOYEE",
    });
    expect(buildEmployeeManagerScope("DIRECT_MANAGER", "Sales", undefined)).toEqual({
      _id: { $exists: false },
    });
    expect(employeeMatchesManagerScope("DIRECT_MANAGER", {
      reportingManagerId: "M-01", role: "EMPLOYEE", department: "Sales",
    }, { employeeCode: "M-01" })).toBe(true);
    expect(employeeMatchesManagerScope("DIRECT_MANAGER", {
      reportingManagerId: "M-02", role: "EMPLOYEE", department: "Sales",
    }, { employeeCode: "M-01" })).toBe(false);
  });

  it("limits department-manager detail access to their own department", () => {
    expect(buildEmployeeManagerScope("DEPARTMENT_MANAGER", "Sales")).toEqual({ department: "Sales" });
    expect(employeeMatchesManagerScope("DEPARTMENT_MANAGER", { department: "Sales" }, { department: "Sales" })).toBe(true);
    expect(employeeMatchesManagerScope("DEPARTMENT_MANAGER", { department: "Finance" }, { department: "Sales" })).toBe(false);
  });

  it("intersects attendance user filters with manager team IDs", () => {
    const query: any = buildAttendanceQuery({
      date: "2026-10-13",
      requestedUserId: "outside-team-id",
      scopedUserIds: ["team-user-id"],
    });
    expect(query.$and).toContainEqual({ userId: "outside-team-id" });
    expect(query.$and).toContainEqual({ userId: { $in: ["team-user-id"] } });
    expect(query.$and).toContainEqual({ date: "2026-10-13" });
  });

  it("applies the confirmed bank and KYC field policy independently", () => {
    const employee = () => ({ bankDetails: { accountNumber: "redacted-in-test" }, kycDetails: { panNumber: "redacted-in-test" } });
    expect(filterEmployeeSensitiveFields(employee(), "FINANCE_MANAGER")).toHaveProperty("bankDetails");
    expect(filterEmployeeSensitiveFields(employee(), "PAYROLL_OFFICER")).toHaveProperty("bankDetails");
    for (const role of ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"]) {
      expect(filterEmployeeSensitiveFields(employee(), role)).toHaveProperty("kycDetails");
    }
    expect(filterEmployeeSensitiveFields(employee(), "DEPARTMENT_MANAGER")).not.toHaveProperty("bankDetails");
    expect(filterEmployeeSensitiveFields(employee(), "DEPARTMENT_MANAGER")).not.toHaveProperty("kycDetails");
  });

  it("requires Recruitment delete permission for destructive job access", async () => {
    findRoles.mockResolvedValue([
      { name: "HR_OFFICER", ...permission({ recruitment: { read: true, write: true, delete: false } }) },
      { name: "HR_MANAGER", ...permission({ recruitment: { read: true, write: true, delete: true } }) },
    ]);
    const guard = authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "delete");
    const officer = await invoke(guard, "HR_OFFICER");
    const manager = await invoke(guard, "HR_MANAGER");
    expect(officer.next).not.toHaveBeenCalled();
    expect(officer.res.statusCode).toBe(403);
    expect(manager.next).toHaveBeenCalledOnce();
  });

  it("requires Settings write permission for department synchronization", async () => {
    findRoles.mockResolvedValue([
      { name: "OPERATIONS_MANAGER", ...permission({ settings: { read: true, write: true, delete: false } }) },
      { name: "FINANCE_MANAGER", ...permission({ settings: { read: false, write: false, delete: false } }) },
    ]);
    const guard = authorizeByMatrix(MODULE_KEYS.SETTINGS, "write");
    expect((await invoke(guard, "OPERATIONS_MANAGER")).next).toHaveBeenCalledOnce();
    expect((await invoke(guard, "FINANCE_MANAGER")).res.statusCode).toBe(403);
  });

  it("keeps referral reads and approvals within both module permissions and role allowlists", async () => {
    findRoles.mockResolvedValue([
      { name: "CEO", ...permission({ recruitment: { read: true, write: false, delete: false } }) },
      { name: "FINANCE_MANAGER", ...permission({ recruitment: { read: false, write: false, delete: false } }) },
      { name: "HR_MANAGER", ...permission({ recruitment: { read: true, write: true, delete: true } }) },
    ]);
    const recruitmentRead = authorizeByMatrix(MODULE_KEYS.RECRUITMENT, "read");
    expect((await invoke(recruitmentRead, "CEO")).next).toHaveBeenCalledOnce();
    expect((await invoke(recruitmentRead, "FINANCE_MANAGER")).res.statusCode).toBe(403);

    const reviewRoleGuard = authorize("ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER");
    expect((await invoke(reviewRoleGuard, "HR_MANAGER")).next).toHaveBeenCalledOnce();
    expect((await invoke(reviewRoleGuard, "CEO")).res.statusCode).toBe(403);
  });
});
