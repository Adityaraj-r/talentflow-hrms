import React from "react";
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
  const { dashboard, loading } = useAdminDashboard();
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

      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Admin Dashboard
        </h2>

        <p className="text-muted-foreground">
          System overview, metrics, and alerts.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <StatCard
          title="Total Users"
          value={dashboard.totalUsers}
          description="Registered Employees"
          icon={Users}
          borderColor="border-l-blue-500"
          textColor="text-blue-500"
          isLoading={loading}
        />

        <StatCard
          title="Active"
          value={dashboard.activeUsers}
          description="Currently Active"
          icon={UserCheck}
          borderColor="border-l-green-500"
          textColor="text-green-500"
          isLoading={loading}
        />

        <StatCard
          title="Pending Approvals"
          value={dashboard.pendingApprovals}
          description="Approvals needed"
          icon={Clock}
          borderColor="border-l-yellow-500"
          textColor="text-yellow-500"
          isLoading={loading}
        />

        <StatCard
          title="Inactive"
          value={dashboard.inactiveUsers}
          description="Currently Inactive"
          icon={AlertTriangle}
          borderColor="border-l-red-500"
          textColor="text-red-500"
          isLoading={loading}
        />

        <StatCard
          title="Security"
          value="Secure"
          description="System Healthy"
          icon={ShieldCheck}
          borderColor="border-l-purple-500"
          textColor="text-purple-500"
          isLoading={loading}
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