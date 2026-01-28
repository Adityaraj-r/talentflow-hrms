"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
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

const Sidebar = ({ isOpen, toggleSidebar, userRole: propUserRole, isCollapsed: propIsCollapsed, setIsCollapsed: propSetIsCollapsed }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(propIsCollapsed || false)
  const [openGroups, setOpenGroups] = useState({
    employeeCenter: false,
    recruitment: false,
    timeAttendance: false,
    payroll: false,
    administration: false,
    appraisal: false,
    disciplinaryActions: false,
    documentRequests: false,
  })

  const userRole = (user?.role || propUserRole || localStorage.getItem('userRole'))?.toUpperCase()

  console.log("Sidebar Render - user:", user, "userRole:", userRole)

  // Sync local collapsed state with prop
  useEffect(() => {
    if (propIsCollapsed !== undefined) {
      setIsCollapsed(propIsCollapsed)
    }
  }, [propIsCollapsed])

  if (!userRole) {
    console.log("No user role detected, sidebar will not render")
    return null
  }

  const toggleGroup = (group) => {
    if (!isCollapsed) {
      setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
    }
  }

  // Update parent state when collapsed changes
  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    if (propSetIsCollapsed) {
      propSetIsCollapsed(newCollapsed)
    }
    if (newCollapsed) {
      setOpenGroups({
        employeeCenter: false,
        recruitment: false,
        timeAttendance: false,
        payroll: false,
        administration: false,
        appraisal: false,
        disciplinaryActions: false,
        documentRequests: false,
      })
    }
  }

  const getRecruitmentLabel = () => {
    switch (userRole) {
      case ROLES.HR_MANAGER:
      case ROLES.HR_OFFICER:
        return "Manage Recruitment"
      case ROLES.CEO:
      case ROLES.COUNTRY_MANAGER:
        return "View Recruitment"
      case ROLES.DEPARTMENT_MANAGER:
        return "Staff Requisition"
      default:
        return "Recruitment"
    }
  }

  const getPayrollLabel = () => {
    switch (userRole) {
      case ROLES.HR_MANAGER:
      case ROLES.HR_OFFICER:
      case ROLES.PAYROLL_OFFICER:
        return "Manage Payroll"
      default:
        return "Payroll"
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const getLeaveManagementPath = () => {
    switch (userRole) {
      case ROLES.CEO:
        return "/role/ceo/leave-management"
      case ROLES.COUNTRY_MANAGER:
        return "/role/country_manager/leave-management"
      case ROLES.HR_MANAGER:
        return "/role/hr_manager/leave-management"
      case ROLES.HR_OFFICER:
        return "/role/hr_officer/leave-management"
      case ROLES.DEPARTMENT_MANAGER:
        return "/role/department_manager/leave-management"
      case ROLES.DIRECT_MANAGER:
        return "/role/direct_manager/leave-management"
      case ROLES.EMPLOYEE:
        return "/role/employee/leave-management"
      case ROLES.PAYROLL_OFFICER:
        return "/role/payroll_officer/leave-management"
      case ROLES.PROJECT_MANAGER:
        return "/role/project_manager/leave-management"
      case ROLES.OPERATIONS_MANAGER:
        return "/role/operations_manager/leave-management"
      case ROLES.CAMP_BOSS:
        return "/role/camp_boss/leave-management"
      case 'ADMIN':
        return "/role/admin/leave-management"
      default:
        return "/dashboard"
    }
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
            {!isCollapsed && <span>Dashboard</span>}
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
              <div className="flex items-center gap-3">
                <Users size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Employee Center</span>}
              </div>
              {!isCollapsed && (openGroups.employeeCenter ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </button>
            {openGroups.employeeCenter && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/dashboard/users"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/dashboard/users"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    All Employees
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/onboarding"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/dashboard/onboarding"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Onboarding & KYC
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employee-transfer"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/employee-transfer"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Transfers & Promotions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/digital-locker"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/digital-locker"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Digital Locker (Docs)
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
            {!isCollapsed && <span>Recruitment & Staffing</span>}
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
              <div className="flex items-center gap-3">
                <Clock size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Time & Attendance</span>}
              </div>
              {!isCollapsed && (openGroups.timeAttendance ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </button>
            {openGroups.timeAttendance && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/attendance"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/attendance"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Attendance Records
                  </Link>
                </li>
                <li>
                  <Link
                    to="/role/admin/leave-management"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/role/admin/leave-management"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Leave Management
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Payroll & Compliance - Expandable */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("payroll")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
              )}
              title={isCollapsed ? "Payroll & Compliance" : ""}
            >
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Payroll & Compliance</span>}
              </div>
              {!isCollapsed && (openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </button>
            {openGroups.payroll && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/payroll"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/payroll"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Payroll Processing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tickets"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/tickets"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Tickets & Advances
                  </Link>
                </li>
                <li>
                  <Link
                    to="/indemnity"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/indemnity"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Indemnity Calculation
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Performance (PMS) */}
          <Link
            to="/role/admin/appraisal"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/role/admin/appraisal"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Performance (PMS)" : ""}
          >
            <Award size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Performance (PMS)</span>}
          </Link>

          {/* Reports & Analytics */}
          <Link
            to="/reports"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/reports"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Reports & Analytics" : ""}
          >
            <TrendingUp size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Reports & Analytics</span>}
          </Link>

          {/* Administration - Expandable */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("administration")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                openGroups.administration ? "bg-gray-100 dark:bg-gray-700" : ""
              )}
              title={isCollapsed ? "Administration" : ""}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Administration</span>}
              </div>
              {!isCollapsed && (openGroups.administration ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </button>
            {openGroups.administration && !isCollapsed && (
              <ul className="ml-6 space-y-1 border-l pl-4 dark:border-gray-700">
                <li>
                  <Link
                    to="/settings"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/settings"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    System Settings
                  </Link>
                </li>
                <li>
                  <Link
                    to="/roles-permissions"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === "/roles-permissions"
                        ? "text-primary font-medium"
                        : "hover:text-primary text-muted-foreground"
                    )}
                  >
                    Roles & Permissions
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </>
      )
    }

    // Employee role
    if (userRole === 'EMPLOYEE') {
      return (
        <>
          <Link
            to="/employee/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/employee/dashboard"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <Home size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/dashboard/employee/attendance"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/dashboard/employee/attendance"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "My Attendance" : ""}
          >
            <Calendar size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>My Attendance</span>}
          </Link>

          <Link
            to="/dashboard/employee/tasks"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/dashboard/employee/tasks"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "My Tasks" : ""}
          >
            <FileCheck size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>My Tasks</span>}
          </Link>

          {permissions.leaveManagement && (
            <Link
              to={getLeaveManagementPath()}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === getLeaveManagementPath()
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
              )}
              title={isCollapsed ? "Leave Management" : ""}
            >
              <Calendar size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Leave Management</span>}
            </Link>
          )}

          {permissions.appraisal && (
            <div className="space-y-1">
              <button
                onClick={() => toggleGroup("appraisal")}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                  openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                )}
                title={isCollapsed ? "Appraisal" : ""}
              >
                <div className="flex items-center gap-3">
                  <Award size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span>Appraisal</span>}
                </div>
                {!isCollapsed && (openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              </button>
              {openGroups.appraisal && !isCollapsed && (
                <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                  <li>
                    <Link
                      to="/role/employee/appraisal"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location.pathname === "/role/employee/appraisal"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                      )}
                    >
                      <span>Employee Appraisal</span>
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}

          {permissions.documentRequests && (
            <div className="space-y-1">
              <button
                onClick={() => toggleGroup("documentRequests")}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                  openGroups.documentRequests ? "bg-gray-100 dark:bg-gray-700" : ""
                )}
                title={isCollapsed ? "Document Requests" : ""}
              >
                <div className="flex items-center gap-3">
                  <FileCheck size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span>Document Requests</span>}
                </div>
                {!isCollapsed && (openGroups.documentRequests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              </button>
              {openGroups.documentRequests && !isCollapsed && (
                <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                  <li>
                    <Link
                      to="/role/employee/document-requests"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location.pathname === "/role/employee/document-requests"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                      )}
                    >
                      <span>Employee Document Requests</span>
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}
        </>
      )
    }

    // HR MANAGER Role
    switch (userRole) {
      case ROLES.HR_MANAGER:
        return (
          <>
            {permissions.recruitment && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("recruitment")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.recruitment ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                  title={isCollapsed ? getRecruitmentLabel() : ""}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{getRecruitmentLabel()}</span>}
                  </div>
                  {!isCollapsed && (openGroups.recruitment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>
                {openGroups.recruitment && !isCollapsed && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.recruitment.recruitmentProcess && (
                      <li>
                        <Link
                          to="/recruitment"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/recruitment"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Recruitment Process</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.staffRequisition && (
                      <li>
                        <Link
                          to="/staff-requisition"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/staff-requisition"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Staff Requisition</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.onboarding && (
                      <li>
                        <Link
                          to="/onboarding"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/onboarding"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Onboarding</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
                title={isCollapsed ? "Leave Management" : ""}
              >
                <Calendar size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Leave Management</span>}
              </Link>
            )}
            {permissions.employeeTransfer && (
              <Link
                to="/employee-transfer"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === "/employee-transfer"
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
                title={isCollapsed ? "Employee Transfer" : ""}
              >
                <RefreshCw size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Employee Transfer</span>}
              </Link>
            )}
            {permissions.payroll && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("payroll")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                  title={isCollapsed ? getPayrollLabel() : ""}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{getPayrollLabel()}</span>}
                  </div>
                  {!isCollapsed && (openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>
                {openGroups.payroll && !isCollapsed && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.payroll.payrollProcessing && (
                      <li>
                        <Link
                          to="/payroll"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/payroll"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Payroll Processing</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.ticketsAndAdvances && (
                      <li>
                        <Link
                          to="/tickets"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/tickets"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Plane size={16} />
                          <span>Tickets & Advances</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.indemnityCalculation && (
                      <li>
                        <Link
                          to="/indemnity"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/indemnity"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Calculator size={16} />
                          <span>Indemnity Calculation</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.appraisal && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("appraisal")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                  title={isCollapsed ? "Appraisal" : ""}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Appraisal</span>}
                  </div>
                  {!isCollapsed && (openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>
                {openGroups.appraisal && !isCollapsed && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/appraisal"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/appraisal"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Appraisal</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.disciplinaryActions && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("disciplinaryActions")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.disciplinaryActions ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                  title={isCollapsed ? "Disciplinary Actions" : ""}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Disciplinary Actions</span>}
                  </div>
                  {!isCollapsed && (openGroups.disciplinaryActions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>
                {openGroups.disciplinaryActions && !isCollapsed && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/disciplinary-actions"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/disciplinary-actions"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Disciplinary Actions</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.documentRequests && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("documentRequests")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.documentRequests ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                  title={isCollapsed ? "Document Requests" : ""}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Document Requests</span>}
                  </div>
                  {!isCollapsed && (openGroups.documentRequests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>
                {openGroups.documentRequests && !isCollapsed && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/document-requests"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/document-requests"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Document Requests</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        )

      case ROLES.HR_OFFICER:
      case ROLES.CEO:
      case ROLES.COUNTRY_MANAGER:
      case ROLES.DEPARTMENT_MANAGER:
      case ROLES.DIRECT_MANAGER:
        return (
          <>
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === "/dashboard"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
              )}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <Home size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
                title={isCollapsed ? "Leave Management" : ""}
              >
                <Calendar size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Leave Management</span>}
              </Link>
            )}
          </>
        )

      default:
        return (
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/dashboard"
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
            )}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <Home size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        )
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b px-4 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">HRMS</span>
            </div>
          )}
          {isCollapsed && <Briefcase className="h-6 w-6 text-primary mx-auto" />}
          
          {/* Collapse Button - Desktop only */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:block p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {renderSidebarContent()}
          </div>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
