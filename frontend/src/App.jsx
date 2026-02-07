import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { RoleProvider } from "./contexts/RoleContext"
import { SettingsProvider } from "./contexts/SettingsContext"

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

// NEW Partner Files
import UserManagement from "./pages/dashboard/UserManagement"
import SystemSettings from "./pages/dashboard/SystemSettings"
import Onboarding from "./pages/dashboard/Onboarding"
import ProjectManagerDashboard from "./pages/dashboard/ProjectManagerDashboard"

// Admin Performance Module
import AdminPerformance from "./pages/dashboard/AdminPerformance"
import ViewCycleDetails from "./pages/dashboard/ViewCycleDetails"

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

// Role-Specific Recruitment pages
import RecentHires from "./pages/modules/recruitment/RecentHires"
import CreateRequisition from "./pages/modules/recruitment/CreateRequisition"
import ManageOnboarding from "./pages/modules/recruitment/ManageOnboarding"
import ActiveOnboarding from "./pages/modules/recruitment/ActiveOnboarding"
import OnboardingDetails from "@/pages/modules/recruitment/OnboardingDetails";

// Protected Route Component with Case-Insensitive Role Check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Case-insensitive role check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase()
    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase())
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" />
    }
  }

  return children
}

// Dashboard Router for Firebase auth integration
const DashboardRouter = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Loading Dashboard...</p>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Case-insensitive role routing
  const role = user.role?.toUpperCase()
  
  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  } else if (role === 'EMPLOYEE') {
    return <Navigate to="/employee/dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <RoleProvider>
            <Router>
              <Toaster position="top-right" richColors />
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/otp-verification" element={<OtpVerification />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Auto-redirect route */}
                <Route path="/dashboard-redirect" element={<DashboardRouter />} />

                {/* Admin Dashboard with Layout */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <AdminDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Employee Dashboard with Layout */}
                <Route
                  path="/employee/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <EmployeeDashboard 
                          stats={{ leaveRequests: 3, documentsRequested: 2 }} 
                          isLoading={false} 
                        />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Main Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* NEW Partner Routes - Admin only */}
                <Route
                  path="/dashboard/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN", "HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <UserManagement />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/onboarding"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN", "HR Manager", "HR_MANAGER", "HR Officer", "HR_OFFICER"]}>
                      <DashboardLayout>
                        <Onboarding />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/manage-onboarding"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "HR Manager", "HR Officer"]}>
                      <DashboardLayout>
                        <ManageOnboarding />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/active-onboarding"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "HR Manager", "HR Officer"]}>
                      <DashboardLayout>
                        <ActiveOnboarding />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/recent-hires"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "HR Manager", "HR Officer"]}>
                      <DashboardLayout>
                        <RecentHires />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/project-manager"
                  element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER", "Project Manager"]}>
                      <DashboardLayout>
                        <ProjectManagerDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Employee Role Pages */}
                <Route
                  path="/dashboard/employee/attendance"
                  element={
                    <ProtectedRoute allowedRoles={["Employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <MyAttendance />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/employee/tasks"
                  element={
                    <ProtectedRoute allowedRoles={["Employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <MyTasks />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Project Manager Role Pages */}
                <Route
                  path="/dashboard/pm/tasks"
                  element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER", "Project Manager"]}>
                      <DashboardLayout>
                        <TaskBoard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/pm/safety"
                  element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER", "Project Manager"]}>
                      <DashboardLayout>
                        <SafetyIncidents />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/pm/timesheets"
                  element={
                    <ProtectedRoute allowedRoles={["PROJECT_MANAGER", "Project Manager"]}>
                      <DashboardLayout>
                        <TimesheetApprovals />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* HR Module Routes */}
                <Route
                  path="/recruitment"
                  element={
                    <ProtectedRoute allowedRoles={["CEO", "Country Manager", "HR Manager", "HR_MANAGER", "HR Officer", "HR_OFFICER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <Recruitment />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/staff-requisition"
                  element={
                    <ProtectedRoute allowedRoles={["CEO", "Country Manager", "HR Manager", "HR_MANAGER", "Department Manager", "DEPARTMENT_MANAGER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <StaffRequisition />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/create-requisition"
                  element={
                    <DashboardLayout>
                      <CreateRequisition />
                    </DashboardLayout>
                  }
                />

                {/* Attendance - Admin only */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN", "HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">Attendance Records</h1>
                          <p className="text-gray-500 mt-2">Attendance management coming soon...</p>
                        </div>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Digital Locker - Admin only */}
                <Route
                  path="/digital-locker"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">Digital Locker (Docs)</h1>
                          <p className="text-gray-500 mt-2">Document management coming soon...</p>
                        </div>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Reports - Admin only */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                          <p className="text-gray-500 mt-2">Reports coming soon...</p>
                        </div>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Settings - Admin only */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <SystemSettings />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Roles & Permissions - Admin only */}
                <Route
                  path="/roles-permissions"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                          <p className="text-gray-500 mt-2">Role management coming soon...</p>
                        </div>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Performance (PMS) - UPDATED */}
                <Route
                  path="/role/admin/appraisal"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <AdminPerformance />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* View Cycle Details */}
                <Route
                  path="/role/admin/appraisal/view/:id"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <ViewCycleDetails />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Leave Management */}
                <Route
                  path="/role/admin/leave-management"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "ADMIN"]}>
                      <DashboardLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold">Leave Management</h1>
                          <p className="text-gray-500 mt-2">Leave management coming soon...</p>
                        </div>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Role-Specific Leave Management */}
                <Route
                  path="/role/ceo/leave-management"
                  element={
                    <ProtectedRoute allowedRoles={["CEO"]}>
                      <DashboardLayout>
                        <CEOLLeaveManagement />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/hr_manager/leave-management"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <HRManagerLeaveManagement />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/employee/leave-management"
                  element={
                    <ProtectedRoute allowedRoles={["Employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <EmployeeLeaveManagement />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/employee-transfer"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER", "Department Manager", "DEPARTMENT_MANAGER", "Project Manager", "PROJECT_MANAGER", "Operations Manager", "OPERATIONS_MANAGER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <EmployeeTransfer />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER", "HR Officer", "HR_OFFICER", "Payroll Officer", "PAYROLL_OFFICER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <Payroll />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER", "HR Officer", "HR_OFFICER", "Payroll Officer", "PAYROLL_OFFICER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <Tickets />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/indemnity"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER", "HR Officer", "HR_OFFICER", "Payroll Officer", "PAYROLL_OFFICER", "ADMIN", "admin"]}>
                      <DashboardLayout>
                        <Indemnity />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Role-Specific Appraisal */}
                <Route
                  path="/role/hr_manager/appraisal"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <HRManagerAppraisal />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/department_manager/appraisal"
                  element={
                    <ProtectedRoute allowedRoles={["Department Manager", "DEPARTMENT_MANAGER"]}>
                      <DashboardLayout>
                        <DepartmentManagerAppraisal />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/direct_manager/appraisal"
                  element={
                    <ProtectedRoute allowedRoles={["Direct Manager", "DIRECT_MANAGER"]}>
                      <DashboardLayout>
                        <DirectManagerAppraisal />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/employee/appraisal"
                  element={
                    <ProtectedRoute allowedRoles={["Employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <EmployeeAppraisal />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Role-Specific Disciplinary Actions */}
                <Route
                  path="/role/hr_manager/disciplinary-actions"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <HRManagerDisciplinaryActions />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/department_manager/disciplinary-actions"
                  element={
                    <ProtectedRoute allowedRoles={["Department Manager", "DEPARTMENT_MANAGER"]}>
                      <DashboardLayout>
                        <DepartmentManagerDisciplinaryActions />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/direct_manager/disciplinary-actions"
                  element={
                    <ProtectedRoute allowedRoles={["Direct Manager", "DIRECT_MANAGER"]}>
                      <DashboardLayout>
                        <DirectManagerDisciplinaryActions />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Role-Specific Document Requests */}
                <Route
                  path="/role/hr_manager/document-requests"
                  element={
                    <ProtectedRoute allowedRoles={["HR Manager", "HR_MANAGER"]}>
                      <DashboardLayout>
                        <DocumentRequestsHRManager />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/hr_officer/document-requests"
                  element={
                    <ProtectedRoute allowedRoles={["HR Officer", "HR_OFFICER"]}>
                      <DashboardLayout>
                        <DocumentRequestsHROfficer />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/role/employee/document-requests"
                  element={
                    <ProtectedRoute allowedRoles={["Employee", "EMPLOYEE"]}>
                      <DashboardLayout>
                        <DocumentRequestsEmployee />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/dashboard-redirect" />} />
                <Route path="*" element={<Navigate to="/dashboard-redirect" />} />
              </Routes>
            </Router>
          </RoleProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App