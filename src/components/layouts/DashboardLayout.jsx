"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import Sidebar from "../ui/Sidebar"
import Header from "../ui/Header"

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Get a role-specific greeting
  const getRoleGreeting = () => {
    if (!user) return ""

    switch (user.role) {
      case "CEO":
      case "Country Manager":
        return "Executive Dashboard"
      case "HR Manager":
      case "HR Officer":
        return "HR Management Portal"
      case "Department Manager":
      case "Direct Manager":
        return "Manager Dashboard"
      case "Payroll Officer":
        return "Payroll Management System"
      default:
        return "Employee Portal"
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} userRole={user?.role} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          toggleSidebar={toggleSidebar}
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="hidden md:block mb-6">
            <h2 className="text-sm font-medium text-muted-foreground">{getRoleGreeting()}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
