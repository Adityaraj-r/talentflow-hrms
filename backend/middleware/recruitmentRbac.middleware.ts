import { Request, Response, NextFunction } from "express"

const normalizeRole = (role?: string) =>
  (role || "").toString().toUpperCase().replace(/\s+/g, "_")

export const RECRUITMENT_ROLES = {
  HR_OFFICER: "HR_OFFICER",
  HR_MANAGER: "HR_MANAGER",
  INTERVIEWER: "INTERVIEWER",
  CEO: "CEO",
  DEPARTMENT_MANAGER: "DEPARTMENT_MANAGER",
  DIRECT_MANAGER: "DIRECT_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const

export const requireRecruitmentRole = (...allowedRoles: string[]) => {
  const allowed = allowedRoles.map(normalizeRole)
  return (req: Request, res: Response, next: NextFunction) => {
    const role = normalizeRole((req as any).user?.role)
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      next();
      return;
    }
    if (!allowed.includes(role)) {
      return res.status(403).json({ success: false, message: "Access denied for this recruitment action" })
    }
    next()
  }
}

export const requireRecruitmentOperator = requireRecruitmentRole(
  RECRUITMENT_ROLES.HR_OFFICER,
  RECRUITMENT_ROLES.HR_MANAGER
)

export const requireRequisitionRequester = requireRecruitmentRole(
  RECRUITMENT_ROLES.HR_OFFICER,
  RECRUITMENT_ROLES.HR_MANAGER,
  RECRUITMENT_ROLES.DEPARTMENT_MANAGER
)

export const requireRecruitmentApprover = requireRecruitmentRole(RECRUITMENT_ROLES.HR_MANAGER)

export const requireRecruitmentReadRole = requireRecruitmentRole(
  RECRUITMENT_ROLES.HR_OFFICER,
  RECRUITMENT_ROLES.HR_MANAGER,
  RECRUITMENT_ROLES.CEO,
  RECRUITMENT_ROLES.ADMIN,
  RECRUITMENT_ROLES.SUPER_ADMIN
)

export const requireRequisitionReadRole = requireRecruitmentRole(
  RECRUITMENT_ROLES.HR_OFFICER,
  RECRUITMENT_ROLES.HR_MANAGER,
  RECRUITMENT_ROLES.DEPARTMENT_MANAGER,
  RECRUITMENT_ROLES.CEO,
  RECRUITMENT_ROLES.ADMIN,
  RECRUITMENT_ROLES.SUPER_ADMIN
)

export const requireInterviewParticipantReadRole = requireRecruitmentRole(
  RECRUITMENT_ROLES.HR_OFFICER,
  RECRUITMENT_ROLES.HR_MANAGER,
  RECRUITMENT_ROLES.INTERVIEWER,
  RECRUITMENT_ROLES.DIRECT_MANAGER,
  RECRUITMENT_ROLES.PROJECT_MANAGER,
  RECRUITMENT_ROLES.OPERATIONS_MANAGER
)

export const requireApplicationStatusRole = (req: Request, res: Response, next: NextFunction) => {
  const role = normalizeRole((req as any).user?.role)

  if (["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER", "CEO"].includes(role)) {
    next();
    return;
  }

  return res.status(403).json({ success: false, message: "Access denied for this recruitment action" })
}
