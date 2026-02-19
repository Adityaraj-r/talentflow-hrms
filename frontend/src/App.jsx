import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { RoleProvider } from "./contexts/RoleContext"
import { SettingsProvider } from "./contexts/SettingsContext"
import { UserProvider } from "./contexts/UserContext"

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
import Unauthorized from "./pages/Unauthorized"
import ReportsPage from "./pages/dashboard/ReportsPage"
import UserManagement from "./pages/dashboard/UserManagement"
import SystemSettings from "./pages/dashboard/SystemSettings"
import Onboarding from "./pages/dashboard/Onboarding"
import ProjectManagerDashboard from "./pages/dashboard/ProjectManagerDashboard"
import RoleManagement from "./pages/dashboard/RoleManagement"
import CompanyStructure from "./pages/dashboard/CompanyStructure"
import AuditLogs from "./pages/dashboard/AuditLogs"
import Integrations from "./pages/dashboard/Integrations"
import AdminPerformance from "./pages/dashboard/AdminPerformance"
import ViewCycleDetails from "./pages/dashboard/ViewCycleDetails"
import DigitalLocker from "./pages/dashboard/DigitalLocker"

// Project Manager Role Pages
import TaskBoard from "./pages/role/PROJECT_MANAGER/TaskBoard"
import SafetyIncidents from "./pages/role/PROJECT_MANAGER/SafetyIncidents"
import TimesheetApprovals from "./pages/role/PROJECT_MANAGER/TimesheetApprovals"

// HR Modules
import Recruitment from "./pages/modules/recruitment/Recruitment"
import StaffRequisition from "./pages/modules/recruitment/StaffRequisition"
import EmployeeTransfer from "./pages/modules/transfer/EmployeeTransfer"
import Payroll from "./pages/modules/payroll/Payroll"
import Tickets from "./pages/modules/payroll/Tickets"
import Indemnity from "./pages/modules/payroll/Indemnity"
import RecentHires from "./pages/modules/recruitment/RecentHires"
import CreateRequisition from "./pages/modules/recruitment/CreateRequisition"
import ManageOnboarding from "./pages/modules/recruitment/ManageOnboarding"
import ActiveOnboarding from "./pages/modules/recruitment/ActiveOnboarding"
import OnboardingDetails from "@/pages/modules/recruitment/OnboardingDetails"
import CandidateManagement from "./pages/modules/recruitment/CandidateManagement"
import OfferManagement from "./pages/modules/recruitment/OfferManagement"

// Role-Specific Appraisal Pages
import HRManagerAppraisal from "./pages/role/HR_MANAGER/Appraisal"
import DepartmentManagerAppraisal from "./pages/role/DEPARTMENT_MANAGER/Appraisal"
import DirectManagerAppraisal from "./pages/role/DIRECT_MANAGER/Appraisal"
import EmployeeAppraisal from "./pages/role/EMPLOYEE/Appraisal"

// Role-Specific DisciplinaryActions Pages
import HRManagerDisciplinaryActions from "./pages/role/HR_MANAGER/DisciplinaryActions"
import DepartmentManagerDisciplinaryActions from "./pages/role/DEPARTMENT_MANAGER/DisciplinaryActions"
import DirectManagerDisciplinaryActions from "./pages/role/DIRECT_MANAGER/DisciplinaryActions"

// Role-Specific DocumentRequests Pages
import DocumentRequestsHRManager from "./pages/role/HR_MANAGER/DocumentRequests"
import DocumentRequestsHROfficer from "./pages/role/HR_OFFICER/DocumentRequests"
import DocumentRequestsEmployee from "./pages/role/EMPLOYEE/DocumentRequests"

// Role-Specific LeaveManagement Pages
import CEOLLeaveManagement from "./pages/role/CEO/LeaveManagement"
import HRManagerLeaveManagement from "./pages/role/HR_MANAGER/LeaveManagement"
import EmployeeLeaveManagement from "./pages/role/EMPLOYEE/LeaveManagement"
import MyAttendance from "./pages/role/EMPLOYEE/MyAttendance"
import MyTasks from "./pages/role/EMPLOYEE/MyTasks"
import TransferPage from "./pages/modules/transfer/TransferPage"

// Admin Role Pages
import AttendanceRecords from "./pages/role/ADMIN/AttendanceRecords"
import AdminLeaveManagement from "./pages/role/ADMIN/LeaveManagement"
import ShiftManagement from "./pages/role/ADMIN/ShiftManagement"
import HolidayManagement from "./pages/role/ADMIN/HolidayManagement"


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" />

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleStr = typeof user?.role === "string" ? user.role : user?.role?.name || ""
    const userRole = userRoleStr.toUpperCase()
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase())

    if (!normalizedAllowedRoles.includes(userRole)) {
      if (userRole === "SUPER ADMIN" && normalizedAllowedRoles.includes("ADMIN")) return children
      return <Navigate to="/unauthorized" />
    }
  }

  return children
}


const DashboardRouter = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-lg font-semibold">Loading Dashboard...</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const userRoleStr = typeof user?.role === "string" ? user.role : user?.role?.name || ""
  const role = userRoleStr.toUpperCase()

  if (role === "ADMIN" || role === "SUPER ADMIN") return <Navigate to="/admin/dashboard" replace />
  if (role === "EMPLOYEE") return <Navigate to="/employee/dashboard" replace />
  if (role === "HR_MANAGER" || role === "HR_OFFICER") return <Navigate to="/dashboard" replace />
  if (role === "PROJECT_MANAGER") return <Navigate to="/dashboard/project-manager" replace />

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

                  {/* Auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/otp-verification" element={<OtpVerification />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/dashboard-redirect" element={<DashboardRouter />} />

                  {/* Admin Dashboard */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><AdminDashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Employee Dashboard */}
                  <Route path="/employee/dashboard" element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                      <DashboardLayout>
                        <EmployeeDashboard stats={{ leaveRequests: 3, documentsRequested: 2 }} isLoading={false} />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* General Dashboard */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout><Dashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* User Management */}
                  <Route path="/dashboard/users" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "SUPER ADMIN"]}>
                      <DashboardLayout><UserManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Onboarding */}
                  <Route path="/dashboard/onboarding" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><Onboarding /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/manage-onboarding" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><ManageOnboarding /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/active-onboarding" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><ActiveOnboarding /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/onboarding/:id" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><OnboardingDetails /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/recent-hires" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><RecentHires /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Candidate Management */}
                  <Route path="/dashboard/candidate-management" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><CandidateManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Offer Management */}
                  <Route path="/dashboard/offer-management" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/generate-offer" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/offer/:offerId" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><OfferManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Project Manager */}
                  <Route path="/dashboard/project-manager" element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
                      <DashboardLayout><ProjectManagerDashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />

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

                  {/* Employee Role Pages */}
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

                  {/* HR Module Routes */}
                  <Route path="/recruitment" element={
                    <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><Recruitment /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/staff-requisition" element={
                    <ProtectedRoute allowedRoles={["CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><StaffRequisition /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/create-requisition" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "HR_OFFICER", "SUPER ADMIN"]}>
                      <DashboardLayout><CreateRequisition /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Attendance */}
                  <Route path="/attendance" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "SUPER ADMIN"]}>
                      <DashboardLayout><AttendanceRecords /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/attendance/holidays" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "EMPLOYEE"]}>
                      <DashboardLayout><HolidayManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/attendance/shifts" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER"]}>
                      <DashboardLayout><ShiftManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/attendance/leave-management" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><AdminLeaveManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Reports & Settings */}
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><ReportsPage /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><SystemSettings /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Administration */}
                  <Route path="/admin/roles" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><RoleManagement /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/company-structure" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><CompanyStructure /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/audit-logs" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><AuditLogs /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/integrations" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><Integrations /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Performance (PMS) */}
                  <Route path="/role/admin/appraisal" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><AdminPerformance /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/role/admin/appraisal/view/:id" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><ViewCycleDetails /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/role/hr_manager/appraisal" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER"]}>
                      <DashboardLayout><HRManagerAppraisal /></DashboardLayout>
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

                  {/* Disciplinary Actions */}
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

                  {/* Document Requests */}
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

                  {/* Leave Management */}
                  <Route path="/role/ceo/leave-management" element={
                    <ProtectedRoute allowedRoles={["CEO"]}>
                      <DashboardLayout><CEOLLeaveManagement /></DashboardLayout>
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

                  {/* Transfers */}
                  <Route path="/employee-transfer" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "OPERATIONS_MANAGER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><EmployeeTransfer /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Payroll */}
                  <Route path="/payroll" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><Payroll /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/tickets" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><Tickets /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/indemnity" element={
                    <ProtectedRoute allowedRoles={["HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER", "ADMIN", "SUPER ADMIN"]}>
                      <DashboardLayout><Indemnity /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Digital Locker */}
                  <Route path="/digital-locker" element={
                    <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER", "EMPLOYEE"]}>
                      <DashboardLayout><DigitalLocker /></DashboardLayout>
                    </ProtectedRoute>
                  } />

                  {/* Redirects */}
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
