// import { useState, useEffect } from "react";

// import FiltersSection from "@/components/reports/FiltersSection";
// import DepartmentWorkingHours from "@/components/reports/DepartmentWorkingHours";
// import DashboardSection from "@/components/reports/DashboardSection";
// import PerformanceSection from "@/components/reports/PerformanceSection";

// import useReports from "@/hooks/useReports";
// import useEmployeePerformance from "@/hooks/useEmployeePerformance";

// import ReportsHeader from "@/components/reports/ReportsHeader";
// import KPISection from "@/components/reports/KPISection";
// import WorkforceCharts from "@/components/reports/WorkforceCharts";
// import AttendanceCharts from "@/components/reports/AttendanceCharts";
// import DepartmentChart from "@/components/reports/DepartmentChart";
// import LeavePieChart from "@/components/reports/LeavePieChart";
// import ExecutiveInsights from "@/components/reports/ExecutiveInsights";
// import WorkforceHealthMeter from "@/components/reports/WorkforceHealthMeter";

// export default function ReportsPage() {
//   /* ================= GLOBAL FILTERS ================= */
//   const [filters, setFilters] = useState({
//     startDate: "",
//     endDate: "",
//     department: "all",
//     role: "all",
//   });

//   const {
//     data: reportsData,
//     loading: reportsLoading,
//     error: reportsError,
//   } = useReports(filters);

//   /* ================= PERFORMANCE FILTERS ================= */
//   const [performanceFilters, setPerformanceFilters] = useState({
//     role: "all",
//     department: "all",
//     search: "",
//     page: 1,
//     limit: 10,
//   });

//   useEffect(() => {
//     setPerformanceFilters((prev) => ({
//       ...prev,
//       role: filters.role,
//       department: filters.department,
//       page: 1,
//     }));
//   }, [filters.role, filters.department]);

//   const performanceHook = useEmployeePerformance(performanceFilters);

//   return (
//     <div className="p-6 space-y-8">
//       <h1 className="text-3xl font-bold">Reports & Analytics</h1>

//       <ReportsHeader filters={filters} setFilters={setFilters} />

//       <DashboardSection
//         data={reportsData}
//         loading={reportsLoading}
//         error={reportsError}
//         filters={filters}
//       />
    
//       <PerformanceSection
//         hook={performanceHook}
//         filters={performanceFilters}
//         setFilters={setPerformanceFilters}
//       />
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import api from "@/services/apiClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import DashboardSection from "@/components/reports/DashboardSection";
import PerformanceSection from "@/components/reports/PerformanceSection";
import ReportsHeader from "@/components/reports/ReportsHeader";

import useReports from "@/hooks/useReports";
import useEmployeePerformance from "@/hooks/useEmployeePerformance";
import { Button } from "@/components/ui/button";
export default function ReportsPage() {

  /* ================= GLOBAL FILTERS ================= */
  const [filters, setFilters] = useState({
    period: "3m",
    startDate: "",
    endDate: "",
    department: "all",
    role: "all",
  });

  /* ================= REPORTS DATA ================= */
  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
  } = useReports(filters);

  /* ================= PERFORMANCE FILTERS ================= */
  const [performanceFilters, setPerformanceFilters] = useState({
    role: "all",
    department: "all",
    search: "",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    setPerformanceFilters((prev) => ({
      ...prev,
      role: filters.role,
      department: filters.department,
      page: 1,
    }));
  }, [filters.role, filters.department]);

  const performanceHook = useEmployeePerformance(performanceFilters);

  /* ================= EXPORT CSV ================= */
  const handleExportCSV = async () => {
    const res = await api.get("/reports/export", { params: filters });
    const data = res.data.data;

    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(","));

    for (const row of data) {
      csvRows.push(
        headers.map(h => `"${row[h]}"`).join(",")
      );
    }

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "HRMS_Report.csv";
    a.click();
  };

  /* ================= EXPORT PDF ================= */
  const handleExportPDF = async () => {
    const res = await api.get("/reports/export", { params: filters });
    const data = res.data.data;

    if (!data.length) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("HRMS Report", 14, 15);

    autoTable(doc, {
      head: [Object.keys(data[0])],
      body: data.map(row => Object.values(row)),
      startY: 20,
    });

    doc.save("HRMS_Report.pdf");
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">
        Reports & Analytics
      </h1>

      <ReportsHeader filters={filters} setFilters={setFilters} />

      {/* EXPORT BUTTONS */}
      <div className="flex gap-4">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          Export CSV
        </button>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Export PDF
        </button>
      </div>

      <DashboardSection
        data={reportsData}
        loading={reportsLoading}
        error={reportsError}
        filters={filters}
      />

      <PerformanceSection
        hook={performanceHook}
        filters={performanceFilters}
        setFilters={setPerformanceFilters}
      />
    </div>
  );
}