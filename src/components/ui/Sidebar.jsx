"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const Sidebar = ({ isOpen, toggleSidebar, userRole }) => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({
    recruitment: false,
    leave: false,
    payroll: false,
  })

  const toggleMenu = (menu) => {
    setExpandedMenus({
      ...expandedMenus,
      [menu]: !expandedMenus[menu],
    })
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    const allMenuItems = [
      {
        title: "Dashboard",
        icon: <Home size={20} />,
        path: "/dashboard",
        roles: [
          "CEO",
          "Country Manager",
          "HR Manager",
          "HR Officer",
          "Department Manager",
          "Direct Manager",
          "Payroll Officer",
          "Project Manager",
          "Operations Manager",
          "Camp Boss",
          "Admin",
          "Employee",
        ],
      },
      {
        title: "Recruitment",
        icon: <Users size={20} />,
        submenu: true,
        submenuKey: "recruitment",
        roles: ["CEO", "Country Manager", "HR Manager", "HR Officer", "Department Manager"],
        children: [
          {
            title: "Recruitment Process",
            path: "/recruitment",
            roles: ["CEO", "Country Manager", "HR Manager", "HR Officer"],
          },
          {
            title: "Staff Requisition",
            path: "/staff-requisition",
            roles: ["CEO", "Country Manager", "HR Manager", "Department Manager"],
          },
          {
            title: "Onboarding",
            path: "/onboarding",
            roles: ["HR Manager", "HR Officer"],
          },
        ],
      },
      {
        title: "Leave Management",
        icon: <Calendar size={20} />,
        path: "/leave-management",
        roles: [
          "CEO",
          "Country Manager",
          "HR Manager",
          "HR Officer",
          "Department Manager",
          "Direct Manager",
          "Employee",
        ],
      },
      {
        title: "Employee Transfer",
        icon: <RefreshCw size={20} />,
        path: "/employee-transfer",
        roles: ["HR Manager", "Department Manager", "Project Manager", "Operations Manager"],
      },
      {
        title: "Payroll",
        icon: <DollarSign size={20} />,
        submenu: true,
        submenuKey: "payroll",
        roles: ["HR Manager", "HR Officer", "Payroll Officer"],
        children: [
          {
            title: "Payroll Processing",
            path: "/payroll",
            roles: ["HR Manager", "HR Officer", "Payroll Officer"],
          },
          {
            title: "Tickets & Advances",
            path: "/tickets",
            icon: <Plane size={16} />,
            roles: ["HR Manager", "HR Officer", "Payroll Officer"],
          },
          {
            title: "Indemnity Calculation",
            path: "/indemnity",
            icon: <Calculator size={16} />,
            roles: ["HR Manager", "HR Officer", "Payroll Officer"],
          },
        ],
      },
      {
        title: "Appraisal",
        icon: <Award size={20} />,
        path: "/appraisal",
        roles: ["HR Manager", "Department Manager", "Direct Manager", "Employee"],
      },
      {
        title: "Disciplinary Actions",
        icon: <AlertTriangle size={20} />,
        path: "/disciplinary-actions",
        roles: ["HR Manager", "HR Officer", "Department Manager"],
      },
      {
        title: "Document Requests",
        icon: <FileCheck size={20} />,
        path: "/document-requests",
        roles: ["HR Manager", "HR Officer", "Employee"],
      },
    ]

    // Filter menu items based on user role
    return allMenuItems.filter((item) => {
      if (!userRole) return false
      return item.roles.includes(userRole)
    })
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-300 md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">HRMS</span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.submenuKey)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                        expandedMenus[item.submenuKey] ? "bg-gray-100 dark:bg-gray-700" : "",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {expandedMenus[item.submenuKey] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedMenus[item.submenuKey] && (
                      <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                        {item.children
                          .filter((child) => child.roles.includes(userRole))
                          .map((child, childIndex) => (
                            <li key={childIndex}>
                              <Link
                                to={child.path}
                                className={cn(
                                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                  location.pathname === child.path
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground",
                                )}
                              >
                                {child.icon && child.icon}
                                <span>{child.title}</span>
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground",
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="border-t p-4 dark:border-gray-700">
          <div className="text-xs text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>© 2025 HRMS System</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
