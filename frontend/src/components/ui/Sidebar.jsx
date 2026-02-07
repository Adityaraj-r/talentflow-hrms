import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Users, Calendar, CalendarClock, RefreshCw, DollarSign, Award, AlertTriangle,
  FileCheck, Home, ChevronDown, ChevronRight, ChevronLeft,
  Briefcase, Plane, Calculator, Clock, Settings, TrendingUp, Shield,
  Building, Database, FileText, Layers, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLES } from "../../constants/roles" // Keep roles for string comparison
import { useAuth } from "../../contexts/AuthContext"
import { useUser } from "../../contexts/UserContext" // ✅ Live DB Permissions

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  companyName,
}) => {
  const location = useLocation()
  const { logout } = useAuth()
  const { user } = useUser() // ✅ Get Live User Data

  const [localIsCollapsed, setLocalIsCollapsed] = useState(false)
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed
  const setIsCollapsed = propSetIsCollapsed || setLocalIsCollapsed
  const [openGroups, setOpenGroups] = useState({})

  // Normalize Data
  const userRole = (user?.role || "").toUpperCase()
  const dbPermissions = user?.permissions || {} // ✅ Permissions from Matrix

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

  // --- 1. THE PERMISSION CHECKER ---
  // Returns TRUE if the user has 'read' access in the Matrix
  const canSee = (moduleKey) => {
    // Super Admin & Admin bypass
    if (['SUPER ADMIN', 'ADMIN'].includes(userRole)) return true;
    // Check DB
    return dbPermissions[moduleKey]?.read === true;
  }

  // --- 2. LAYOUT HELPERS ---
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

  const SidebarLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
        location.pathname === to ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      title={isCollapsed ? label : ""}
    >
      {Icon && <Icon size={20} className="shrink-0" />}
      <span className={cn("truncate transition-all", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>{label}</span>
    </Link>
  )

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
            isActive ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          title={isCollapsed ? label : ""}
        >
          <Icon size={20} className="shrink-0" />
          <span className={cn("flex-1 truncate text-left transition-all", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>{label}</span>
          {!isCollapsed && (openGroups[id] ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />)}
        </button>
        {openGroups[id] && !isCollapsed && <ul className="ml-4 mt-1 space-y-1 border-l pl-2 border-border/50">{children}</ul>}
      </div>
    )
  }

  // --- 3. ROLE-SPECIFIC CONTENT (With Permission Wrappers) ---
  const renderSidebarContent = () => {
    
    // === ADMIN ===
    if (userRole === "ADMIN") {
      return (
        <>
          <SidebarLink to="/admin/dashboard" icon={Home} label="Dashboard" />
          
          <SidebarGroup id="employeeCenter" icon={Users} label="Employee Center">
            <SubLink to="/dashboard/users" label="All Employees" />
            <SubLink to="/dashboard/onboarding" label="Onboarding & KYC" />
            <SubLink to="/employee-transfer" label="Transfers" />
            <SubLink to="/digital-locker" label="Digital Locker" />
          </SidebarGroup>
          
          <SidebarLink to="/recruitment" icon={Briefcase} label="Recruitment & ATS" />
          
          <SidebarGroup id="timeAttendance" icon={Clock} label="Time & Attendance">
            <SubLink to="/attendance" label="Attendance Records" />
            <SubLink to="/role/admin/leave-management" label="Leave Management" />
          </SidebarGroup>
          
          <SidebarGroup id="payroll" icon={DollarSign} label="Payroll & Finance">
            <SubLink to="/payroll" label="Payroll Processing" />
            <SubLink to="/tickets" label="Tickets" icon={Plane} />
            <SubLink to="/indemnity" label="Indemnity" icon={Calculator} />
          </SidebarGroup>
          
          <SidebarLink to="/role/admin/appraisal" icon={Award} label="Performance (PMS)" />
          <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />
          
          <SidebarGroup id="administration" icon={Settings} label="Administration">
            <SubLink to="/settings" label="System Settings" icon={Settings} />
            <SubLink to="/admin/roles" label="Roles & Permissions" icon={Shield} />
            <SubLink to="/admin/company-structure" label="Company Structure" icon={Building} />
            <SubLink to="/admin/audit-logs" label="Audit Logs" icon={FileText} />
            <SubLink to="/admin/integrations" label="Integrations" icon={Layers} />
            <SubLink to="/admin/backups" label="Backup & Data" icon={Database} />
          </SidebarGroup>
        </>
      )
    }

    // === EMPLOYEE ===
    if (userRole === "EMPLOYEE") {
      return (
        <>
          <SidebarLink to="/employee/dashboard" icon={Home} label="Dashboard" />
          {/* Always show these for employees */}
          <SidebarLink to="/dashboard/employee/attendance" icon={Calendar} label="My Attendance" />
          <SidebarLink to="/dashboard/employee/tasks" icon={FileCheck} label="My Tasks" />
          
          {/* Permission Controlled */}
          {canSee('attendance') && <SidebarLink to="/role/employee/leave-management" icon={Calendar} label="Leave Management" />}
          
          {/* Special modules not in main matrix? Add logic or keep generic check */}
          <SidebarGroup id="appraisal" icon={Award} label="Appraisal">
              <SubLink to="/role/employee/appraisal" label="My Appraisal" />
          </SidebarGroup>
          
          <SidebarGroup id="documentRequests" icon={FileCheck} label="Documents">
               <SubLink to="/role/employee/document-requests" label="Request Document" />
          </SidebarGroup>
        </>
      )
    }

    // === HR MANAGER ===
    if (userRole === ROLES.HR_MANAGER) {
      return (
        <>
          {canSee('dashboard') && <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />}

          {/* HR Manager Specific Sub-Links - Only show if 'recruitment' is enabled */}
          {canSee('recruitment') && (
            <SidebarGroup id="recruitment" icon={Users} label="Manage Recruitment">
              <SubLink to="/recruitment" label="Recruitment Process" />
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/onboarding" label="Onboarding" />
            </SidebarGroup>
          )}

          {canSee('attendance') && <SidebarLink to="/role/hr_manager/leave-management" icon={Calendar} label="Leave Management" />}
          {canSee('employees') && <SidebarLink to="/employee-transfer" icon={RefreshCw} label="Employee Transfer" />}

          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label="Manage Payroll">
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets & Advances" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity Calculation" icon={Calculator} />
            </SidebarGroup>
          )}

          {/* Kept as standard for now, could add 'appraisal' to matrix later */}
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

    // === HR OFFICER ===
    if (userRole === ROLES.HR_OFFICER) {
      return (
        <>
          {canSee('dashboard') && <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />}

          {canSee('recruitment') && (
            <SidebarGroup id="recruitment" icon={Users} label="Manage Recruitment">
              <SubLink to="/recruitment" label="Recruitment Process" />
              <SubLink to="/staff-requisition" label="Staff Requisition" />
              <SubLink to="/dashboard/onboarding" label="Onboarding" />
            </SidebarGroup>
          )}

          {canSee('attendance') && <SidebarLink to="/role/hr_manager/leave-management" icon={Calendar} label="Leave Management" />}

          {canSee('payroll') && (
            <SidebarGroup id="payroll" icon={DollarSign} label="Manage Payroll">
              <SubLink to="/payroll" label="Payroll Processing" />
              <SubLink to="/tickets" label="Tickets" icon={Plane} />
              <SubLink to="/indemnity" label="Indemnity" icon={Calculator} />
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

    // === DEPARTMENT MANAGER ===
    if (userRole === ROLES.DEPARTMENT_MANAGER) {
      return (
        <>
          {canSee('dashboard') && <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />}
          
          {/* Note: Dept Manager only sees Requisition, NOT full recruitment */}
          {canSee('recruitment') && <SidebarLink to="/staff-requisition" icon={Users} label="Staff Requisition" />}
          
          {canSee('attendance') && <SidebarLink to="/role/department_manager/leave-management" icon={Calendar} label="Leave Management" />}
          
          <SidebarLink to="/role/department_manager/appraisal" icon={Award} label="Appraisal" />
        </>
      )
    }

    // === CEO ===
    if (userRole === ROLES.CEO) {
      return (
        <>
          {canSee('dashboard') && <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />}
          {canSee('recruitment') && <SidebarLink to="/recruitment" icon={Users} label="View Recruitment" />}
          {canSee('attendance') && <SidebarLink to="/role/ceo/leave-management" icon={Calendar} label="Leave Management" />}
          <SidebarLink to="/reports" icon={TrendingUp} label="Reports & Analytics" />
        </>
      )
    }

    // === FALLBACK ===
    return <SidebarLink to="/dashboard" icon={Home} label="Dashboard" />
  }

  // --- Main Render ---
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
        {/* Toggle Button */}
        <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-8 z-50 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent hidden lg:flex"
        >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Header */}
        <div className={cn("flex h-16 items-center px-4 border-b transition-all", isCollapsed ? "justify-center" : "justify-between")}>
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
             <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
               <Briefcase className="h-6 w-6" />
             </div>
             <span className={cn("text-lg font-bold truncate transition-all", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
               {companyName || "HRMS"}
             </span>
          </Link>
        </div>

        {/* Content */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
          {renderSidebarContent()}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
            <button onClick={logout} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all", isCollapsed && "justify-center px-0")}>
                <LogOut size={20} className="shrink-0" />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar