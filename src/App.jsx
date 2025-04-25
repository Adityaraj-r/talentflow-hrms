"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/ThemeContext"
// import { AuthProvider, useAuth } from "./contexts/AuthContext"
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
import LeaveManagement from "./pages/modules/leave/LeaveManagement"
import EmployeeTransfer from "./pages/modules/transfer/EmployeeTransfer"
import Payroll from "./pages/modules/payroll/Payroll" 
import Tickets from "./pages/modules/payroll/Tickets"
import Indemnity from "./pages/modules/payroll/Indemnity"
import Appraisal from "./pages/modules/appraisal/Appraisal"
import DisciplinaryActions from "./pages/modules/disciplinary/DisciplinaryActions"
import DocumentRequests from "./pages/modules/documents/DocumentRequests"
import { AuthProvider, useAuth } from "./contexts/AuthContext"

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

              <Route
                path="/leave-management"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <LeaveManagement />
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

              <Route
                path="/appraisal"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Appraisal />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/disciplinary-actions"
                element={
                  <ProtectedRoute allowedRoles={["HR Manager", "HR Officer", "Department Manager"]}>
                    <DashboardLayout>
                      <DisciplinaryActions />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/document-requests"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DocumentRequests />
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