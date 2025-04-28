"use client";

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES, PERMISSIONS } from "../../constants/roles";

// Optional: Try importing useUser, with fallback
let useUser;
try {
  useUser = require("@/context/UserContext").useUser;
} catch {
  useUser = () => ({ user: null, logout: () => {} });
}

const Sidebar = ({ isOpen, toggleSidebar, userRole: propUserRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [openGroups, setOpenGroups] = useState({
    recruitment: false,
    payroll: false,
    appraisal: false,
    disciplinaryActions: false,
    documentRequests: false,
  });

  // Use user.role from context if available, else fall back to propUserRole
  const userRole = user?.role || propUserRole;

  // Debug logging
  console.log("Sidebar Render - user:", user, "userRole:", userRole);

  if (!userRole) {
    console.log("No user role detected, sidebar will not render");
    return null;
  }

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const getRecruitmentLabel = () => {
    switch (userRole) {
      case ROLES.HR_MANAGER:
      case ROLES.HR_OFFICER:
        return "Manage Recruitment";
      case ROLES.CEO:
      case ROLES.COUNTRY_MANAGER:
        return "View Recruitment";
      case ROLES.DEPARTMENT_MANAGER:
        return "Staff Requisition";
      default:
        return "Recruitment";
    }
  };

  const getPayrollLabel = () => {
    switch (userRole) {
      case ROLES.HR_MANAGER:
      case ROLES.HR_OFFICER:
      case ROLES.PAYROLL_OFFICER:
        return "Manage Payroll";
      default:
        return "Payroll";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLeaveManagementPath = () => {
    switch (userRole) {
      case ROLES.CEO:
        return "/role/ceo/leave-management";
      case ROLES.COUNTRY_MANAGER:
        return "/role/country_manager/leave-management";
      case ROLES.HR_MANAGER:
        return "/role/hr_manager/leave-management";
      case ROLES.HR_OFFICER:
        return "/role/hr_officer/leave-management";
      case ROLES.DEPARTMENT_MANAGER:
        return "/role/department_manager/leave-management";
      case ROLES.DIRECT_MANAGER:
        return "/role/direct_manager/leave-management";
      case ROLES.EMPLOYEE:
        return "/role/employee/leave-management";
      case ROLES.PAYROLL_OFFICER:
        return "/role/payroll_officer/leave-management";
      case ROLES.PROJECT_MANAGER:
        return "/role/project_manager/leave-management";
      case ROLES.OPERATIONS_MANAGER:
        return "/role/operations_manager/leave-management";
      case ROLES.CAMP_BOSS:
        return "/role/camp_boss/leave-management";
      case ROLES.ADMIN:
        return "/role/admin/leave-management";
      default:
        return "/dashboard"; // Fallback path for roles without leave management access
    }
  };

  const renderSidebarContent = () => {
    const permissions = PERMISSIONS[userRole] || {};

    switch (userRole) {
      case ROLES.HR_MANAGER:
        return (
          <>
            {permissions.recruitment && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("recruitment")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.recruitment ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} />
                    <span>{getRecruitmentLabel()}</span>
                  </div>
                  {openGroups.recruitment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.recruitment && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.recruitment.recruitmentProcess && (
                      <li>
                        <Link
                          to="/recruitment"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/recruitment"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Recruitment Process</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.staffRequisition && (
                      <li>
                        <Link
                          to="/staff-requisition"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/staff-requisition"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Staff Requisition</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.onboarding && (
                      <li>
                        <Link
                          to="/onboarding"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/onboarding"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Onboarding</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.employeeTransfer && (
              <Link
                to="/employee-transfer"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === "/employee-transfer"
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <RefreshCw size={20} />
                <span>Employee Transfer</span>
              </Link>
            )}
            {permissions.payroll && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("payroll")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} />
                    <span>{getPayrollLabel()}</span>
                  </div>
                  {openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.payroll && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.payroll.payrollProcessing && (
                      <li>
                        <Link
                          to="/payroll"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/payroll"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Payroll Processing</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.ticketsAndAdvances && (
                      <li>
                        <Link
                          to="/tickets"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/tickets"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Plane size={16} />
                          <span>Tickets & Advances</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.indemnityCalculation && (
                      <li>
                        <Link
                          to="/indemnity"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/indemnity"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Calculator size={16} />
                          <span>Indemnity Calculation</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.appraisal && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("appraisal")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} />
                    <span>Appraisal</span>
                  </div>
                  {openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.appraisal && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/appraisal"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/appraisal"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Appraisal</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.disciplinaryActions && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("disciplinaryActions")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.disciplinaryActions ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>Disciplinary Actions</span>
                  </div>
                  {openGroups.disciplinaryActions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.disciplinaryActions && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/disciplinary-actions"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/disciplinary-actions"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Disciplinary Actions</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.documentRequests && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("documentRequests")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.documentRequests ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck size={20} />
                    <span>Document Requests</span>
                  </div>
                  {openGroups.documentRequests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.documentRequests && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_manager/document-requests"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_manager/document-requests"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Manager Document Requests</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.HR_OFFICER:
        return (
          <>
            {permissions.recruitment && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("recruitment")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.recruitment ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} />
                    <span>{getRecruitmentLabel()}</span>
                  </div>
                  {openGroups.recruitment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.recruitment && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.recruitment.recruitmentProcess && (
                      <li>
                        <Link
                          to="/recruitment"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/recruitment"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Recruitment Process</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.onboarding && (
                      <li>
                        <Link
                          to="/onboarding"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/onboarding"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Onboarding</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.payroll && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("payroll")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} />
                    <span>{getPayrollLabel()}</span>
                  </div>
                  {openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.payroll && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.payroll.payrollProcessing && (
                      <li>
                        <Link
                          to="/payroll"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/payroll"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Payroll Processing</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.documentRequests && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("documentRequests")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.documentRequests ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck size={20} />
                    <span>Document Requests</span>
                  </div>
                  {openGroups.documentRequests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.documentRequests && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/hr_officer/document-requests"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/hr_officer/document-requests"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>HR Officer Document Requests</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.CEO:
      case ROLES.COUNTRY_MANAGER:
        return (
          <>
            {permissions.recruitment && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("recruitment")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.recruitment ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} />
                    <span>{getRecruitmentLabel()}</span>
                  </div>
                  {openGroups.recruitment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.recruitment && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.recruitment.recruitmentProcess && (
                      <li>
                        <Link
                          to="/recruitment"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/recruitment"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Recruitment Process</span>
                        </Link>
                      </li>
                    )}
                    {permissions.recruitment.staffRequisition && (
                      <li>
                        <Link
                          to="/staff-requisition"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/staff-requisition"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Staff Requisition</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.payroll && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("payroll")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} />
                    <span>{getPayrollLabel()}</span>
                  </div>
                  {openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.payroll && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.payroll.payrollProcessing && (
                      <li>
                        <Link
                          to="/payroll"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/payroll"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Payroll Processing</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.ticketsAndAdvances && (
                      <li>
                        <Link
                          to="/tickets"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/tickets"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Plane size={16} />
                          <span>Tickets & Advances</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.indemnityCalculation && (
                      <li>
                        <Link
                          to="/indemnity"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/indemnity"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Calculator size={16} />
                          <span>Indemnity Calculation</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.DEPARTMENT_MANAGER:
        return (
          <>
            {permissions.recruitment && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("recruitment")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.recruitment ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} />
                    <span>{getRecruitmentLabel()}</span>
                  </div>
                  {openGroups.recruitment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.recruitment && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.recruitment.staffRequisition && (
                      <li>
                        <Link
                          to="/staff-requisition"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/staff-requisition"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Staff Requisition</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.employeeTransfer && (
              <Link
                to="/employee-transfer"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === "/employee-transfer"
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <RefreshCw size={20} />
                <span>Employee Transfer</span>
              </Link>
            )}
            {permissions.appraisal && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("appraisal")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} />
                    <span>Appraisal</span>
                  </div>
                  {openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.appraisal && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/department_manager/appraisal"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/department_manager/appraisal"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>Department Manager Appraisal</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.disciplinaryActions && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("disciplinaryActions")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.disciplinaryActions ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>Disciplinary Actions</span>
                  </div>
                  {openGroups.disciplinaryActions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.disciplinaryActions && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/department_manager/disciplinary-actions"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/department_manager/disciplinary-actions"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>Department Manager Disciplinary Actions</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.DIRECT_MANAGER:
        return (
          <>
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.appraisal && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("appraisal")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} />
                    <span>Appraisal</span>
                  </div>
                  {openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.appraisal && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/direct_manager/appraisal"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/direct_manager/appraisal"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>Direct Manager Appraisal</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.disciplinaryActions && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("disciplinaryActions")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.disciplinaryActions ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>Disciplinary Actions</span>
                  </div>
                  {openGroups.disciplinaryActions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.disciplinaryActions && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/direct_manager/disciplinary-actions"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/direct_manager/disciplinary-actions"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>Direct Manager Disciplinary Actions</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.PAYROLL_OFFICER:
        return (
          <>
            {permissions.payroll && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("payroll")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.payroll ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} />
                    <span>{getPayrollLabel()}</span>
                  </div>
                  {openGroups.payroll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.payroll && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    {permissions.payroll.payrollProcessing && (
                      <li>
                        <Link
                          to="/payroll"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/payroll"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <span>Payroll Processing</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.ticketsAndAdvances && (
                      <li>
                        <Link
                          to="/tickets"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/tickets"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Plane size={16} />
                          <span>Tickets & Advances</span>
                        </Link>
                      </li>
                    )}
                    {permissions.payroll.indemnityCalculation && (
                      <li>
                        <Link
                          to="/indemnity"
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            location.pathname === "/indemnity"
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                          )}
                        >
                          <Calculator size={16} />
                          <span>Indemnity Calculation</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </>
        );
      case ROLES.PROJECT_MANAGER:
      case ROLES.OPERATIONS_MANAGER:
        return (
          <>
            {permissions.employeeTransfer && (
              <Link
                to="/employee-transfer"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === "/employee-transfer"
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <RefreshCw size={20} />
                <span>Employee Transfer</span>
              </Link>
            )}
          </>
        );
      case ROLES.CAMP_BOSS:
      case ROLES.ADMIN:
        return (
          <>
            {/* Minimal access assumed; can be expanded based on permissions */}
            <p className="px-3 py-2 text-gray-500">No additional navigation available</p>
          </>
        );
      case ROLES.EMPLOYEE:
        return (
          <>
            {permissions.leaveManagement && (
              <Link
                to={getLeaveManagementPath()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === getLeaveManagementPath()
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                )}
              >
                <Calendar size={20} />
                <span>Leave Management</span>
              </Link>
            )}
            {permissions.appraisal && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("appraisal")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.appraisal ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} />
                    <span>Appraisal</span>
                  </div>
                  {openGroups.appraisal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.appraisal && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/employee/appraisal"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/employee/appraisal"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>My Appraisal</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {permissions.documentRequests && (
              <div className="space-y-1">
                <button
                  onClick={() => toggleGroup("documentRequests")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700",
                    openGroups.documentRequests ? "bg-gray-100 dark:bg-gray-700" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck size={20} />
                    <span>Document Requests</span>
                  </div>
                  {openGroups.documentRequests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openGroups.documentRequests && (
                  <ul className="ml-6 space-y-1 border-l pl-2 dark:border-gray-700">
                    <li>
                      <Link
                        to="/role/employee/document-requests"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          location.pathname === "/role/employee/document-requests"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                        )}
                      >
                        <span>My Document Requests</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </>
        );
      default:
        return <p className="px-3 py-2 text-gray-500">No navigation available</p>;
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-300 md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
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
            {PERMISSIONS[userRole]?.dashboard && (
              <li>
                <Link
                  to="/dashboard"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/dashboard"
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                  )}
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </Link>
              </li>
            )}
            {renderSidebarContent()}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-4 dark:border-gray-700">
          <div className="text-xs text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>© 2025 HRMS System</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;