import { Request, Response, NextFunction } from "express"
import { ResponseHandler } from "../utils/responseHandler"

const norm = (r: string | undefined) => (r || "").toUpperCase().replace(/[\s_]/g, "")

const ADMIN = new Set(["ADMIN", "SUPERADMIN"])

export function authorizePayrollWorkflowActor(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    ResponseHandler.unauthorized(res, "User not authenticated")
    return
  }
  const n = norm(req.user.role)
  const allowed = new Set([
    "ADMIN",
    "SUPERADMIN",
    "CEO",
    "FINANCEMANAGER",
    "HRMANAGER",
    "PAYROLLOFFICER",
  ])
  if (allowed.has(n)) {
    next()
    return
  }
  ResponseHandler.forbidden(res, "Not allowed to perform payroll workflow actions")
}

export function authorizePayrollBankExport(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    ResponseHandler.unauthorized(res, "User not authenticated")
    return
  }
  const n = norm(req.user.role)
  if (ADMIN.has(n) || n === "FINANCEMANAGER" || n === "PAYROLLOFFICER") {
    next()
    return
  }
  ResponseHandler.forbidden(res, "Only Finance, Payroll, or Admin can export bank files")
}

export function authorizePayrollAuditRead(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    ResponseHandler.unauthorized(res, "User not authenticated")
    return
  }
  const n = norm(req.user.role)
  const allowed = new Set(["ADMIN", "SUPERADMIN", "CEO", "FINANCEMANAGER", "HRMANAGER"])
  if (allowed.has(n)) {
    next()
    return
  }
  ResponseHandler.forbidden(res, "Insufficient access to payroll audit logs")
}

export function authorizePayrollComplianceRead(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    ResponseHandler.unauthorized(res, "User not authenticated")
    return
  }
  const n = norm(req.user.role)
  const allowed = new Set([
    "ADMIN",
    "SUPERADMIN",
    "CEO",
    "FINANCEMANAGER",
    "HRMANAGER",
    "PAYROLLOFFICER",
    "COUNTRYMANAGER",
  ])
  if (allowed.has(n)) {
    next()
    return
  }
  ResponseHandler.forbidden(res, "Insufficient access to payroll compliance data")
}
