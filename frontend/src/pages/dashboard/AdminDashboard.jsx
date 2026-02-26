import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, UserCheck, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DepartmentChart from "@/components/dashboard/charts/DepartmentChart";
import { GenderChart, RoleChart } from "@/components/dashboard/charts/DistributionCharts";
import { PendingApprovalsChart } from "@/components/dashboard/charts/PendingApprovalsChart";

const AdminDashboard = () => {
  // 1. Add state for the dynamic chart data
  const [chartData, setChartData] = useState({
    departments: [],
    roles: [],
    gender: [],
    pending: []
  });

  // 2. Set up dynamic state for your stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    security: "Secure"
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // 3. Update the fetch function to pull in the arrays
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming you store your JWT here
        const response = await axios.get("http://localhost:5001/api/admin/dashboard-stats", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extract everything including the new chart arrays
        const { totalUsers, activeUsers, inactiveUsers, departmentData, roleData, genderData,pendingApprovals,pendingBreakdown } = response.data.data;

        // Update the state with the real database numbers
        setStats(prev => ({
          ...prev,
          totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          pending: pendingApprovals !== undefined ? pendingApprovals : 0

        }));

        // Set the live chart data!
        // Using fallback || [] to prevent errors if the backend returns undefined temporarily
        setChartData(prev => ({
          ...prev,
          departments: departmentData || [],
          roles: roleData || [],
          gender: genderData || [],
          pending: pendingBreakdown || []
        }));

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">System overview, metrics, and alerts.</p>
      </div>

      {/* 4. Pass the dynamic state into your StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Users" value={stats.totalUsers} description="Registered Employees" icon={Users} borderColor="border-l-blue-500" textColor="text-blue-500" isLoading={isLoading} />
        
        <StatCard title="Active" value={stats.active} description="Currently Active" icon={UserCheck} borderColor="border-l-green-500" textColor="text-green-500" isLoading={isLoading} />
        
        <StatCard title="Pending Approvals" value={stats.pending} description="Approvals needed" icon={Clock} borderColor="border-l-yellow-500" textColor="text-yellow-500" isLoading={isLoading} />
        
        {/* Updated System Alerts to Inactive */}
        <StatCard title="Inactive" value={stats.inactive} description="Currently Inactive" icon={AlertTriangle} borderColor="border-l-red-500" textColor="text-red-500" isLoading={isLoading} />
        
        <StatCard title="Security" value={stats.security} description="System Healthy" icon={ShieldCheck} borderColor="border-l-purple-500" textColor="text-purple-500" isLoading={isLoading} />
      </div>

      {/* CHARTS GRID: Changed to grid-cols-5 for better width proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Bar chart now takes 3 out of 5 columns (60% width) */}
        <div className="lg:col-span-3">
          <DepartmentChart data={chartData.departments} />
        </div>
        
        {/* Donut chart now takes 2 out of 5 columns (40% width) - giving legends plenty of space! */}
        <div className="lg:col-span-2">
          <RoleChart data={chartData.roles} />
        </div>

        {/* Second Row: We maintain the 2/3 split for balance */}
        <div className="lg:col-span-2">
          <GenderChart data={chartData.gender} />
        </div>
        
        <div className="lg:col-span-3">
           <div className="lg:col-span-3">
           <PendingApprovalsChart data={chartData.pending} />
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;