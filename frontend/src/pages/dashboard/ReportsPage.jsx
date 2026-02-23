import { useState, useEffect } from "react";
import ReportsHeader from "@/pages/reports/ReportsHeader";
import FiltersSection from "@/pages/reports/FiltersSection";

import DashboardSection from "@/pages/reports/DashboardSection";
import PerformanceSection from "@/pages/reports/PerformanceSection";

import useReports from "@/hooks/useReports";
import useEmployeePerformance from "@/hooks/useEmployeePerformance";

export default function ReportsPage() {
  /* ================= GLOBAL FILTERS ================= */
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    department: "all",
    role: "all",
  });

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

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <ReportsHeader filters={filters} setFilters={setFilters} />

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