"use client"

import { createContext, useContext } from "react"
import { useAuth } from "./AuthContext"

const RoleContext = createContext()

export const useRole = () => useContext(RoleContext)

export const RoleProvider = ({ children }) => {
  const { user } = useAuth()

  // Define role hierarchy
  const roleHierarchy = {
    CEO: 10,
    "Country Manager": 9,
    "HR Manager": 8,
    "HR Officer": 7,
    "Department Manager": 6,
    "Direct Manager": 5,
    "Payroll Officer": 4,
    "Project Manager": 3,
    "Operations Manager": 3,
    "Camp Boss": 3,
    Admin: 2,
    Employee: 1,
  }

  // Check if user has permission for a specific action
  const hasPermission = (requiredRole) => {
    if (!user) return false

    const userRoleLevel = roleHierarchy[user.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0

    return userRoleLevel >= requiredRoleLevel
  }

  // Check if user has one of the required roles
  const hasRole = (allowedRoles) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  // Get user's role level (useful for conditional rendering)
  const getRoleLevel = () => {
    if (!user) return 0
    return roleHierarchy[user.role] || 0
  }

  // Get role category for dashboard display
  const getRoleCategory = () => {
    if (!user) return "employee"

    const role = user.role
    if (role === "CEO" || role === "Country Manager") return "executive"
    if (role === "HR Manager" || role === "HR Officer") return "hr"
    if (role === "Department Manager" || role === "Direct Manager") return "manager"
    if (role === "Payroll Officer") return "payroll"
    return "employee"
  }

  // Get accessible modules based on user role
  const getAccessibleModules = () => {
    if (!user) return []

    const baseModules = ["dashboard"]
    const role = user.role

    if (["CEO", "Country Manager", "HR Manager", "HR Officer", "Department Manager"].includes(role)) {
      baseModules.push("recruitment")
    }

    if (
      [
        "CEO",
        "Country Manager",
        "HR Manager",
        "HR Officer",
        "Department Manager",
        "Direct Manager",
        "Employee",
      ].includes(role)
    ) {
      baseModules.push("leave")
    }

    if (["HR Manager", "Department Manager", "Project Manager", "Operations Manager"].includes(role)) {
      baseModules.push("transfer")
    }

    if (["HR Manager", "HR Officer", "Payroll Officer"].includes(role)) {
      baseModules.push("payroll")
    }

    if (["HR Manager", "Department Manager", "Direct Manager", "Employee"].includes(role)) {
      baseModules.push("appraisal")
    }

    if (["HR Manager", "HR Officer", "Department Manager"].includes(role)) {
      baseModules.push("disciplinary")
    }

    if (["HR Manager", "HR Officer", "Employee"].includes(role)) {
      baseModules.push("documents")
    }

    return baseModules
  }

  return (
    <RoleContext.Provider
      value={{
        hasPermission,
        hasRole,
        getRoleLevel,
        getRoleCategory,
        getAccessibleModules,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}
