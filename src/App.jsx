"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { RoleProvider, useRole } from "./contexts/RoleContext"

// Auth Pages
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"
import OtpVerification from "./pages/auth/OtpVerification"

// Layout
import DashboardLayout from "./components/layouts/DashboardLayout"

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard"

// HR Modules
import Recruitment from "./pages/modules/recruitment/Recruitment"
import Onboarding from "./pages/modules/recruitment/Recruitment"
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

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const { hasRole } = useRole()

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

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/otp-verification" element={<OtpVerification />} />

              {/* Dashboard Routes */}
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

              {/* HR Module Routes */}
              <Route
                path="/recruitment"
                element={
                  <ProtectedRoute allowedRoles={["CEO", "Country Manager", "HR Manager", "HR Officer"]}>
                    <DashboardLayout>
                      <Recruitment />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager", "HR Officer"]}>
                    <DashboardLayout>
                      <Onboarding />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff-requisition"
                element={
                  <ProtectedRoute allowedRoles={["CEO", "Country Manager", "HR Manager", "Department Manager"]}>
                    <DashboardLayout>
                      <StaffRequisition />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Role-Specific Leave Management Routes */}
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
                  <ProtectedRoute allowedRoles={["HR Manager"]}>
                    <DashboardLayout>
                      <HRManagerLeaveManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/employee/leave-management"
                element={
                  <ProtectedRoute allowedRoles={["Employee"]}>
                    <DashboardLayout>
                      <EmployeeLeaveManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employee-transfer"
                element={
                  <ProtectedRoute
                    allowedRoles={["HR Manager", "Department Manager", "Project Manager", "Operations Manager"]}
                  >
                    <DashboardLayout>
                      <EmployeeTransfer />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payroll"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager", "HR Officer", "Payroll Officer"]}>
                    <DashboardLayout>
                      <Payroll />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tickets"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager", "HR Officer", "Payroll Officer"]}>
                    <DashboardLayout>
                      <Tickets />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/indemnity"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager", "HR Officer", "Payroll Officer"]}>
                    <DashboardLayout>
                      <Indemnity />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Role-Specific Appraisal Routes */}
              <Route
                path="/role/hr_manager/appraisal"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager"]}>
                    <DashboardLayout>
                      <HRManagerAppraisal />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/department_manager/appraisal"
                element={
                  <ProtectedRoute allowedRoles={["Department Manager"]}>
                    <DashboardLayout>
                      <DepartmentManagerAppraisal />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/direct_manager/appraisal"
                element={
                  <ProtectedRoute allowedRoles={["Direct Manager"]}>
                    <DashboardLayout>
                      <DirectManagerAppraisal />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/employee/appraisal"
                element={
                  <ProtectedRoute allowedRoles={["Employee"]}>
                    <DashboardLayout>
                      <EmployeeAppraisal />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Role-Specific DisciplinaryActions Routes */}
              <Route
                path="/role/hr_manager/disciplinary-actions"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager"]}>
                    <DashboardLayout>
                      <HRManagerDisciplinaryActions />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/department_manager/disciplinary-actions"
                element={
                  <ProtectedRoute allowedRoles={["Department Manager"]}>
                    <DashboardLayout>
                      <DepartmentManagerDisciplinaryActions />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/direct_manager/disciplinary-actions"
                element={
                  <ProtectedRoute allowedRoles={["Direct Manager"]}>
                    <DashboardLayout>
                      <DirectManagerDisciplinaryActions />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Role-Specific DocumentRequests Routes */}
              <Route
                path="/role/hr_manager/document-requests"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager"]}>
                    <DashboardLayout>
                      <DocumentRequestsHRManager />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/hr_officer/document-requests"
                element={
                  <ProtectedRoute allowedRoles={["HR Officer"]}>
                    <DashboardLayout>
                      <DocumentRequestsHROfficer />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/role/employee/document-requests"
                element={
                  <ProtectedRoute allowedRoles={["Employee"]}>
                    <DashboardLayout>
                      <DocumentRequestsEmployee />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to login or dashboard based on auth status */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
          <Toaster position="top-right" richColors />
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App