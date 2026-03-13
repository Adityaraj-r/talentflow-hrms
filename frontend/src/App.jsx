import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { RoleProvider } from "./contexts/RoleContext"
import { SettingsProvider } from "./contexts/SettingsContext"
import { UserProvider } from "./contexts/UserContext"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { getMyPermissions, can } from "./services/permissionService"

// Auth Pages
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"
import OtpVerification from "./pages/auth/OtpVerification"

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout"

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard"
import AdminDashboard from "./pages/dashboard/AdminDashboard"
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard"
import ProjectManagerDashboard from "./pages/dashboard/ProjectManagerDashboard"
import Unauthorized from "./pages/Unauthorized"

// Administration Module
import UserManagement from "./pages/modules/administration/UserManagement"
import SystemSettings from "./pages/modules/administration/SystemSettings"
import RoleManagement from "./pages/modules/administration/RoleManagement"
import CompanyStructure from "./pages/modules/administration/CompanyStructure"
import AuditLogs from "./pages/modules/administration/AuditLogs"
import Integrations from "./pages/modules/administration/Integrations"

// Recruitment Module
import StaffRequisition from "./pages/modules/recruitment/StaffRequisition"
import Careers from "./pages/Careers"
import CreateRequisition from "./pages/modules/recruitment/CreateRequisition"
import OfferManagement from "./pages/modules/recruitment/OfferManagement"
import JobOpenings from "./pages/modules/recruitment/JobOpenings"
import ApplyJob from "./pages/ApplyJob"
import CandidateApplications from "./pages/modules/recruitment/CandidateApplications"
import RecruitmentPipeline from "./pages/modules/recruitment/RecruitmentPipeline"
import ApplicationStatus from "./pages/ApplicationStatus"

// Payroll Module
import Payroll from "./pages/modules/payroll/Payroll"
import Tickets from "./pages/modules/payroll/Tickets"
import Indemnity from "./pages/modules/payroll/Indemnity"

// Transfer Module
import EmployeeTransfer from "./pages/modules/transfer/EmployeeTransfer"
import TransferPage from "./pages/modules/transfer/TransferPage"

// Performance Module
import AdminPerformance from "./pages/modules/performance/AdminPerformance"
import ViewCycleDetails from "./pages/modules/performance/ViewCycleDetails"
import ReviewDetailPage from "./pages/modules/performance/ReviewDetailPage"
import PerformanceAnalytics from "./pages/modules/performance/PerformanceAnalytics"

// Reports Module
import ReportsPage from "./pages/modules/reports/ReportsPage"

// Employee Center Module
import DigitalLocker from "./pages/modules/employee-center/DigitalLocker"
import AllEmployees from "./pages/modules/employee-center/AllEmployees"
import EmployeeProfileView from "./pages/modules/employee-center/EmployeeProfileView"

// Project Manager Role Pages
import TaskBoard from "./pages/role/PROJECT_MANAGER/TaskBoard"
import SafetyIncidents from "./pages/role/PROJECT_MANAGER/SafetyIncidents"
import TimesheetApprovals from "./pages/role/PROJECT_MANAGER/TimesheetApprovals"

// Admin Role Pages
import AttendanceRecords from "./pages/modules/attendance/AttendanceRecords"
import AdminLeaveManagement from "./pages/role/ADMIN/LeaveManagement"
import ShiftManagement from "./pages/modules/attendance/ShiftManagement"
import HolidayManagement from "./pages/modules/attendance/HolidayManagement"

// Role-Specific Appraisal Pages
import HRManagerAppraisal from "./pages/role/HR_MANAGER/Appraisal"
import DepartmentManagerAppraisal from "./pages/role/DEPARTMENT_MANAGER/Appraisal"
import DirectManagerAppraisal from "./pages/role/DIRECT_MANAGER/Appraisal"
import EmployeeAppraisal from "./pages/role/EMPLOYEE/Appraisal"

// Role-Specific Disciplinary Actions Pages
import HRManagerDisciplinaryActions from "./pages/role/HR_MANAGER/DisciplinaryActions"
import DepartmentManagerDisciplinaryActions from "./pages/role/DEPARTMENT_MANAGER/DisciplinaryActions"
import DirectManagerDisciplinaryActions from "./pages/role/DIRECT_MANAGER/DisciplinaryActions"

// Role-Specific Document Requests Pages
import DocumentRequestsHRManager from "./pages/role/HR_MANAGER/DocumentRequests"
import DocumentRequestsHROfficer from "./pages/role/HR_OFFICER/DocumentRequests"
import DocumentRequestsEmployee from "./pages/role/EMPLOYEE/DocumentRequests"

// Role-Specific Leave Management Pages
import CEOLeaveManagement from "./pages/role/CEO/LeaveManagement"
import HRManagerLeaveManagement from "./pages/role/HR_MANAGER/LeaveManagement"
import EmployeeLeaveManagement from "./pages/role/EMPLOYEE/LeaveManagement"

// Employee Role Pages
import MyAttendance from "./pages/modules/attendance/MyAttendance"
import MyTasks from "./pages/role/EMPLOYEE/MyTasks"
import Profile from "./pages/dashboard/Profile"

const ADMIN_ROLES = ["ADMIN", "SUPER ADMIN"]

// ProtectedRoute
const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const [permLoading, setPermLoading]      = useState(false)
  const [hasPermission, setHasPermission]  = useState(null)

  const userRoleStr = typeof user?.role === "string"
    ? user.role
    : user?.role?.name || ""

  useEffect(() => {
    if (!requiredPermission || !user) return

    if (ADMIN_ROLES.includes(userRoleStr.toUpperCase())) {
      setHasPermission(true)
      return
    }

    const checkMatrix = async () => {
      setPermLoading(true)
      try {
        const permissions = await getMyPermissions(userRoleStr)
        setHasPermission(can(permissions, requiredPermission.module, requiredPermission.action))
      } catch {
        setHasPermission(false)
      } finally {
        setPermLoading(false)
      }
    }

    checkMatrix()
  }, [user, requiredPermission, userRoleStr])

  if (loading || permLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {permLoading ? "Verifying permissions..." : "Loading..."}
          </p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredPermission) {
    // FIXED: show spinner instead of blank screen while resolving
    if (hasPermission === null) return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
    return hasPermission ? children : <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole   = userRoleStr.toUpperCase()
    const normalized = allowedRoles.map(r => r.toUpperCase())

    if (!normalized.includes(userRole)) {
      if (userRole === "SUPER ADMIN" && normalized.includes("ADMIN")) return children
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

const DashboardRouter = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Loading Dashboard...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const userRoleStr = typeof user?.role === "string" ? user.role : user?.role?.name || ""
  const role = userRoleStr.toUpperCase()

  if (role === "ADMIN" || role === "SUPER ADMIN")  return <Navigate to="/admin/dashboard" replace />
  if (role === "EMPLOYEE")                          return <Navigate to="/employee/dashboard" replace />
  if (role === "PROJECT_MANAGER")                   return <Navigate to="/dashboard/project-manager" replace />
  if (role === "CEO")                               return <Navigate to="/dashboard" replace />
  if (role === "HR_MANAGER" || role === "HR_OFFICER"
    || role === "DEPARTMENT_MANAGER"
    || role === "DIRECT_MANAGER"
    || role === "OPERATIONS_MANAGER")               return <Navigate to="/dashboard" replace />

  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <RoleProvider>
            <UserProvider>
              <Router>
                <Toaster position="top-right" richColors />
                <Routes>

                  {/* ── Auth ─────────────────────────────────────────── */}
                  <Route path="/login"            element={<Login />} />
                  <Route path="/signup"           element={<Signup />} />
                  <Route path="/forgot-password"  element={<ForgotPassword />} />
                  <Route path="/otp-verification" element={<OtpVerification />} />
                  <Route path="/unauthorized"     element={<Unauthorized />} />
                  <Route path="/dashboard-redirect" element={<DashboardRouter />} />

                  {/* ── Public Recruitment ───────────────────────────── */}
                  <Route path="/careers"            element={<Careers />} />
                  <Route path="/apply/:id"          element={<ApplyJob />} />
                  <Route path="/application-status" element={<ApplicationStatus />} />

                  {/* ── Profile (any authenticated user) ─────────────── */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <DashboardLayout><Profile /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Dashboards ───────────────────────────────────── */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><AdminDashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/employee/dashboard" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout>
                        <EmployeeDashboard stats={{ leaveRequests: 3, documentsRequested: 2 }} isLoading={false} />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout><Dashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/project-manager" element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
                      <DashboardLayout><ProjectManagerDashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Project Manager ──────────────────────────────── */}
                  <Route path="/dashboard/pm/tasks" element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
                      <DashboardLayout><TaskBoard /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/pm/safety" element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
                      <DashboardLayout><SafetyIncidents /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/pm/timesheets" element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
                      <DashboardLayout><TimesheetApprovals /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Administration — MATRIX ENFORCED ─────────────── */}
                  <Route path="/dashboard/users" element={
                    <ProtectedRoute requiredPermission={{ module: "employees", action: "read" }}>
                      <DashboardLayout><UserManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}>
                      <DashboardLayout><SystemSettings /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/roles" element={
                    <ProtectedRoute requiredPermission={{ module: "roles", action: "read" }}>
                      <DashboardLayout><RoleManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/company-structure" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><CompanyStructure /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/audit-logs" element={
                    <ProtectedRoute requiredPermission={{ module: "roles", action: "read" }}>
                      <DashboardLayout><AuditLogs /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/integrations" element={
                    <ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}>
                      <DashboardLayout><Integrations /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Employee Center — MATRIX ENFORCED ────────────── */}
                  <Route path="/employee-center/all-employees" element={
                    <ProtectedRoute requiredPermission={{ module: "employees", action: "read" }}>
                      <DashboardLayout><AllEmployees /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/employee-center/employee/:id" element={
                    <ProtectedRoute requiredPermission={{ module: "employees", action: "read" }}>
                      <DashboardLayout><EmployeeProfileView /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Recruitment — MATRIX ENFORCED ────────────────── */}
                  <Route path="/staff-requisition" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "read" }}>
                      <DashboardLayout><StaffRequisition /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* FIXED: these were unprotected — now wrapped in ProtectedRoute */}
                  <Route path="/dashboard/applications" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "read" }}>
                      <DashboardLayout><CandidateApplications /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/recruitment-pipeline" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "read" }}>
                      <DashboardLayout><RecruitmentPipeline /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/job-openings" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "read" }}>
                      <DashboardLayout><JobOpenings /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/offer-management" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "write" }}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/generate-offer" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "write" }}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/offer/:offerId" element={
                    <ProtectedRoute requiredPermission={{ module: "recruitment", action: "write" }}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Attendance — MATRIX ENFORCED ─────────────────── */}
                  <Route path="/attendance" element={
                    <ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}>
                      <DashboardLayout><AttendanceRecords /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/attendance/holidays" element={
                    <ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}>
                      <DashboardLayout><HolidayManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/attendance/shifts" element={
                    <ProtectedRoute requiredPermission={{ module: "attendance", action: "write" }}>
                      <DashboardLayout><ShiftManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/attendance/leave-management" element={
                    <ProtectedRoute requiredPermission={{ module: "attendance", action: "write" }}>
                      <DashboardLayout><AdminLeaveManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Payroll — MATRIX ENFORCED ────────────────────── */}
                  <Route path="/payroll" element={
                    <ProtectedRoute requiredPermission={{ module: "payroll", action: "read" }}>
                      <DashboardLayout><Payroll /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/tickets" element={
                    <ProtectedRoute requiredPermission={{ module: "payroll", action: "read" }}>
                      <DashboardLayout><Tickets /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/indemnity" element={
                    <ProtectedRoute requiredPermission={{ module: "payroll", action: "read" }}>
                      <DashboardLayout><Indemnity /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Transfers ────────────────────────────────────── */}
                  <Route path="/employee-transfer" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><EmployeeTransfer /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Performance (PMS) ────────────────────────────── */}
                  {/* FIXED: Cycle management → HR_MANAGER (was ADMIN) */}
                  <Route path="/role/hr_manager/appraisal/cycles" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><AdminPerformance /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* FIXED: Cycle detail → HR_MANAGER + Managers (was ADMIN only) */}
                  <Route path="/role/hr_manager/appraisal/view/:id" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                      <DashboardLayout><ViewCycleDetails /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* FIXED: Review detail → HR_MANAGER + Managers (was ADMIN only) */}
                  <Route path="/role/hr_manager/review/:id" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                      <DashboardLayout><ReviewDetailPage /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* HR Manager appraisal hub */}
                  <Route path="/role/hr_manager/appraisal" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><HRManagerAppraisal /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* FIXED: CEO gets read-only analytics view */}
                  <Route path="/role/ceo/appraisal" element={
                    <ProtectedRoute allowedRoles={["CEO"]}>
                      <DashboardLayout><PerformanceAnalytics /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/role/department_manager/appraisal" element={
                    <ProtectedRoute allowedRoles={["DEPARTMENT_MANAGER"]}>
                      <DashboardLayout><DepartmentManagerAppraisal /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/direct_manager/appraisal" element={
                    <ProtectedRoute allowedRoles={["DIRECT_MANAGER"]}>
                      <DashboardLayout><DirectManagerAppraisal /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/employee/appraisal" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><EmployeeAppraisal /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Disciplinary Actions ─────────────────────────── */}
                  <Route path="/role/hr_manager/disciplinary-actions" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><HRManagerDisciplinaryActions /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/department_manager/disciplinary-actions" element={
                    <ProtectedRoute allowedRoles={["DEPARTMENT_MANAGER"]}>
                      <DashboardLayout><DepartmentManagerDisciplinaryActions /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/direct_manager/disciplinary-actions" element={
                    <ProtectedRoute allowedRoles={["DIRECT_MANAGER"]}>
                      <DashboardLayout><DirectManagerDisciplinaryActions /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Document Requests ────────────────────────────── */}
                  <Route path="/role/hr_manager/document-requests" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><DocumentRequestsHRManager /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/hr_officer/document-requests" element={
                    <ProtectedRoute allowedRoles={["HR_OFFICER"]}>
                      <DashboardLayout><DocumentRequestsHROfficer /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/employee/document-requests" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><DocumentRequestsEmployee /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Leave Management ─────────────────────────────── */}
                  <Route path="/role/ceo/leave-management" element={
                    <ProtectedRoute allowedRoles={["CEO"]}>
                      <DashboardLayout><CEOLeaveManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/hr_manager/leave-management" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><HRManagerLeaveManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/role/employee/leave-management" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><EmployeeLeaveManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Employee Self-Service ────────────────────────── */}
                  <Route path="/dashboard/employee/attendance" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><MyAttendance /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/employee/tasks" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><MyTasks /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/employee/make-transfer" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout><TransferPage /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Digital Locker ───────────────────────────────── */}
                  <Route path="/digital-locker" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "EMPLOYEE"]}>
                      <DashboardLayout><DigitalLocker /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Reports — MATRIX ENFORCED ────────────────────── */}
                  <Route path="/reports" element={
                    <ProtectedRoute requiredPermission={{ module: "dashboard", action: "read" }}>
                      <DashboardLayout><ReportsPage /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* ── Redirects ────────────────────────────────────── */}
                  <Route path="/" element={<Navigate to="/dashboard-redirect" />} />
                  <Route path="*" element={<Navigate to="/dashboard-redirect" />} />

                </Routes>
              </Router>
            </UserProvider>
          </RoleProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
