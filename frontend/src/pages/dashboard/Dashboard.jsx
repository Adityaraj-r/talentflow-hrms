import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import PayrollDashboard from './PayrollDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Map role hierarchy to dashboard types
  const getDashboardByRole = () => {
    const roleLevel = user?.roleLevel || user?.role;
    
    // Role hierarchy: CEO(10), Country Manager(9), HR Manager(8), HR Officer(7),
    // Dept Manager(6), Direct Manager(5), Payroll(4), Project/Ops/Camp(3), Admin(2), Employee(1)
    
    // Executive Dashboard (CEO, Country Manager)
    if (roleLevel >= 9) {
      return <ExecutiveDashboard stats={{}} isLoading={false} />;
    }
    
    // HR Dashboard (HR Manager, HR Officer)
    if (roleLevel >= 7 && roleLevel <= 8) {
      return <HRDashboard stats={{}} isLoading={false} />;
    }
    
    // Manager Dashboard (Dept Manager, Direct Manager, Project/Ops/Camp Manager)
    if (roleLevel >= 3 && roleLevel <= 6) {
      return <ManagerDashboard stats={{}} isLoading={false} />;
    }
    
    // Payroll Dashboard
    if (roleLevel === 4 || user?.role?.toLowerCase().includes('payroll')) {
      return <PayrollDashboard stats={{}} isLoading={false} />;
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
