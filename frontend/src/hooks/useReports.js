// import { useEffect, useState } from "react";
// import api from "@/services/apiClient"; 

// export default function useReports(filters) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAll = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const [
//           summaryRes,
//           workforceRes,
//           attendanceRes,
//           departmentsRes,
//           leavesRes,
//         ] = await Promise.all([
//           api.get("/reports/summary", { params: filters }),
//           api.get("/reports/workforce", { params: filters }),
//           api.get("/reports/attendance", { params: filters }),
//           api.get("/reports/departments", { params: filters }),
//           api.get("/reports/leaves", { params: filters }),
//         ]);
                
//         setData({
//           summary: summaryRes.data,
//           workforceTrend: workforceRes.data,
//           attendanceTrend: attendanceRes.data,
//           departmentDistribution: departmentsRes.data,
//           leaveBreakdown: leavesRes.data,
//         });

//       } catch (err) {
//         console.error("Reports fetch failed:", err);
//         setError("Failed to load dashboard data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [filters]);

//   return { data, loading, error };
// }

// import { useEffect, useState } from "react";
// import api from "@/services/apiClient";

// /* ======================================================
//    SUMMARY HOOK
// ====================================================== */
// export function useSummary(filters) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchSummary = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/reports/summary", { params: filters });
//         setData(res.data);
//       } catch (err) {
//         setError("Failed to load summary");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSummary();
//   }, [filters]);

//   return { data, loading, error };
// }

// /* ======================================================
//    WORKFORCE HOOK
// ====================================================== */
// export function useWorkforce(filters) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchWorkforce = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/reports/workforce", { params: filters });
//         setData(res.data);
//       } catch (err) {
//         setError("Failed to load workforce data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWorkforce();
//   }, [filters]);

//   return { data, loading, error };
// }

// /* ======================================================
//    ATTENDANCE HOOK
// ====================================================== */
// export function useAttendance(filters) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAttendance = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/reports/attendance", { params: filters });
//         setData(res.data);
//       } catch (err) {
//         setError("Failed to load attendance data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAttendance();
//   }, [filters]);

//   return { data, loading, error };
// }

// /* ======================================================
//    DEFAULT (FULL DASHBOARD) HOOK
// ====================================================== */
// export default function useReports(filters) {
//   const summary = useSummary(filters);
//   const workforce = useWorkforce(filters);
//   const attendance = useAttendance(filters);

//   return {
//     summary,
//     workforce,
//     attendance,
//   };
// }

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
          departmentHoursRes,
        ] = await Promise.all([
          api.get("/reports/summary", { params: filters }),
          api.get("/reports/workforce", { params: filters }),
          api.get("/reports/attendance", { params: filters }),
          api.get("/reports/departments", { params: filters }),
          api.get("/reports/leaves", { params: filters }),
          api.get("/reports/department-hours", { params: filters }),
        ]);

        setData({
          summary: summaryRes.data,
          workforceTrend: workforceRes.data,
          attendanceTrend: attendanceRes.data,
          departmentDistribution: departmentsRes.data,
          leaveBreakdown: leavesRes.data,
          departmentWorkingHours: departmentHoursRes.data,
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