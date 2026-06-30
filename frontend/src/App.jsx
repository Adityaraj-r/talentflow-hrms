import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { useAuth } from "./contexts/AuthContext"
import { RoleProvider } from "./contexts/RoleContext"
import { SettingsProvider } from "./contexts/SettingsContext"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { getMyPermissions, can } from "./services/permissionService"

// Auth Pages
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"
import OtpVerification from "./pages/auth/OtpVerification"
import ResetPassword from "./pages/auth/ResetPassword"

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout"

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard"
import AdminDashboard from "./pages/dashboard/AdminDashboard"
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard"
import ProjectManagerDashboard from "./pages/dashboard/ProjectManagerDashboard"
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard"
import Unauthorized from "./pages/Unauthorized"

// Administration Module
import UserManagement from "./pages/modules/administration/UserManagement"
import SystemSettings from "./pages/modules/administration/SystemSettings"
import RoleManagement from "./pages/modules/administration/RoleManagement"
import CompanyStructure from "./pages/modules/administration/CompanyStructure"
import AuditLogs from "./pages/modules/administration/AuditLogs"
import Integrations from "./pages/modules/administration/Integrations"

// Recruitment Module
import CreateRequisition from "./pages/modules/recruitment/CreateRequisition"

import Onboarding from "./pages/modules/recruitment/Onboarding"
import StaffRequisition from "./pages/modules/recruitment/StaffRequisition"
import Careers from "./pages/Careers"
import OfferManagement from "./pages/modules/recruitment/OfferManagement"
import OfferOperations from "./pages/modules/recruitment/OfferOperations"
import JobOpenings from "./pages/modules/recruitment/JobOpenings"
import ApplyJob from "./pages/ApplyJob"
import CandidateApplications from "./pages/modules/recruitment/CandidateApplications"
import RecruitmentPipeline from "./pages/modules/recruitment/RecruitmentPipeline"
import InterviewScheduling from "./pages/modules/recruitment/InterviewScheduling"
import ApplicationStatus from "./pages/ApplicationStatus"
import AdminRecruitmentSuggestions from "./pages/modules/recruitment/AdminRecruitmentSuggestions"
import RecruitmentSuggestionsInbox from "./pages/modules/recruitment/RecruitmentSuggestionsInbox"
import RecruitmentAnalytics from "./pages/modules/recruitment/RecruitmentAnalytics"

// Payroll Module
import Payroll from "./pages/modules/payroll/Payroll"
import Tickets from "./pages/modules/payroll/Tickets"
import Indemnity from "./pages/modules/payroll/Indemnity"
import SalarySlip from "./pages/modules/payroll/SalarySlip"

// Transfer and Promotion Module
import EmployeeTransfer from "./pages/modules/transfer/EmployeeTransfer"
import TransferPage from "./pages/modules/transfer/TransferPage"
import EmployeePromotion from "./pages/modules/transfer/EmployeePromotion"
import HRDocumentRequests from "./pages/modules/employee-center/HRDocumentRequests"

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

// Attendance Module
import AttendanceRecords from "./pages/modules/attendance/AttendanceRecords"
import ShiftManagement from "./pages/modules/attendance/ShiftManagement"
import ShiftRoster from "./pages/modules/attendance/ShiftRoster"
import HolidayManagement from "./pages/modules/attendance/HolidayManagement"
import ManualAttendance from "./pages/modules/attendance/ManualAttendance"
import MyAttendance from "./pages/modules/attendance/MyAttendance"
import LeaveManagement from "./pages/modules/attendance/LeaveApprovals"
import CorrectionRequests from "./pages/modules/attendance/CorrectionRequests"
import OvertimeApprovals from "./pages/modules/attendance/OvertimeApprovals"
import LeavePolicyManagement from "./pages/modules/attendance/LeavePolicyManagement"

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
import HRManagerLeaveManagement from "./pages/role/HR_MANAGER/LeaveManagement"

// CEO-Specific Pages
import CEOAppraisal from "./pages/role/CEO/CEOAppraisal"
import AppraisalCyclesPage from "./pages/pms/AppraisalCyclesPage"
import AppraisalCycleDetailPage from "./pages/pms/AppraisalCycleDetailPage"
import EmployeeAppraisalResultPage from "./pages/pms/EmployeeAppraisalResultPage"
import WorkforceAnalytics from "./pages/role/CEO/WorkforceAnalytics"
import PayrollCostDashboard from "./pages/role/CEO/PayrollCostDashboard"
import CEORecruitmentModule from "./pages/role/CEO/RecruitmentModule"
import CEORecruitmentBriefing from "./pages/role/CEO/RecruitmentBriefing"
import TaskAnalytics from "./pages/role/CEO/TaskAnalytics"

// Employee Role Pages
import EmployeeLeaveManagement from "./pages/role/EMPLOYEE/EmployeeLeaveManagement"
import MyTasks from "./pages/role/EMPLOYEE/MyTasks"
import Profile from "./pages/dashboard/Profile"
import AttendanceAnalytics from "./pages/modules/attendance/AttendanceAnalytics"
import EmployeeResignation from "./pages/role/EMPLOYEE/EmployeeResignation"

// Document Module
import MyDocuments from "./pages/modules/documents/MyDocuments"

const CEOLeaveManagement = LeaveManagement

const ProtectedRoute = ({ children, allowedRoles, requiredPermission, requiredPermissionAny }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const [permLoading, setPermLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)

  const userRoleStr = typeof user?.role === "string"
    ? user.role
    : user?.role?.name || ""

  useEffect(() => {
    const needsMatrix =
      requiredPermission ||
      (Array.isArray(requiredPermissionAny) && requiredPermissionAny.length > 0)
    if (!needsMatrix || !user) return

    const upper = userRoleStr.toUpperCase()
    const isSystemAdmin =
      upper === "SUPER ADMIN" || upper === "SUPER_ADMIN" || upper === "ADMIN"
    const moduleIsPerformance = (m) => m === "performance"
    const needsStrictPerformance =
      moduleIsPerformance(requiredPermission?.module) ||
      (Array.isArray(requiredPermissionAny) &&
        requiredPermissionAny.some((p) => moduleIsPerformance(p.module)))
    if (isSystemAdmin && !needsStrictPerformance) {
      setHasPermission(true)
      return
    }

    const checkMatrix = async () => {
      setPermLoading(true)
      try {
        const permissions = await getMyPermissions(userRoleStr)
        if (Array.isArray(requiredPermissionAny) && requiredPermissionAny.length > 0) {
          setHasPermission(
            requiredPermissionAny.some((p) =>
              can(permissions, p.module, p.action)
            )
          )
        } else if (requiredPermission) {
          setHasPermission(can(permissions, requiredPermission.module, requiredPermission.action))
        }
      } catch {
        setHasPermission(false)
      } finally {
        setPermLoading(false)
      }
    }

    checkMatrix()
  }, [user, requiredPermission, requiredPermissionAny, userRoleStr])

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

  const needsMatrixGate =
    requiredPermission ||
    (Array.isArray(requiredPermissionAny) && requiredPermissionAny.length > 0)
  if (needsMatrixGate) {
    if (hasPermission === null) return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
    return hasPermission ? children : <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = userRoleStr.toUpperCase()
    const normalized = allowedRoles.map(r => r.toUpperCase())

    if (!normalized.includes(userRole)) {
      if (
        (userRole === "SUPER ADMIN" || userRole === "SUPER_ADMIN") &&
        normalized.includes("ADMIN")
      ) {
        return children
      }
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

  if (role === "ADMIN" || role === "SUPER ADMIN") return <Navigate to="/admin/dashboard" replace />
  if (role === "CEO" || role === "COUNTRY_MANAGER") return <Navigate to="/ceo/dashboard" replace />
  if (role === "EMPLOYEE") return <Navigate to="/employee/dashboard" replace />
  if (role === "PROJECT_MANAGER") return <Navigate to="/dashboard/project-manager" replace />
  if (role === "HR_MANAGER" || role === "HR_OFFICER"
    || role === "DEPARTMENT_MANAGER"
    || role === "DIRECT_MANAGER"
    || role === "OPERATIONS_MANAGER"
    || role === "FINANCE_MANAGER"
    || role === "PAYROLL_OFFICER") return <Navigate to="/dashboard" replace />

  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <SettingsProvider>
      <RoleProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <Routes>

                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/otp-verification" element={<OtpVerification />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/dashboard-redirect" element={<DashboardRouter />} />

                    <Route path="/careers" element={<Careers />} />
                    <Route path="/apply/:id" element={<ApplyJob />} />
                    <Route path="/application-status" element={<ApplicationStatus />} />

                    <Route
                      path="/employee-transfer"
                      element={<Navigate to="/employee-center/employee-transfer" replace />}
                    />

                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <DashboardLayout><Profile /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><AdminDashboard /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/ceo/dashboard" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><ExecutiveDashboard /></DashboardLayout>
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

                    <Route path="/dashboard/pm/tasks" element={
                      <ProtectedRoute allowedRoles={["PROJECT_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
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

                    <Route path="/dashboard/users" element={
                      <ProtectedRoute requiredPermissionAny={[
                        { module: "employees", action: "read" },
                        { module: "settings", action: "read" },
                      ]}>
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
                      <ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}>
                        <DashboardLayout><CompanyStructure /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/audit-logs" element={
                      <ProtectedRoute requiredPermission={{ module: "audit", action: "read" }}>
                        <DashboardLayout><AuditLogs /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/integrations" element={
                      <ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}>
                        <DashboardLayout><Integrations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/recruitment-suggestions" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><AdminRecruitmentSuggestions /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* ── Employee Center ───────────────────────────────── */}
                    <Route path="/employee-center/all-employees" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                        <DashboardLayout><AllEmployees /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/employee/:id" element={
                      <ProtectedRoute requiredPermission={{ module: "employees", action: "read" }}>
                        <DashboardLayout><EmployeeProfileView /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/digital-locker" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "EMPLOYEE", "DEPARTMENT_MANAGER"]}>
                        <DashboardLayout><DigitalLocker /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/employee-transfer" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "ADMIN", "SUPER ADMIN", "EMPLOYEE"]}>
                        <DashboardLayout><EmployeeTransfer /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/promotions" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                        <DashboardLayout><EmployeePromotion /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/onboarding" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER"]}>
                        <DashboardLayout><Onboarding /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee-center/document-requests" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><HRDocumentRequests /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                     {/* ── Recruitment — MATRIX ENFORCED ────────────────── */}
                    <Route path="/create-requisition" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><CreateRequisition /></DashboardLayout>  
                      </ProtectedRoute>
                    } />
                    <Route path="/staff-requisition" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><StaffRequisition /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/applications" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><CandidateApplications /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/recruitment-pipeline" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentPipeline /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/interview-scheduling" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><InterviewScheduling /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/job-openings" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><JobOpenings /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/offer-management" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/generate-offer" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><OfferManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/offer/:offerId" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/offers" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferOperations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/offers/analytics" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferOperations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/offers/approvals" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferOperations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/offers/templates" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferOperations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/offers/operations" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><OfferOperations /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/recruitment-suggestions" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentSuggestionsInbox /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/analytics" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/analytics/funnel" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/analytics/recruiters" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/analytics/sources" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recruitment/analytics/insights" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "CEO", "ADMIN", "SUPER ADMIN"]}>
                        <DashboardLayout><RecruitmentAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* ── Attendance — MATRIX ENFORCED ─────────────────── */}

                    <Route path="/attendance/analytics" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER", "CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><AttendanceAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    
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
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER"]}>
                        <DashboardLayout><ShiftManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/roster" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "PROJECT_MANAGER"]}>
                        <DashboardLayout><ShiftRoster /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/leave-policies" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER"]}>
                        <DashboardLayout><LeavePolicyManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/my-leaves" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE", "DIRECT_MANAGER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "FINANCE_MANAGER", "HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER"]}>
                        <DashboardLayout><EmployeeLeaveManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/leave-management" element={
                      <ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}>
                        <DashboardLayout><LeaveManagement /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/manual" element={
                      <ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}>
                        <DashboardLayout><ManualAttendance /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/correction-requests" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                        <DashboardLayout><CorrectionRequests /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance/overtime-approvals" element={
                      <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "FINANCE_MANAGER"]}>
                        <DashboardLayout><OvertimeApprovals /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    

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
                    <Route path="/payroll/salary-slip" element={
                      <ProtectedRoute requiredPermission={{ module: "payroll", action: "read" }}>
                        <DashboardLayout><SalarySlip /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/employee-center/employee-transfer" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "ADMIN", "SUPER ADMIN", "EMPLOYEE"]}>
                        <DashboardLayout><EmployeeTransfer /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* PROMOTIONS ROUTE */}
                    <Route path="/employee-center/promotions" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER"]}>
                        <DashboardLayout><EmployeePromotion /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* Cycle management — HR (matrix: performance.read); structural actions gated by delete in UI/API */}
                    <Route path="/role/hr_manager/appraisal/cycles" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><AdminPerformance /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/hr_manager/appraisal/view/:id" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><ViewCycleDetails /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/hr_manager/appraisal/analytics" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER"]}>
                        <DashboardLayout><PerformanceAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/hr_manager/review/:id" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "CEO"]}>
                        <DashboardLayout><ReviewDetailPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/hr_manager/appraisal" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                        <DashboardLayout><HRManagerAppraisal /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/ceo/appraisal" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "PAYROLL_OFFICER"]}>
                        <DashboardLayout><PerformanceAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/ceo/performance" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <Navigate to="/role/ceo/appraisal" replace />
                      </ProtectedRoute>
                    } />
                    <Route path="/role/ceo/performance-review" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEOAppraisal /></DashboardLayout>
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
                    <Route path="/role/employee/review/:id" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                        <DashboardLayout><ReviewDetailPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/employee/appraisal-result" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                        <DashboardLayout><EmployeeAppraisalResultPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/pms/appraisal-cycles" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER ADMIN", "CEO", "COUNTRY_MANAGER", "FINANCE_MANAGER"]}>
                        <DashboardLayout><AppraisalCyclesPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/pms/appraisal-cycles/:id" element={
                      <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER ADMIN", "CEO", "COUNTRY_MANAGER", "FINANCE_MANAGER"]}>
                        <DashboardLayout><AppraisalCycleDetailPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />

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

                    <Route path="/role/ceo/leave-management" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><LeaveManagement /></DashboardLayout>
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
                      <ProtectedRoute allowedRoles={["EMPLOYEE", "DIRECT_MANAGER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "FINANCE_MANAGER", "HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER"]}>
                        <DashboardLayout><MyAttendance /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/employee/tasks" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE","HR_MANAGER","HR_OFFICER","DEPARTMENT_MANAGER", "DIRECT_MANAGER", "FINANCE_MANAGER","PAYROLL_OFFICER","OPERATIONS_MANAGER","ADMIN","SUPER_ADMIN", ]}>
                        <DashboardLayout><MyTasks /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/employee/make-transfer" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                        <DashboardLayout><TransferPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employee/resignation" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                        <DashboardLayout><EmployeeResignation /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/role/employee/my-documents" element={
                      <ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN", "SUPER ADMIN", "HR_MANAGER", "HR_OFFICER", "CEO", "COUNTRY_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "FINANCE_MANAGER", "PAYROLL_OFFICER", "PROJECT_MANAGER", "OPERATIONS_MANAGER"]}>
                        <DashboardLayout><MyDocuments /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* ── CEO-Specific Routes ───────────────────────────── */}
                    <Route path="/ceo/analytics" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><WorkforceAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/briefing" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentBriefing /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/executive-pipeline" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/strategic-analytics" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/workforce-planning" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/executive-approvals" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ceo/recruitment/employer-brand-health" element={
                      <ProtectedRoute allowedRoles={["CEO"]}>
                        <DashboardLayout><CEORecruitmentModule /></DashboardLayout>
                      </ProtectedRoute>
                    } />
                   
                    <Route path="/ceo/task-analytics" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><TaskAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/reports" element={
                      <ProtectedRoute requiredPermission={{ module: "dashboard", action: "read" }}>
                        <DashboardLayout><ReportsPage /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/ceo/analytics" element={
                      <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER"]}>
                        <DashboardLayout><WorkforceAnalytics /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/ceo/payroll" element={
                      <ProtectedRoute requiredPermission={{ module: "payroll", action: "read" }}>
                        <DashboardLayout><PayrollCostDashboard /></DashboardLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/dashboard-redirect" />} />
                    <Route path="*" element={<Navigate to="/dashboard-redirect" />} />

          </Routes>
        </Router>
      </RoleProvider>
    </SettingsProvider>
  )
}

export default App
