import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRole } from "../../contexts/RoleContext";
import ExecutiveDashboard from "./ExecutiveDashboard";
import HRDashboard from "./HRDashboard";
import ManagerDashboard from "./ManagerDashboard";
import PayrollDashboard from "./PayrollDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

const Dashboard = () => {
  const { user } = useAuth();
  const { getRoleCategory } = useRole();
  const [stats, setStats] = useState({
    employees: 0,
    leaveRequests: 0,
    pendingApprovals: 0,
    documentsRequested: 0,
    openPositions: 0,
    budgetUtilization: 0,
    turnoverRate: 0,
    timeToHire: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = () => {
      setIsLoading(true);
      setTimeout(() => {
        setStats({
          employees: 156,
          leaveRequests: 12,
          pendingApprovals: 8,
          documentsRequested: 5,
          openPositions: 7,
          budgetUtilization: 78,
          turnoverRate: 5.2,
          timeToHire: 21,
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchDashboardData();
  }, []);

  const renderRoleDashboard = () => {
    const roleCategory = getRoleCategory();

    switch (roleCategory) {
      case "executive":
        return <ExecutiveDashboard stats={stats} isLoading={isLoading} />;
      case "hr":
        return <HRDashboard stats={stats} isLoading={isLoading} />;
      case "manager":
        return <ManagerDashboard stats={stats} isLoading={isLoading} />;
      case "payroll":
        return <PayrollDashboard stats={stats} isLoading={isLoading} />;
      default:
        return <EmployeeDashboard stats={stats} isLoading={isLoading} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's what's happening today.</p>
      </div>
      {renderRoleDashboard()}
    </div>
  );
};

export default Dashboard;
