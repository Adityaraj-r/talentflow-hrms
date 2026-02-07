import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Users,
  Calendar,
  CalendarClock, // <--- Add this
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
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLES, PERMISSIONS } from "../../constants/roles"
import { useAuth } from "../../contexts/AuthContext"

const Sidebar = ({
  isOpen,
  toggleSidebar,
  userRole: propUserRole,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  companyName,
}) => {
  const location = useLocation()
  const { user } = useAuth()

  // Local state for collapse if no prop is provided
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false)
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed
  const setIsCollapsed = propSetIsCollapsed || setLocalIsCollapsed

  const [openGroups, setOpenGroups] = useState({
    employeeCenter: false, recruitment: false, timeAttendance: false,
    payroll: false, administration: true, // Auto-open for your current work
    appraisal: false, disciplinaryActions: false, documentRequests: false,
  })

  const userRole = (user?.role || propUserRole || localStorage.getItem("userRole"))?.toUpperCase()

  useEffect(() => {
    if (isCollapsed) {
      setOpenGroups({
        employeeCenter: false, recruitment: false, timeAttendance: false,
        payroll: false, administration: false, appraisal: false,
        disciplinaryActions: false, documentRequests: false,
      })
    }
  }, [propIsCollapsed])// Sync local collapsed state with prop
  useEffect(() => {
    if (propIsCollapsed !== undefined) {
      setIsCollapsed(propIsCollapsed)
    }
  }, [propIsCollapsed])

  // ✅ FIX: Automatically open the active dropdown based on the current URL
  useEffect(() => {
    if (isCollapsed) return; // Don't auto-open if the whole sidebar is collapsed

    const path = location.pathname;

    setOpenGroups((prev) => ({
      ...prev,
      // 1. Keep 'Time & Attendance' open for these paths
      timeAttendance: path.startsWith("/attendance") || path.includes("leave-management"),

      
    }));
  }, [location.pathname, isCollapsed]);

  if (!userRole) {
    console.log("No user role detected, sidebar will not render")
    return null
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

  // --- Helper Functions ---
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

  const renderSidebarContent = () => {
    const permissions = PERMISSIONS[userRole] || {}

    // Admin role - Show ALL options
    if (userRole === 'ADMIN') {
      return (
        <>
          {/* Dashboard */}
          <Link
            to="/admin/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/admin/dashboard"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <Home size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </Link>

          {/* Employee Center - Expandable */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("employeeCenter")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                openGroups.employeeCenter ? "bg-gray-100 dark:bg-gray-700" : ""
              )}
              title={isCollapsed ? "Employee Center" : ""}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Users size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Employee Center</span>}
              </div>
              {!isCollapsed && (openGroups.employeeCenter ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />)}
            </button>
            {openGroups.employeeCenter && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/dashboard/users"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/dashboard/users"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="All Employees"
                  >
                    <span className="truncate">All Employees</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/onboarding"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/dashboard/onboarding"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="Onboarding & KYC"
                  >
                    <span className="truncate">Onboarding & KYC</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employee-transfer"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/employee-transfer"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="Transfers & Promotions"
                  >
                    <span className="truncate">Transfers & Promotions</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/digital-locker"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/digital-locker"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="Digital Locker (Docs)"
                  >
                    <span className="truncate">Digital Locker (Docs)</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Recruitment & Staffing */}
          <Link
            to="/recruitment"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/recruitment"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Recruitment & Staffing" : ""}
          >
            <Briefcase size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Recruitment & Staffing</span>}
          </Link>

          {/* Time & Attendance - Expandable */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("timeAttendance")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                openGroups.timeAttendance ? "bg-gray-100 dark:bg-gray-700" : ""
              )}
              title={isCollapsed ? "Time & Attendance" : ""}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Clock size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Time & Attendance</span>}
              </div>
              {!isCollapsed && (openGroups.timeAttendance ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />)}
            </button>
            
            {/* ✅ THIS IS THE UPDATED LIST */}
            {openGroups.timeAttendance && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/attendance"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/attendance"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="Attendance Records"
                  >
                    <span className="truncate">Attendance Records</span>
                  </Link>
                </li>
                
                {/* ✅ NEW SHIFT ROSTER LINK */}
                <li>
                  <Link
                    to="/attendance/shifts"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/attendance/shifts"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    {/* Optional Icon inside list */}
                    Shift Roster
                  </Link>
                </li>

                <li>
                  <Link
                    to="/role/admin/leave-management"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/role/admin/leave-management"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                    title="Leave Management"
                  >
                    <span className="truncate">Leave Management</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>

    const SidebarGroup = ({ id, icon: Icon, label, children }) => {
      const isActive = children && Array.isArray(children) 
        ? children.some(child => child?.props?.to === location.pathname)
        : children?.props?.to === location.pathname;

      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleGroup(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-foreground"
            )}
          >
            <Icon size={20} className="shrink-0" />
            <span className={cn("flex-1 truncate text-left transition-all duration-300", isCollapsed && "w-0 opacity-0 overflow-hidden")}>{label}</span>
            {!isCollapsed && (openGroups[id] ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />)}
          </button>
          {openGroups[id] && !isCollapsed && <ul className="ml-9 space-y-1 border-l pl-2">{children}</ul>}
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

    // 1. ADMIN - FULL ENTERPRISE SUITE
    if (userRole === "ADMIN") {
      return (
        <>
          <SidebarLink to="/admin/dashboard" icon={Home} label="Dashboard" />
          
          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/dashboard/users" label="All Employees" /> {/* Keeping User Mgmt Here */}
            <SubLink to="/dashboard/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-transfer" label="Transfers & Promotions" />
            <SubLink to="/digital-locker" label="Digital Locker (Docs)" />
          </SidebarGroup>
          
          <SidebarLink to="/recruitment" icon={Briefcase} label="Recruitment & Staffing" />
          
          <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
            <SubLink to="/attendance" label="Attendance Records" />
            <SubLink to="/role/admin/leave-management" label="Leave Management" />
          </SidebarGroup>
          
          <SidebarGroup id="payroll" icon={DollarSign} label="Payroll & Compliance">
            <SubLink to="/payroll" label="Payroll Processing" />
            <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
            <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
          </SidebarGroup>
          
          <SidebarLink to="/role/admin/appraisal" icon={Award} label="Performance (PMS)" />
          <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />
          
          {/* UPDATED ADMINISTRATION MODULE (Without User Mgmt) */}
          <SidebarGroup id="administration" icon={Settings} label="Administration">
            <SubLink to="/settings" label="System Settings" icon={Settings} />
            <SubLink to="/roles-permissions" label="Roles & Permissions" icon={Shield} />
            <SubLink to="/admin/company-structure" label="Company Structure" icon={Building} />
            <SubLink to="/admin/audit-logs" label="Audit Logs" icon={FileText} />
            <SubLink to="/admin/integrations" label="Integrations" icon={Layers} />
            <SubLink to="/admin/backups" label="Backup & Data" icon={Database} />
          </SidebarGroup>
        </>
      )
    }

    // 2. EMPLOYEE
    if (userRole === "EMPLOYEE") {
      return (
        <>
          <SidebarLink to="/employee/dashboard" icon={Home} label="Dashboard" />
          <SidebarLink to="/dashboard/employee/attendance" icon={Calendar} label="My Attendance" />
          <SidebarLink to="/dashboard/employee/tasks" icon={FileCheck} label="My Tasks" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.appraisal && (
            <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
              <SubLink to="/role/employee/appraisal" label="Employee Appraisal" />
            </SidebarGroup>
          )}
          {permissions.documentRequests && (
             <SidebarGroup id="documentRequests" icon={FileCheck} label="Document Requests">
               <SubLink to="/role/employee/document-requests" label="Employee Documents" />
             </SidebarGroup>
          )}
        </>
      )
    }

    // 3. HR MANAGER
    if (userRole === ROLES.HR_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.recruitment && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              {permissions.recruitment.recruitmentProcess && <SubLink to="/recruitment" label="Recruitment Process" />}
              {permissions.recruitment.staffRequisition && <SubLink to="/staff-requisition" label="Staff Requisition" />}
              {permissions.recruitment.onboarding && <SubLink to="/onboarding" label="Onboarding" />}
            </SidebarGroup>
          )}
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.employeeTransfer && <SidebarLink to="/employee-transfer" icon={RefreshCw} label="Employee Transfer" />}
          {permissions.payroll && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              {permissions.payroll.payrollProcessing && <SubLink to="/payroll" label="Payroll Processing" />}
              {permissions.payroll.ticketsAndAdvances && <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />}
              {permissions.payroll.indemnityCalculation && <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />}
            </SidebarGroup>
          )}
          {permissions.appraisal && (
            <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
              <SubLink to="/role/hr_manager/appraisal" label="HR Manager Appraisal" />
            </SidebarGroup>
          )}
          {permissions.disciplinaryActions && (
            <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary Actions">
              <SubLink to="/role/hr_manager/disciplinary-actions" label="HR Manager Disciplinary Actions" />
            </SidebarGroup>
          )}
          {permissions.documentRequests && (
            <SidebarGroup id="documentRequests" icon={FileCheck} label="Document Requests">
              <SubLink to="/role/hr_manager/document-requests" label="HR Manager Document Requests" />
            </SidebarGroup>
          )}
        </>
      )
    }

    // 4. HR OFFICER
    if (userRole === ROLES.HR_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.recruitment && (
            <SidebarGroup id="recruitment" icon={Users} label={getRecruitmentLabel()}>
              {permissions.recruitment.recruitmentProcess && <SubLink to="/recruitment" label="Recruitment Process" />}
              {permissions.recruitment.staffRequisition && <SubLink to="/staff-requisition" label="Staff Requisition" />}
              {permissions.recruitment.onboarding && <SubLink to="/onboarding" label="Onboarding" />}
            </SidebarGroup>
          )}
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.payroll && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              {permissions.payroll.payrollProcessing && <SubLink to="/payroll" label="Payroll Processing" />}
              {permissions.payroll.ticketsAndAdvances && <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />}
              {permissions.payroll.indemnityCalculation && <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />}
            </SidebarGroup>
          )}
          {permissions.appraisal && (
            <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
              <SubLink to="/role/hr_officer/appraisal" label="HR Officer Appraisal" />
            </SidebarGroup>
          )}
          {permissions.disciplinaryActions && (
            <SidebarGroup id="disciplinaryActions" icon={AlertTriangle} label="Disciplinary Actions">
              <SubLink to="/role/hr_officer/disciplinary-actions" label="HR Officer Disciplinary Actions" />
            </SidebarGroup>
          )}
          {permissions.documentRequests && (
            <SidebarGroup id="documentRequests" icon={FileCheck} label="Document Requests">
              <SubLink to="/role/hr_officer/document-requests" label="HR Officer Document Requests" />
            </SidebarGroup>
          )}
        </>
      )
    }

    // 5. CEO
    if (userRole === ROLES.CEO) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.recruitment && <SidebarLink to="/recruitment" icon={Users} label={getRecruitmentLabel()} />}
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.reports && <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />}
        </>
      )
    }

    // 6. COUNTRY MANAGER
    if (userRole === ROLES.COUNTRY_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.recruitment && <SidebarLink to="/recruitment" icon={Users} label={getRecruitmentLabel()} />}
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.reports && <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />}
        </>
      )
    }

    // 7. DEPARTMENT MANAGER
    if (userRole === ROLES.DEPARTMENT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.recruitment && <SidebarLink to="/staff-requisition" icon={Users} label={getRecruitmentLabel()} />}
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.appraisal && <SidebarLink to="/role/department_manager/appraisal" icon={Award} label="Appraisal" />}
        </>
      )
    }

    // 8. DIRECT MANAGER
    if (userRole === ROLES.DIRECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.appraisal && <SidebarLink to="/role/direct_manager/appraisal" icon={Award} label="Appraisal" />}
        </>
      )
    }

    // 9. PAYROLL OFFICER
    if (userRole === ROLES.PAYROLL_OFFICER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
          {permissions.payroll && (
            <SidebarGroup id="payroll" icon={DollarSign} label={getPayrollLabel()}>
              {permissions.payroll.payrollProcessing && <SubLink to="/payroll" label="Payroll Processing" />}
              {permissions.payroll.ticketsAndAdvances && <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />}
              {permissions.payroll.indemnityCalculation && <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />}
            </SidebarGroup>
          )}
        </>
      )
    }

    // 10. PROJECT MANAGER
    if (userRole === ROLES.PROJECT_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    // 11. OPERATIONS MANAGER
    if (userRole === ROLES.OPERATIONS_MANAGER) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    // 12. CAMP BOSS
    if (userRole === ROLES.CAMP_BOSS) {
      return (
        <>
          <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
          {permissions.leaveManagement && <SidebarLink to={getLeaveManagementPath()} icon={Calendar} label="Leave Management" />}
        </>
      )
    }

    // Fallback
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
            className="absolute -right-3 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent"
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