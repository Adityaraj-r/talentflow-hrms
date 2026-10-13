import { useState, useEffect, useCallback } from "react";
import adminService from "@/services/adminService";

export const useAdminDashboard = () => {
  const [dashboard, setDashboard] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingApprovals: 0,
    departmentData: [],
    roleData: [],
    genderData: [],
    pendingBreakdown: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await adminService.getDashboardStats();

      // Backend returns:
      // {
      //   success: true,
      //   data: { ...dashboardData }
      // }

      setDashboard(response.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = () => fetchDashboardData(true);

  return {
    dashboard,
    loading,
    refreshing,
    error,
    refresh,
  };
};