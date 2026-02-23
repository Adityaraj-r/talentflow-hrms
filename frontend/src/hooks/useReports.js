import { useEffect, useState } from "react";
import api from "@/services/apiClient"; 

export default function useReports(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          summaryRes,
          workforceRes,
          attendanceRes,
          departmentsRes,
          leavesRes,
        ] = await Promise.all([
          api.get("/reports/summary", { params: filters }),
          api.get("/reports/workforce", { params: filters }),
          api.get("/reports/attendance", { params: filters }),
          api.get("/reports/departments", { params: filters }),
          api.get("/reports/leaves", { params: filters }),
        ]);
                
        setData({
          summary: summaryRes.data,
          workforceTrend: workforceRes.data,
          attendanceTrend: attendanceRes.data,
          departmentDistribution: departmentsRes.data,
          leaveBreakdown: leavesRes.data,
        });

      } catch (err) {
        console.error("Reports fetch failed:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [filters]);

  return { data, loading, error };
}