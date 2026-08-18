import { Request, Response } from "express";  /*comment*/
import mongoose from "mongoose";
import DisciplinaryCase, { DisciplinaryStatus } from "../models/DisciplinaryCase.model";
import Employee from "../models/Employee.model";
import User from "../models/User.model";
import fs from "fs";
import path from "path";

const STATUSES: DisciplinaryStatus[] = ["Pending Review", "In Progress", "Completed"];
const HR_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"];
const HR_OFFICER_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_OFFICER"];
const HR_MANAGER_ROLES = ["HR_MANAGER"];
const REPORTING_ROLES = ["DEPARTMENT_MANAGER", "DIRECT_MANAGER"];

const normalizeRole = (role?: string) => (role || "").toUpperCase().replace(/\s+/g, "_");
const isHr = (role?: string) => HR_ROLES.includes(normalizeRole(role));
const isHrOfficer = (role?: string) => HR_OFFICER_ROLES.includes(normalizeRole(role));
const isHrManager = (role?: string) => HR_MANAGER_ROLES.includes(normalizeRole(role));
const isReportingManager = (role?: string) => REPORTING_ROLES.includes(normalizeRole(role));

const getCurrentEmployee = async (user: any) => {
  if (!user) return null;

  const dbUser = await User.findById(user.id).select("employeeId employeeCode email");
  const employeeId = dbUser?.employeeId?.toString();
  const employeeCode = dbUser?.employeeCode;

  return Employee.findOne({
    $or: [
      ...(employeeId && mongoose.Types.ObjectId.isValid(employeeId) ? [{ _id: employeeId }] : []),
      ...(employeeCode ? [{ employeeCode }] : []),
      ...(dbUser?.email ? [{ email: dbUser.email }, { workEmail: dbUser.email }] : []),
    ],
  });
};

const findEmployeeByIdentifier = async (employeeId: string) => {
  if (!employeeId) return null;
  const filters: any[] = [{ employeeCode: employeeId }];
  if (mongoose.Types.ObjectId.isValid(employeeId)) filters.push({ _id: employeeId });
  return Employee.findOne({ $or: filters });
};

const caseLookup = (id: string) => {
  const filters: any[] = [{ caseId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) filters.push({ _id: id });
  return { $or: filters };
};

const caseWithEmployee = async (disciplinaryCase: any) => {
  const employee = await findEmployeeByIdentifier(disciplinaryCase.employeeId);
  const data = disciplinaryCase.toObject ? disciplinaryCase.toObject() : disciplinaryCase;

  return {
    ...data,
    employee: employee
      ? {
          _id: employee._id,
          employeeCode: employee.employeeCode,
          name: [employee.firstName, employee.MiddleName, employee.lastName].filter(Boolean).join(" "),
          department: employee.department,
          designation: employee.designation,
        }
      : null,
  };
};

const buildCaseId = async () => {
  const prefix = `DISC-${new Date().getFullYear()}-`;
  const count = await DisciplinaryCase.countDocuments({
    caseId: { $regex: `^${prefix}` },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const isValidTransition = (current: DisciplinaryStatus, next: DisciplinaryStatus) => {
  if (current === next) return true;
  if (current === "Pending Review") return next === "In Progress";
  if (current === "In Progress") return next === "Completed";
  return false;
};

export const getDisciplinaryEmployees = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = normalizeRole(user?.role);
    const dbUser = await User.findById(user.id).select("employeeCode department");
    const filter: any = { status: { $ne: "Terminated" } };

    if (role === "DIRECT_MANAGER") {
      filter.reportingManagerId = dbUser?.employeeCode || user.id;
      filter.role = "EMPLOYEE";
    } else if (role === "DEPARTMENT_MANAGER") {
      filter.department = dbUser?.department || user.department;
    } else if (!isHrOfficer(role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const employees = await Employee.find(filter)
      .select("employeeCode firstName MiddleName lastName department designation")
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: employees.map((employee) => ({
        _id: employee._id,
        employeeCode: employee.employeeCode,
        name: [employee.firstName, employee.MiddleName, employee.lastName].filter(Boolean).join(" "),
        department: employee.department,
        designation: employee.designation,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDisciplinaryCases = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = normalizeRole(user?.role);
    const { status, search } = req.query;
    const filter: any = {};

    if (!isHr(role)) {
      if (role === "EMPLOYEE") {
        const employee = await getCurrentEmployee(user);
        if (!employee) return res.json({ success: true, data: [] });
        filter.employeeId = employee.employeeCode || employee._id.toString();
      } else if (isReportingManager(role)) {
        filter.createdBy = user.id;
      } else {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
    }

    if (typeof status === "string" && STATUSES.includes(status as DisciplinaryStatus)) {
      filter.status = status;
    }

    const cases = await DisciplinaryCase.find(filter).sort({ createdAt: -1 });
    const enriched = await Promise.all(cases.map(caseWithEmployee));

    const searched =
      typeof search === "string" && search.trim()
        ? enriched.filter((item) => {
            const term = search.trim().toLowerCase();
            return (
              item.caseId?.toLowerCase().includes(term) ||
              item.employee?.name?.toLowerCase().includes(term)
            );
          })
        : enriched;

    res.json({ success: true, data: searched });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDisciplinaryCaseById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = normalizeRole(user?.role);
    const disciplinaryCase = await DisciplinaryCase.findOne(caseLookup(String(req.params.id)));

    if (!disciplinaryCase) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    if (!isHr(role)) {
      if (role === "EMPLOYEE") {
        const employee = await getCurrentEmployee(user);
        const ownId = employee?.employeeCode || employee?._id.toString();
        if (!ownId || disciplinaryCase.employeeId !== ownId) {
          return res.status(403).json({ success: false, error: "Access denied" });
        }
      } else if (!isReportingManager(role) || disciplinaryCase.createdBy?.toString() !== user.id) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
    }

    res.json({ success: true, data: await caseWithEmployee(disciplinaryCase) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDisciplinaryCase = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = normalizeRole(user?.role);
    const category = String(req.body.category || "");
    const incidentDate = String(req.body.incidentDate || "");
    const description = String(req.body.description || "");
    let employeeId = String(req.body.employeeId || "");

    if (!category || !incidentDate || !description) {
      return res.status(400).json({ success: false, error: "Required fields are missing" });
    }

    if (role === "EMPLOYEE") {
      const employee = await getCurrentEmployee(user);
      if (!employee) {
        return res.status(400).json({ success: false, error: "Employee profile not found" });
      }
      employeeId = employee.employeeCode || employee._id.toString();
    } else if (!isReportingManager(role) && !isHrOfficer(role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, error: "Employee is required" });
    }

    const targetEmployee = await findEmployeeByIdentifier(employeeId);
    if (!targetEmployee) {
      return res.status(400).json({ success: false, error: "Employee profile not found" });
    }

    if (isReportingManager(role)) {
      const dbUser = await User.findById(user.id).select("employeeCode department");
      if (
        role === "DIRECT_MANAGER" &&
        targetEmployee.reportingManagerId !== (dbUser?.employeeCode || user.id)
      ) {
        return res.status(403).json({ success: false, error: "Employee is outside your team" });
      }
      if (role === "DEPARTMENT_MANAGER" && targetEmployee.department !== (dbUser?.department || user.department)) {
        return res.status(403).json({ success: false, error: "Employee is outside your department" });
      }
    }

    const disciplinaryCase = await DisciplinaryCase.create({
      caseId: await buildCaseId(),
      employeeId: targetEmployee.employeeCode || targetEmployee._id.toString(),
      category,
      incidentDate,
      description,
      attachment: (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined,
      status: "Pending Review",
      createdBy: user.id as any,
      updatedBy: user.id as any,
    });

    res.status(201).json({ success: true, data: await caseWithEmployee(disciplinaryCase) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDisciplinaryCase = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!isHr(user?.role)) {
      return res.status(403).json({ success: false, error: "Only HR can update reviews" });
    }

    const disciplinaryCase = await DisciplinaryCase.findOne(caseLookup(String(req.params.id)));

    if (!disciplinaryCase) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    if (disciplinaryCase.status === "Completed") {
      return res.status(400).json({ success: false, error: "Completed cases are read only" });
    }

    if (isHrOfficer(user?.role)) {
      disciplinaryCase.hrRemarks = req.body.hrRemarks ?? disciplinaryCase.hrRemarks;
      if (typeof req.body.managerReviewRequested === "boolean") {
        disciplinaryCase.managerReviewRequested = req.body.managerReviewRequested;
      }
    }

    if (isHrManager(user?.role)) {
      disciplinaryCase.managerReview = req.body.managerReview ?? disciplinaryCase.managerReview;
    }

    disciplinaryCase.updatedBy = user.id as any;
    await disciplinaryCase.save();

    res.json({ success: true, data: await caseWithEmployee(disciplinaryCase) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDisciplinaryStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const status = String(req.body.status || "") as DisciplinaryStatus;

    if (!isHrOfficer(user?.role)) {
      return res.status(403).json({ success: false, error: "Only HR Officer can change status" });
    }

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const existingCase = await DisciplinaryCase.findOne(caseLookup(String(req.params.id)));
    if (!existingCase) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }
    if (existingCase.status === "Completed") {
      return res.status(400).json({ success: false, error: "Completed cases are read only" });
    }
    if (!isValidTransition(existingCase.status, status)) {
      return res.status(400).json({ success: false, error: "Invalid status transition" });
    }
    if (status === "Completed" && !existingCase.hrRemarks?.trim()) {
      return res.status(400).json({ success: false, error: "HR remarks are required before completion" });
    }

    const disciplinaryCase = await DisciplinaryCase.findOneAndUpdate(
      caseLookup(String(req.params.id)),
      { $set: { status, updatedBy: user.id } },
      { new: true }
    );

    if (!disciplinaryCase) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    res.json({ success: true, data: await caseWithEmployee(disciplinaryCase) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }

};
export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(__dirname, "../uploads", String(filename));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.download(filePath);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
