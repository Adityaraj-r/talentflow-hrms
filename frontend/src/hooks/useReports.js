import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import {
  getSummary,
  getWorkforce,
  getAttendance,
  getDepartments,
  getLeaves,
  getEmployeePerformance,
  getDepartmentWorkingHours,
  getCEOInsights,
} from "@/services/reports.service";

export default function useReports(filters) {
  const { user } = useAuth();

  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || "";

  const [data, setData] = useState({
    summary: {},
    workforceTrend: [],
    attendanceTrend: [],
    departmentDistribution: [],
    leaveBreakdown: [],
    departmentWorkingHours: [],
    performance: [],
    ceoInsights: null,
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    const fetchReports =
      async () => {
        try {
          setLoading(true);
          setError(null);

          if (
            role === "DEPARTMENT_MANAGER" ||
            role === "DIRECT_MANAGER") {
            const [
              summaryRes,
              attendanceRes,
              leavesRes,
              hoursRes,
              performanceRes,
            ] =
              await Promise.all([
                getSummary(filters),
                getAttendance( filters),
                getLeaves(filters),
                getDepartmentWorkingHours(filters),
                getEmployeePerformance(filters),
              ]);

            setData({
              summary:summaryRes?.data || {},
              workforceTrend:[],
              attendanceTrend:attendanceRes?.data || [],
              departmentDistribution: [],
              leaveBreakdown:leavesRes?.data || [],
              departmentWorkingHours:hoursRes?.data || [],
              performance: performanceRes?.data || [],
              ceoInsights: null,
            });

            return;
          }

          if (role === "HR_OFFICER") {
            const [
              summaryRes,
              attendanceRes,
              leavesRes
            ] = await Promise.all([
              getSummary(filters),
              getAttendance(filters),
              getLeaves(filters)
            ]);

            setData({
              summary: summaryRes?.data || {},
              workforceTrend: [],
              attendanceTrend: attendanceRes?.data || [],
              departmentDistribution: [],
              leaveBreakdown: leavesRes?.data || [],
              departmentWorkingHours: [],
              performance: [],
              ceoInsights: null,
            });

            return;
          }

          if (role === "EMPLOYEE") {
            const [
              summaryRes,
              attendanceRes,
              leavesRes
            ] = await Promise.all([
              getSummary(filters),
              getAttendance(filters),
              getLeaves(filters)
            ]);

            setData({
              summary: summaryRes?.data || {},
              workforceTrend: [],
              attendanceTrend: attendanceRes?.data || [],
              departmentDistribution: [],
              leaveBreakdown: leavesRes?.data || [],
              departmentWorkingHours: [],
              performance: [],
              ceoInsights: null,
            });

            return;
          }

          const [
            summaryRes,
            workforceRes,
            attendanceRes,
            departmentsRes,
            leavesRes,
            hoursRes,
            performanceRes,
            ceoInsightsRes,
          ] =
            await Promise.all([getSummary(filters),
              getWorkforce(filters),
              getAttendance(filters),
              getDepartments(filters),
              getLeaves(filters),
              getDepartmentWorkingHours(filters),
              getEmployeePerformance({ ...filters, limit: 1000 }),
              getCEOInsights(filters),
            ]);

          setData({
            summary:summaryRes?.data || {},
            workforceTrend:workforceRes?.data || [],
            attendanceTrend:attendanceRes?.data || [],
            departmentDistribution:departmentsRes?.data || [],
            leaveBreakdown:leavesRes?.data || [],
            departmentWorkingHours:hoursRes?.data || [],
            performance:performanceRes?.data || [],
            ceoInsights:ceoInsightsRes?.data || null,
          });
        } catch (err) {
          console.error("Reports fetch failed:",err);

          setError("Failed to load dashboard data");
          
        } finally {
          setLoading(false);
        }
      };

    fetchReports();
  }, [
    JSON.stringify(filters),
    role,
  ]);

  return {
    data,
    loading,
    error,
  };
}