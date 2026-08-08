import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import DepartmentChart from "@/components/dashboard/charts/DepartmentChart";
import {
  GenderChart,
  RoleChart,
} from "@/components/dashboard/charts/DistributionCharts";
import { PendingApprovalsChart } from "@/components/dashboard/charts/PendingApprovalsChart";

import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboard, loading } = useAdminDashboard();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const {
    totalUsers,
    activeUsers,
    inactiveUsers,
    pendingApprovals,
    departmentData,
    roleData,
    genderData,
    pendingBreakdown,
  } = dashboard;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1. GREETING HEADER & DATA FRESHNESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            System Administration
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, <span className="font-bold">{user?.firstName || "Admin"}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back. Here's today's HR Operations Overview.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200 font-medium">Just now</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <StatCard
          title="Total Users"
          value={dashboard.totalUsers}
          description="+4 joined this month"
          icon={Users}
          borderColor="border-l-blue-500"
          textColor="text-blue-500"
          isLoading={loading}
          onClick={() => navigate('/all-employees')}
        />

        <StatCard
          title="Active"
          value={dashboard.activeUsers}
          description="96% active workforce"
          icon={UserCheck}
          borderColor="border-l-green-500"
          textColor="text-green-500"
          isLoading={loading}
          onClick={() => navigate('/all-employees')}
        />

        <StatCard
          title="Pending Approvals"
          value={dashboard.pendingApprovals}
          description="3 overdue approvals"
          icon={Clock}
          borderColor="border-l-yellow-500"
          textColor="text-yellow-500"
          isLoading={loading}
          onClick={() => navigate('/attendance/leave-management')}
        />

        <StatCard
          title="Inactive"
          value={dashboard.inactiveUsers}
          description="0 security flags"
          icon={AlertTriangle}
          borderColor="border-l-red-500"
          textColor="text-red-500"
          isLoading={loading}
          onClick={() => navigate('/all-employees')}
        />

        <StatCard
          title="Security"
          value="Secure"
          description="All nodes operational"
          icon={ShieldCheck}
          borderColor="border-l-purple-500"
          textColor="text-purple-500"
          isLoading={loading}
          onClick={() => navigate('/administration/audit-logs')}
        />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        <div className="lg:col-span-3">
          <DepartmentChart data={dashboard.departmentData ?? []} />
        </div>

        <div className="lg:col-span-2">
          <RoleChart data={dashboard.roleData ?? []} />
        </div>

        <div className="lg:col-span-2">
          <GenderChart data={dashboard.genderData ?? []} />
        </div>

        <div className="lg:col-span-3">
          <PendingApprovalsChart data={dashboard.pendingBreakdown ?? []} />
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;