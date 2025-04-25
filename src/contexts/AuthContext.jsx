"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("hrms_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  // Helper function to get position based on role
  const getPositionByRole = (role) => {
    switch (role) {
      case "CEO":
        return "Chief Executive Officer"
      case "Country Manager":
        return "Country Manager"
      case "HR Manager":
        return "HR Manager"
      case "HR Officer":
        return "HR Officer"
      case "Department Manager":
        return "Department Manager"
      case "Direct Manager":
        return "Team Lead"
      case "Payroll Officer":
        return "Payroll Specialist"
      default:
        return "Staff Member"
    }
  }

  // Update the login function to provide more role-specific user data
  const login = async (email, password) => {
    try {
      if (email && password) {
        const role = email.includes("ceo")
          ? "CEO"
          : email.includes("hr")
            ? "HR Manager"
            : email.includes("manager")
              ? "Department Manager"
              : email.includes("payroll")
                ? "Payroll Officer"
                : "Employee"

        const userData = {
          id: "1",
          name: email
            .split("@")[0]
            .replace(/\./g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          email,
          role,
          department:
            role === "HR Manager" || role === "HR Officer"
              ? "Human Resources"
              : role === "Payroll Officer"
                ? "Finance"
                : "Administration",
          position: getPositionByRole(role),
          joinDate: "2020-01-15",
          profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            email
              .split("@")[0]
              .replace(/\./g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          )}&background=random`,
        }

        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem("hrms_user", JSON.stringify(userData))
        toast.success("Login successful")
        return true
      }
      return false
    } catch (error) {
      toast.error("Login failed: " + error.message)
      return false
    }
  }

  const signup = async (userData) => {
    try {
      if (userData.email && userData.password) {
        toast.success("Account created successfully")
        return true
      }
      return false
    } catch (error) {
      toast.error("Signup failed: " + error.message)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("hrms_user")
    toast.success("Logged out successfully")
  }

  const forgotPassword = async (email) => {
    try {
      if (email) {
        toast.success("Password reset link sent to your email")
        return true
      }
      return false
    } catch (error) {
      toast.error("Failed to send reset link: " + error.message)
      return false
    }
  }

  const verifyOtp = async (otp) => {
    try {
      if (otp) {
        toast.success("OTP verified successfully")
        return true
      }
      return false
    } catch (error) {
      toast.error("OTP verification failed: " + error.message)
      return false
    }
  }

  const resetPassword = async (password) => {
    try {
      if (password) {
        toast.success("Password reset successfully")
        return true
      }
      return false
    } catch (error) {
      toast.error("Password reset failed: " + error.message)
      return false
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}