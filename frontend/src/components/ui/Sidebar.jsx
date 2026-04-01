import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Users, Calendar, RefreshCw, DollarSign, Award, AlertTriangle,
  FileCheck, Home, ChevronDown, ChevronRight, ChevronLeft,
  Briefcase, Plane, Calculator, LogOut, Clock, Settings,
  FileText, ArrowLeftRight, TrendingUp, Shield, Layers, Database, Building,
  LayoutDashboard, CircleDollarSign, Target, Network, FileBadge
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLES } from "@/constants/roles"
import { useUser } from "@/contexts/UserContext"

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  companyName,
}) => {
  const location = useLocation()
  const { user } = useUser()

  const [localIsCollapsed, setLocalIsCollapsed] = useState(false)
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed
  const setIsCollapsed = propSetIsCollapsed || setLocalIsCollapsed

  const [openGroups, setOpenGroups] = useState({
    employeeCenter: false, recruitment: false, timeAttendance: false,
    payroll: false, administration: false,
    appraisal: false, disciplinaryActions: false, documentRequests: false,
  })

  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const userRole = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const dbPermissions = user?.permissions || {}

  useEffect(() => {
    if (isCollapsed) {
      setOpenGroups({
        employeeCenter: false, recruitment: false, timeAttendance: false,
        payroll: false, administration: false, appraisal: false,
        disciplinaryActions: false, documentRequests: false,
      })
    }
  }, [isCollapsed])

  useEffect(() => {
    if (isCollapsed) return
    const path = location.pathname

    const isDashboardPath =
      path === "/dashboard" ||
      path === "/admin/dashboard" ||
      path === "/employee/dashboard"

    if (isDashboardPath) {
      setOpenGroups({
        employeeCenter: false, recruitment: false, timeAttendance: false,
        payroll: false, administration: false, appraisal: false,
        disciplinaryActions: false, documentRequests: false,
      })
      return
    }

    setOpenGroups({
      employeeCenter:
        path.startsWith("/employee-center") ||
        path.startsWith("/employee-center/onboarding") ||
        path.startsWith("/employee-transfer") ||
        path.startsWith("/digital-locker"),

      timeAttendance: path.startsWith("/attendance") || path.includes("/employee/attendance"),

      payroll:
        path.startsWith("/payroll") ||
        path.startsWith("/tickets") ||
        path.startsWith("/indemnity"),

      administration:
        path.startsWith("/settings") ||
        path.startsWith("/dashboard/users") ||
        (path.startsWith("/admin/") && !path.startsWith("/admin/dashboard")),

      recruitment:
        path.startsWith("/staff-requisition") ||
        path.startsWith("/ceo/recruitment") ||
        path.startsWith("/dashboard/applications") ||
        path.startsWith("/dashboard/recruitment-pipeline") ||
        path.startsWith("/dashboard/job-openings") ||
        path.startsWith("/dashboard/offer-management") ||
        path.startsWith("/dashboard/onboarding"),

      documentRequests: path.includes("document-requests"),
      disciplinaryActions: path.includes("disciplinary-actions"),
      appraisal: path.includes("/appraisal") || path.includes("/role/hr_manager/review"),
    })
  }, [location.pathname, isCollapsed])

  const canSee = (moduleKey) => {
    if (userRole === "SUPER ADMIN") return true
    if (userRole === "ADMIN") {
      return user?.permissions?.[moduleKey]?.read === true
    }
    return dbPermissions[moduleKey]?.read !== false
  }

  const toggleGroup = (group) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      setTimeout(() => {
        setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
      }, 150)
    } else {
      setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
    }
  }

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const getRecruitmentLabel = () => {
    if ([ROLES.HR_MANAGER, ROLES.HR_OFFICER].includes(userRole)) return "Manage Recruitment"
    if ([ROLES.CEO, ROLES.COUNTRY_MANAGER].includes(userRole)) return "View Recruitment"
    if (userRole === ROLES.OPERATIONS_MANAGER) return "Recruitment Oversight"
    if (userRole === ROLES.DEPARTMENT_MANAGER) return "Staff Requisition"
    if (userRole === "ADMIN") return "Recruitment & Staffing (view only)"
    return "Recruitment"
  }

  const getPayrollLabel = () => {
    if ([ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.PAYROLL_OFFICER].includes(userRole)) return "Manage Payroll"
    return "Payroll"
  }

 const getLeaveManagementPath = () => {
    return "/attendance/my-leaves"
  }

  const SidebarLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        location.pathname === to
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-accent text-foreground"
      )}
      title={isCollapsed ? label : ""}
    >
      {Icon && <Icon size={20} className="shrink-0" />}
      <span className={cn(
        "truncate transition-all duration-300",
        isCollapsed && "w-0 opacity-0 overflow-hidden"
      )}>
        {label}
      </span>
    </Link>
  )

  const SidebarGroup = ({ id, icon: Icon, label, children }) => {
    const isActive = children && Array.isArray(children)
      ? children.some(child => child?.props?.to === location.pathname)
      : children?.props?.to === location.pathname

    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup(id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-accent text-foreground"
          )}
          title={isCollapsed ? label : ""}
        >
          {Icon ? <Icon size={20} className="shrink-0" /> : null}
          <span className={cn(
            "flex-1 truncate text-left transition-all duration-300",
            isCollapsed && "w-0 opacity-0 overflow-hidden"
          )}>
            {label}
          </span>
          {!isCollapsed && (
            openGroups[id]
              ? <ChevronDown className="h-4 w-4 shrink-0" />
              : <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
        {openGroups[id] && !isCollapsed && (
          <ul className="ml-9 space-y-1 border-l pl-2">{children}</ul>
        )}
      </div>
    )
  }

  const SubLink = ({ to, label, icon: Icon }) => (
    <li>
      <Link
        to={to}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          location.pathname === to
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )

  const PayrollGroup = () => canSee("payroll") ? (
    <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
      <SubLink to="/payroll" label="Payroll Processing" />
      <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
      <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
      <SubLink to="/payroll/salary-slip" label="Salary Slips" icon={FileText} />
    </SidebarGroup>
  ) : null

  const LeaveLink = () => canSee("attendance")
    ? <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />
    : null

  const renderSidebarContent = () => {
    if (!userRole) return null

    // ── ADMIN ────────────────────────────────────────────────────────
    if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
      return (
        <>
          <SidebarLink to="/admin/dashboard" icon={Home} label="Dashboard" />

          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/employee-center/all-employees" label="All Employees" />
            <SubLink to="/employee-center/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-center/employee-transfer" label="Transfers & Promotions" />
            <SubLink to="/employee-center/digital-locker" label="Digital Locker (Docs)" />
          </SidebarGroup>

          {canSee("recruitment") && (
            <SidebarGroup id="recruitment" icon={Briefcase} label={getRecruitmentLabel()}>
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/job-openings" label="Job Openings" />
              <SubLink to="/dashboard/applications" label="Applications" />
              <SubLink to="/dashboard/recruitment-pipeline" label="Recruitment Pipeline" />
              <SubLink to="/dashboard/offer-management" label="Offer Management" />
              <SubLink to="/admin/recruitment-suggestions" label="Suggest to HR Manager" />
            </SidebarGroup>
          )}

          <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
            <SubLink to="/attendance" label="Attendance Records" />
            <SubLink to="/attendance/manual" label="Manual Attendance" />
            <SubLink to="/attendance/shifts" label="Shift Roster" />
            <SubLink to="/attendance/holidays" label="Holiday List" />
            <SubLink to="/attendance/leave-management" label="Leave Approvals" />
            <SubLink to="/attendance/leave-policies" label="Leave Policies" />
            <SubLink to="/attendance/correction-requests" label="Correction Requests" />
            <SubLink to="/attendance/overtime-approvals" label="Overtime Approvals" />
          </SidebarGroup>

          <SidebarGroup id="payroll" icon={DollarSign} label="Payroll & Compliance">
            <SubLink to="/payroll" label="Payroll Processing" />
            <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
            <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            <SubLink to="/payroll/salary-slip" label="Salary Slips" icon={FileText} />
          </SidebarGroup>

          <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />

          <SidebarGroup id="administration" icon={Settings} label="Administration">
            <SubLink to="/dashboard/users" label="User Management" icon={Users} />
            <SubLink to="/settings" label="System Settings" icon={Settings} />
            <SubLink to="/admin/roles" label="Roles & Permissions" icon={Shield} />
            <SubLink to="/admin/company-structure" label="Company Structure" icon={Building} />
            <SubLink to="/admin/audit-logs" label="Audit Logs" icon={FileText} />
            <SubLink to="/admin/integrations" label="Integrations" icon={Layers} />
          </SidebarGroup>
        </>
      )
    }

    // ── EMPLOYEE ─────────────────────────────────────────────────────
    if (userRole === "EMPLOYEE") {
      return (
        <>
          <SidebarLink to="/employee/dashboard" icon={Home} label="Dashboard" />
          <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
            <SubLink to="/dashboard/employee/attendance" label="My Attendance" />
             <SubLink to="/attendance/my-leaves" label="My Leave" />
          </SidebarGroup>
          <SidebarLink to="/dashboard/employee/tasks" icon={FileCheck} label="My Tasks" />
          <SidebarLink to="/dashboard/employee/make-transfer" icon={ArrowLeftRight} label="Make Transfer Request" />
          <SidebarLink to="/payroll/salary-slip" icon={FileText} label="My Salary Slips" />

          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/employee/appraisal" label="My Appraisal" />
          </SidebarGroup>

          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
            <SubLink to="/role/employee/document-requests" label="Request Document" />
          </SidebarGroup>
        </>
      )
    }

    // ── HR MANAGER ───────────────────────────────────────────────────
    if (userRole === ROLES.HR_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />

          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/employee-center/all-employees" label="All Employees" />
            <SubLink to="/employee-center/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-center/employee-transfer" label="Transfers & Promotions" />
            <SubLink to="/employee-center/digital-locker" label="Digital Locker" />
          </SidebarGroup>

          {canSee("recruitment") && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/job-openings" label="Job Openings" />
              <SubLink to="/dashboard/applications" label="Applications" />
              <SubLink to="/dashboard/recruitment-pipeline" label="Recruitment Pipeline" />
              <SubLink to="/dashboard/offer-management" label="Offer Management" />
              <SubLink to="/dashboard/recruitment-suggestions" label="Admin suggestions inbox" />
            </SidebarGroup>
          )}

          {canSee("attendance") && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/attendance" label="Attendance Records" />
              <SubLink to="/attendance/manual" label="Manual Attendance" />
              <SubLink to="/attendance/shifts" label="Create Shift" />
              <SubLink to="/attendance/roster" label="Shift Roster" />
              <SubLink to="/attendance/holidays" label="Holiday List" />
              <SubLink to="/attendance/leave-management" label="Leave Approvals" />
               <SubLink to="/attendance/leave-policies" label="Leave Policies" />
              <SubLink to="/attendance/correction-requests" label="Correction Requests" />
              <SubLink to="/attendance/overtime-approvals" label="Overtime Approvals" /> 
            </SidebarGroup>
          )}

          {canSee("employees") && (
            <SidebarLink to="/employee-transfer" icon={RefreshCw} label="Employee Transfer" />
          )}

          {canSee("payroll") && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}

          <SidebarGroup id="appraisal" icon={Award} label="Performance (PMS)">
            <SubLink to="/role/hr_manager/appraisal" label="Appraisal Hub" />
            <SubLink to="/role/hr_manager/appraisal/cycles" label="Manage Cycles" />
            <SubLink to="/role/ceo/appraisal" label="Analytics" icon={TrendingUp} />
          </SidebarGroup>

          <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary">
            <SubLink to="/role/hr_manager/disciplinary-actions" label="Manage Actions" />
          </SidebarGroup>

          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
            <SubLink to="/role/hr_manager/document-requests" label="HR Manager Requests" />
          </SidebarGroup>

          <LeaveLink />
        </>
      )
    }

    // ── HR OFFICER ───────────────────────────────────────────────────
    if (userRole === ROLES.HR_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />

          {canSee("recruitment") && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              <SubLink to="/staff-requisition" label="Staff Requisition" />
            </SidebarGroup>
          )}
          {canSee('attendance') && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/attendance" label="Attendance Records" />
              <SubLink to="/attendance/manual" label="Manual Attendance" />
              <SubLink to="/attendance/leave-management" label="Leave Management" />
              <SubLink to="/attendance/correction-requests" label="Correction Requests" />
              <SubLink to="/attendance/roster" label="Shift Roster" />
            </SidebarGroup>
          )}

          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}

          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/employee-center/all-employees" label="All Employees" />
            <SubLink to="/employee-center/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-center/employee-transfer" label="Transfers & Promotions" />
            <SubLink to="/employee-center/digital-locker" label="Digital Locker" />
          </SidebarGroup>

          <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary">
            <SubLink to="/role/hr_officer/disciplinary-actions" label="Manage Actions" />
          </SidebarGroup>

          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
            <SubLink to="/role/hr_officer/document-requests" label="Requests" />
          </SidebarGroup>
        </>
      )
    }

    // ── CEO / COUNTRY MANAGER ────────────────────────────────────────
   if (userRole === ROLES.CEO || userRole === ROLES.COUNTRY_MANAGER) {
      return (
        <>
          <SidebarLink to="/ceo/dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          <SidebarLink to="/ceo/analytics" icon={Users} label="Workforce Analytics" />

           <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/employee-center/all-employees" label="All Employees" />
            <SubLink to="/employee-center/employee-transfer" label="Employee Lifecycle" />
          </SidebarGroup>

          <SidebarLink to="/ceo/payroll" icon={CircleDollarSign} label="Payroll & Cost" />
          <SidebarLink to="/ceo/org-structure" icon={Network} label="Org Structure" />
          <SidebarLink to="/ceo/audit" icon={FileBadge} label="Audit Summary" />

        
          {canSee("attendance") && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/attendance" label="All Attendance Records" />
              <SubLink to="/attendance/holidays" label="Holiday List" />
            </SidebarGroup>
          )}

          {canSee("recruitment") && (
            <SidebarGroup id="recruitment" icon={Briefcase} label="View Recruitment">
              <SubLink to="/ceo/recruitment/briefing" label="CEO Briefing" />
              <SubLink to="/ceo/recruitment/executive-pipeline" label="Executive Pipeline" />
              <SubLink to="/ceo/recruitment/strategic-analytics" label="Strategic Analytics" />
              <SubLink to="/ceo/recruitment/workforce-planning" label="Workforce Planning" />
              <SubLink to="/ceo/recruitment/executive-approvals" label="Executive Approvals" />
              <SubLink to="/ceo/recruitment/employer-brand-health" label="Employer Brand Health" />
            </SidebarGroup>
          )}

          <SidebarGroup id="appraisal" icon={Award} label="Performance (PMS)">
            <SubLink to="/ceo/performance" label="CEO Overview" icon={Target} />
            <SubLink to="/role/ceo/appraisal" label="Analytics Dashboard" icon={TrendingUp} />
          </SidebarGroup>

          {canSee("reports") && (
            <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />
          )}
        </>
      );
    }

    // ── DEPARTMENT MANAGER ───────────────────────────────────────────
    if (userRole === ROLES.DEPARTMENT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('recruitment') && <SidebarLink to="/staff-requisition" icon={Users} label={getRecruitmentLabel()} />}
          {canSee('attendance') && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/dashboard/employee/attendance" label="My Attendance" />
              <SubLink to="/attendance/my-leaves" label="My Leave" />
              <SubLink to="/attendance" label="Attendance Records" />
              <SubLink to="/attendance/leave-management" label="Leave Management" />
              <SubLink to="/attendance/correction-requests" label="Correction Requests" />
              <SubLink to="/attendance/overtime-approvals" label="Overtime Approvals" />
            </SidebarGroup>
          )}

          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/department_manager/appraisal" label="Team Appraisals" />
          </SidebarGroup>

          <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary">
            <SubLink to="/role/department_manager/disciplinary-actions" label="Manage Actions" />
          </SidebarGroup>
        </>
      )
    }

    // ── DIRECT MANAGER ───────────────────────────────────────────────
    if (userRole === ROLES.DIRECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/dashboard/employee/attendance" label="My Attendance" />
              <SubLink to="/attendance/my-leaves" label="My Leave" />
              <SubLink to="/attendance" label="Attendance Records" />
              <SubLink to="/attendance/leave-management" label="Leave Management" />
              <SubLink to="/attendance/correction-requests" label="Correction Requests" />
              <SubLink to="/attendance/overtime-approvals" label="Overtime Approvals" />
            </SidebarGroup>
          )}

          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/direct_manager/appraisal" label="Team Appraisals" />
          </SidebarGroup>

          <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary">
            <SubLink to="/role/direct_manager/disciplinary-actions" label="Manage Actions" />
          </SidebarGroup>
        </>
      )
    }

    // ── PAYROLL OFFICER ──────────────────────────────────────────────
    if (userRole === ROLES.PAYROLL_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
         {canSee('attendance') && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/attendance" label="Attendance Records" />
            </SidebarGroup>
          )}
          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
              <SubLink to="/payroll/salary-slip" label="Salary Slips" icon={FileText} />
            </SidebarGroup>
          )}
        </>
      )
    }

    // ── PROJECT MANAGER ──────────────────────────────────────────────
    if (userRole === ROLES.PROJECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard/project-manager" icon={Home} label="Dashboard" />
          <SidebarLink to="/dashboard/pm/tasks" icon={FileCheck} label="Task Board" />
          <SidebarLink to="/dashboard/pm/safety" icon={AlertTriangle} label="Safety Incidents" />
          <SidebarLink to="/dashboard/pm/timesheets" icon={Clock} label="Timesheet Approvals" />
          {canSee("attendance") && (
            <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
              <SubLink to="/dashboard/employee/attendance" label="My Attendance" />
              <SubLink to="/attendance/my-leaves" label="My Leave" />
            </SidebarGroup>
          )}
        </>
      )
    }

    // ── OPERATIONS MANAGER ───────────────────────────────────────────
    if (userRole === ROLES.OPERATIONS_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee("recruitment") && (
            <SidebarGroup id="recruitment" icon={Briefcase} label={getRecruitmentLabel()}>
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/job-openings" label="Job Openings" />
              <SubLink to="/dashboard/applications" label="Applications" />
              <SubLink to="/dashboard/recruitment-pipeline" label="Recruitment Pipeline" />
              <SubLink to="/dashboard/offer-management" label="Offer Management" />
              <SubLink to="/employee-center/onboarding" label="Onboarding & KYC" />
            </SidebarGroup>
          )}
          {canSee("attendance") && <LeaveLink />}
          {canSee("employees") && (
            <SidebarLink to="/employee-transfer" icon={RefreshCw} label="Employee Transfer" />
          )}
        </>
      )
    }

    return <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out shadow-lg",
          isCollapsed ? "w-20" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent lg:flex"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </button>

        <div className={cn(
          "flex h-16 items-center px-4 border-b transition-all",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Briefcase className="h-8 w-8 text-primary shrink-0" />
            <span className={cn(
              "text-lg font-bold truncate transition-all duration-300",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              {companyName || "HRMS"}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
          {renderSidebarContent()}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
