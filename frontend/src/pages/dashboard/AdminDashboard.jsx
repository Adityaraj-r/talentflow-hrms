import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const smartAlerts = [
    {
      id: 1,
      type: 'approval',
      title: 'Pending Approvals',
      desc: `${pendingApprovals || 0} user actions require admin review.`,
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-100'
    },
    {
      id: 2,
      type: 'security',
      title: 'Security Status',
      desc: 'All nodes operational. No active security flags.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100'
    },
    {
      id: 3,
      type: 'users',
      title: 'System Users',
      desc: `${inactiveUsers || 0} inactive accounts detected.`,
      icon: <AlertTriangle className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100'
    }
  ];

  if (loading) {
     return <div className="min-h-screen bg-slate-50/50 flex items-center justify-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
          {getGreeting()}, {user?.firstName || "Admin"}
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Here's a quick overview of system health and user administration.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div 
              onClick={() => navigate('/all-employees')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Manage Users</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  View and manage all system accounts and permissions.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2 */}
            <div 
              onClick={() => navigate('/attendance/leave-management')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Approvals</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Handle pending requests and administrative overrides.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => navigate('/administration/audit-logs')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Audit & Security</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Monitor system logs and security alerts.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* KPI STATS ROW */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">System Metrics</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Real-time status of users and operations</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{totalUsers || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Users</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-green-600 dark:text-green-500 mb-2">{activeUsers || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Now</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-500 mb-2">{pendingApprovals || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Apps</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-red-500 dark:text-red-400 mb-2">{inactiveUsers || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Inactive</span>
              </div>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <DepartmentChart data={departmentData ?? []} />
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
               <RoleChart data={roleData ?? []} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <GenderChart data={genderData ?? []} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <PendingApprovalsChart data={pendingBreakdown ?? []} />
            </div>
          </div>

        </div>

        {/* SIDEBAR - SMART ALERTS */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">System Alerts</h3>
            
            <div className="space-y-4">
              {smartAlerts.length > 0 ? (
                smartAlerts.map(alert => (
                  <div key={alert.id} className={cn("p-4 rounded-[16px] border shadow-sm", alert.bg)}>
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-0.5">
                         {alert.icon}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-900">{alert.title}</h4>
                        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                          {alert.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-[16px] border border-slate-200 bg-slate-50 text-center text-[13px] text-slate-500">
                  No new alerts.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
