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

  const getDashboardByRole = () => {
    const roleLevel = user?.roleLevel ?? 0;

    // Executive Dashboard (CEO, Country Manager)
    if (roleLevel >= 9) {
      return <ExecutiveDashboard stats={{}} isLoading={false} />;
    }

    // HR Dashboard (HR Manager, HR Officer)
    if (roleLevel >= 7 && roleLevel <= 8) {
      return <HRDashboard stats={{}} isLoading={false} />;
    }

        // Payroll Dashboard
    if (roleLevel === 4 || user?.role?.toLowerCase().includes('payroll')) {
      return <PayrollDashboard stats={{}} isLoading={false} />;
    }

    // Manager Dashboard (Dept Manager, Direct Manager, Project/Ops/Camp Manager)
    if (roleLevel >= 3 && roleLevel <= 6) {
      return <ManagerDashboard stats={{}} isLoading={false} />;
    }

    // Admin Dashboard
    if (roleLevel === 2 || user?.role?.toLowerCase() === 'admin') {
      return <AdminDashboard />;
    }

    // Employee Dashboard (default)
    return <EmployeeDashboard stats={{}} isLoading={false} />;
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {getDashboardByRole()}
    </div>
  );
};

export default Dashboard;
