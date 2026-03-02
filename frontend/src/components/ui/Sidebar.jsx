import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Users,
  Calendar,
  RefreshCw,
  DollarSign,
  Award,
  AlertTriangle,
  FileCheck,
  Home,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Plane,
  Calculator,
  User,
  LogOut,
  Clock,
  Settings,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  Shield,
  Layers,
  Database,
  Building
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

  const userRole = (user?.role || "").toUpperCase()
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
    if (isCollapsed) return;

    const path = location.pathname;

    const isDashboardPath =
      path === "/dashboard" ||
      path === "/admin/dashboard" ||
      path === "/employee/dashboard";

    if (isDashboardPath) {
      setOpenGroups({
        employeeCenter: false,
        recruitment: false,
        timeAttendance: false,
        payroll: false,
        administration: false,
        appraisal: false,
        disciplinaryActions: false,
        documentRequests: false,
      });
      return;
    }

    setOpenGroups({
      employeeCenter:
        path.startsWith("/employee-center") ||
        path.startsWith("/dashboard/onboarding") ||
        path.startsWith("/employee-transfer") ||
        path.startsWith("/digital-locker"),

      timeAttendance: path.startsWith("/attendance"),

      payroll:
        path.startsWith("/payroll") ||
        path.startsWith("/tickets") ||
        path.startsWith("/indemnity"),

      administration:
        path.startsWith("/settings") ||
        path.startsWith("/dashboard/users") ||
        (path.startsWith("/admin/") && !path.startsWith("/admin/dashboard")),

      recruitment:
        path.startsWith("/recruitment") ||
        path.startsWith("/staff-requisition") ||
        path.startsWith("/dashboard/candidate-management") ||
        path.startsWith("/dashboard/offer-management"),

      documentRequests: path.includes("document-requests"),
      disciplinaryActions: path.includes("disciplinary-actions"),
      appraisal: path.includes("/appraisal"),
    });
  }, [location.pathname, isCollapsed]);

  const canSee = (moduleKey) => {
    if (['SUPER ADMIN', 'ADMIN'].includes(userRole)) return true
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
    if (userRole === ROLES.DEPARTMENT_MANAGER) return "Staff Requisition"
    return "Recruitment"
  }

  const getPayrollLabel = () => {
    if ([ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.PAYROLL_OFFICER].includes(userRole)) return "Manage Payroll"
    return "Payroll"
  }

  const getLeaveManagementPath = () => {
    if (userRole === "ADMIN") return "/role/admin/leave-management"
    if (userRole === ROLES.EMPLOYEE) return "/role/employee/leave-management"
    return `/role/${userRole?.toLowerCase() || 'employee'}/leave-management`
  }

  const SidebarLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        location.pathname === to ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-foreground"
      )}
      title={isCollapsed ? label : ""}
    >
      {Icon && <Icon size={20} className="shrink-0" />}
      <span className={cn("truncate transition-all duration-300", isCollapsed && "w-0 opacity-0 overflow-hidden")}>{label}</span>
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
          <span
            className={cn(
              "flex-1 truncate text-left transition-all duration-300",
              isCollapsed && "w-0 opacity-0 overflow-hidden"
            )}
          >
            {label}
          </span>
          {!isCollapsed &&
            (openGroups[id] ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ))}
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
          location.pathname === to ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )

  const renderSidebarContent = () => {
    if (!userRole) return null

    if (userRole === "ADMIN") {
      return (
        <>
          <SidebarLink to="/admin/dashboard" icon={Home} label="Dashboard" />

          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/employee-center/all-employees" label="All Employees" />
            <SubLink to="/dashboard/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-transfer" label="Transfers & Promotions" />
            <SubLink to="/digital-locker" label="Digital Locker (Docs)" />
          </SidebarGroup>

          <SidebarGroup id="recruitment" icon={Briefcase} label="Recruitment & Staffing">
            <SubLink to="/recruitment" label="Recruitment Process" />
            <SubLink to="/staff-requisition" label="Staff Requisition" />
            <SubLink to="/dashboard/candidate-management" label="Candidate Management" />
            <SubLink to="/dashboard/offer-management" label="Offer Management" />
          </SidebarGroup>

          <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
            <SubLink to="/attendance" label="Attendance Records" />
            <SubLink to="/attendance/shifts" label="Shift Roster" />
            <SubLink to="/attendance/holidays" label="Holiday List" />
            <SubLink to="/attendance/leave-management" label="Leave Management" />
          </SidebarGroup>

          <SidebarGroup id="payroll" icon={DollarSign} label="Payroll & Compliance">
            <SubLink to="/payroll" label="Payroll Processing" />
            <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
            <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
          </SidebarGroup>

          <SidebarLink to="/role/admin/appraisal" icon={Award} label="Performance (PMS)" />
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

    if (userRole === "EMPLOYEE") {
      return (
        <>
          <SidebarLink to="/employee/dashboard" icon={Home} label="Dashboard" />
          <SidebarLink to="/dashboard/employee/attendance" icon={Calendar} label="My Attendance" />
          <SidebarLink to="/dashboard/employee/tasks" icon={FileCheck} label="My Tasks" />

          <Link
            to="/dashboard/employee/make-transfer"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              location.pathname === "/dashboard/employee/make-transfer"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-accent text-foreground"
            )}
            title={isCollapsed ? "Make Transfer Request" : ""}
          >
            <ArrowLeftRight size={20} className="shrink-0" />
            <span className={cn("truncate transition-all duration-300", isCollapsed && "w-0 opacity-0 overflow-hidden")}>
              Make Transfer Request
            </span>
          </Link>

          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}

          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/employee/appraisal" label="My Appraisal" />
          </SidebarGroup>

          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
            <SubLink to="/role/employee/document-requests" label="Request Document" />
          </SidebarGroup>
        </>
      )
    }

    if (userRole === ROLES.HR_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('recruitment') && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              <SubLink to="/recruitment" label="Recruitment Process" />
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/onboarding" label="Onboarding" />
            </SidebarGroup>
          )}
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {canSee('employees') && <SidebarLink to="/employee-transfer" icon={RefreshCw} label="Employee Transfer" />}
          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}
          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/hr_manager/appraisal" label="HR Manager Appraisal" />
          </SidebarGroup>
          <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary">
            <SubLink to="/role/hr_manager/disciplinary-actions" label="Manage Actions" />
          </SidebarGroup>
          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
            <SubLink to="/role/hr_manager/document-requests" label="HR Manager Requests" />
          </SidebarGroup>
        </>
      )
    }

    if (userRole === ROLES.HR_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('recruitment') && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              <SubLink to="/recruitment" label="Recruitment Process" />
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/onboarding" label="Onboarding" />
            </SidebarGroup>
          )}
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}
          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
            <SubLink to="/role/hr_officer/appraisal" label="HR Officer Appraisal" />
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

    if (userRole === ROLES.CEO || userRole === ROLES.COUNTRY_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('recruitment') && <SidebarLink to="/recruitment" icon={Users} label="View Recruitment" />}
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {canSee('reports') && <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />}
        </>
      )
    }

    if (userRole === ROLES.DEPARTMENT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('recruitment') && <SidebarLink to="/staff-requisition" icon={Users} label={getRecruitmentLabel()} />}
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          <SidebarLink to="/role/department_manager/appraisal" icon={Award} label="Appraisal" />
        </>
      )
    }

    if (userRole === ROLES.DIRECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          <SidebarLink to="/role/direct_manager/appraisal" icon={Award} label="Appraisal" />
        </>
      )
    }

    if (userRole === ROLES.PAYROLL_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}
        </>
      )
    }

    if (userRole === ROLES.PROJECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    if (userRole === ROLES.OPERATIONS_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    if (userRole === ROLES.CAMP_BOSS) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {canSee('attendance') && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    return <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />}
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
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={cn("flex h-16 items-center px-4 border-b transition-all", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Briefcase className="h-8 w-8 text-primary shrink-0" />
            <span className={cn("text-lg font-bold truncate transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
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
