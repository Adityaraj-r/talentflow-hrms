import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import EmployeeDashboard from '@/pages/dashboard/EmployeeDashboard';
import ExecutiveDashboard from '@/pages/dashboard/ExecutiveDashboard';
import HRDashboard from '@/pages/dashboard/HRDashboard';
import ManagerDashboard from '@/pages/dashboard/ManagerDashboard';
import PayrollDashboard from '@/pages/dashboard/PayrollDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const defaultStats = {
    employees: 128,
    leaveBalance: 12,
    leaveRequests: 14,
    documentsRequested: 8,
    openPositions: 5,
    pendingApprovals: 3,
    turnoverRate: 2.4,
  };

  const getDashboardByRole = () => {
    const roleStr = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();

    // Derive roleLevel if not explicitly present on user object
    let roleLevel = user?.roleLevel;
    if (roleLevel === undefined || roleLevel === null) {
      if (roleStr.includes('CEO') || roleStr.includes('EXECUTIVE') || roleStr.includes('COUNTRY')) {
        roleLevel = 9;
      } else if (roleStr.includes('HR')) {
        roleLevel = 7;
      } else if (roleStr.includes('PAYROLL')) {
        roleLevel = 4;
      } else if (roleStr.includes('MANAGER')) {
        roleLevel = 5;
      } else if (roleStr.includes('ADMIN')) {
        roleLevel = 2;
      } else {
        roleLevel = 1;
      }
    }

    // Executive Dashboard (CEO, Country Manager)
    if (roleLevel >= 9 || roleStr.includes('CEO') || roleStr.includes('EXECUTIVE')) {
      return <ExecutiveDashboard stats={defaultStats} isLoading={false} />;
    }

    // HR Dashboard (HR Manager, HR Officer)
    if ((roleLevel >= 7 && roleLevel <= 8) || roleStr.includes('HR')) {
      return <HRDashboard stats={defaultStats} isLoading={false} />;
    }

    // Payroll Dashboard
    if (roleLevel === 4 || roleStr.includes('PAYROLL')) {
      return <PayrollDashboard stats={defaultStats} isLoading={false} />;
    }

    // Manager Dashboard (Dept Manager, Direct Manager, Project/Ops/Camp Manager)
    if ((roleLevel >= 3 && roleLevel <= 6) || roleStr.includes('MANAGER')) {
      return <ManagerDashboard stats={defaultStats} isLoading={false} />;
    }

    // Admin Dashboard
    if (roleLevel === 2 || roleStr.includes('ADMIN')) {
      return <AdminDashboard stats={defaultStats} />;
    }

    // Employee Dashboard (default)
    return <EmployeeDashboard stats={defaultStats} isLoading={false} />;
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {getDashboardByRole()}
    </div>
  );
};

export default Dashboard;
