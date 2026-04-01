import { Request } from "express"
import PayrollAuditLog from "../models/payrollAuditLog.model"
import { AuthRequest } from "../middleware/auth.middleware"

export async function logPayrollAudit(params: {
  req: Request
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  const { req, action, entityType, entityId, before, after, metadata } = params
  const auth = req as AuthRequest
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress

  await PayrollAuditLog.create({
    action,
    entityType,
    entityId,
    actorUserId: auth.user?.id || "unknown",
    actorEmail:  auth.user?.email,
    actorRole:   auth.user?.role,
    ip,
    before,
    after,
    metadata,
  })
}
