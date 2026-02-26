import { useState, useEffect, useCallback } from 'react';
import adminService from '@/services/adminService';

/**
 * Custom hook for admin dashboard data
 * @returns {{
 *   metrics: Object|null,
 *   activities: Array,
 *   userDistribution: Array,
 *   departmentStats: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refreshing: boolean,
 *   refresh: Function,
 *   loadMoreActivities: Function
 * }}
 */
export const useAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [userDistribution, setUserDistribution] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [metricsData, activitiesData, distributionData, departmentData] = await Promise.allSettled([
        adminService.getMetrics(),
        adminService.getActivities({ page: 1, limit: 10 }),
        adminService.getUserDistribution(),
        adminService.getDepartmentStats()
      ]);

      // Handle metrics
      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      }

      // Handle activities
      if (activitiesData.status === 'fulfilled') {
        setActivities(activitiesData.value.activities || []);
      }

      // Handle user distribution
      if (distributionData.status === 'fulfilled') {
        setUserDistribution(distributionData.value.distribution || []);
      }

      // Handle department stats
      if (departmentData.status === 'fulfilled') {
        setDepartmentStats(departmentData.value || []);
      }

      // Check if any request failed
      const failedRequests = [metricsData, activitiesData, distributionData, departmentData]
        .filter(result => result.status === 'rejected');
      
      if (failedRequests.length > 0) {
        console.warn('Some dashboard requests failed:', failedRequests);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Load more activities
  const loadMoreActivities = useCallback(async (page) => {
    try {
      const data = await adminService.getActivities({ page, limit: 10 });
      setActivities(prev => [...prev, ...(data.activities || [])]);
      return data;
    } catch (err) {
      console.error('Error loading more activities:', err);
      throw err;
    }
  }, []);

  return {
    metrics,
    activities,
    userDistribution,
    departmentStats,
    loading,
    error,
    refreshing,
    refresh,
    loadMoreActivities
  };
};
