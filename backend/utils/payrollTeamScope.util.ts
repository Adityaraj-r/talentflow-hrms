import User from "../models/User.model"
import Employee from "../models/Employee.model"

const norm = (r: string | undefined) => (r || "").toUpperCase().replace(/[\s_]/g, "")

export function isTeamPayrollViewerRole(role: string | undefined): boolean {
  return ["DEPARTMENTMANAGER", "DIRECTMANAGER", "OPERATIONSMANAGER", "PROJECTMANAGER"].includes(norm(role))
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export type PayrollActor = {
  id: string
  role: string
  email?: string
  firstName?: string
  lastName?: string
  department?: string
}

export async function getPayrollTeamUserIdStrings(actor: PayrollActor): Promise<Set<string>> {
  const r = norm(actor.role)
  const ids = new Set<string>()
  ids.add(String(actor.id))

  if (!isTeamPayrollViewerRole(actor.role)) {
    return ids
  }

  const self = await User.findById(actor.id).select("department email firstName lastName").lean()
  const dept = (self?.department || actor.department || "").trim()
  const email = (self?.email || actor.email || "").toLowerCase()
  const fullName = `${self?.firstName || actor.firstName || ""} ${self?.lastName || actor.lastName || ""}`.trim()

  if (["DEPARTMENTMANAGER", "OPERATIONSMANAGER"].includes(r) && dept) {
    const deptUsers = await User.find({
      department: dept,
      isDeleted: { $ne: true },
      isActive: true,
    })
      .select("_id")
      .lean()
    deptUsers.forEach(u => ids.add(String(u._id)))
  }

  if (["DIRECTMANAGER", "PROJECTMANAGER"].includes(r)) {
    const or: { reportingManager: RegExp }[] = []
    if (email) or.push({ reportingManager: new RegExp(`^${escapeRegex(email)}$`, "i") })
    if (fullName) or.push({ reportingManager: new RegExp(`^${escapeRegex(fullName)}$`, "i") })
    if (or.length) {
      const emps = await Employee.find({ $or: or }).select("userId").lean()
      for (const e of emps) {
        if (e.userId) ids.add(String(e.userId))
      }
    }
    if (dept) {
      const deptUsers = await User.find({
        department: dept,
        isDeleted: { $ne: true },
        isActive: true,
      })
        .select("_id")
        .lean()
      deptUsers.forEach(u => ids.add(String(u._id)))
    }
  }

  return ids
}

export function filterPayrollLeanDocForTeam(
  doc: Record<string, unknown> & { employees?: { employeeId: string; grossPay?: number; netPay?: number }[] },
  allowed: Set<string>
): Record<string, unknown> | null {
  const emps = (doc.employees || []).filter(e => allowed.has(String(e.employeeId)))
  if (!emps.length) return null
  const totalGross = emps.reduce((s, e) => s + (Number(e.grossPay) || 0), 0)
  const totalNet = emps.reduce((s, e) => s + (Number(e.netPay) || 0), 0)
  return { ...doc, employees: emps, totalGross, totalNet }
}
