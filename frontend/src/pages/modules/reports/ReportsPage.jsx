import { useState } from "react";
import ReportsHeader from "@/components/reports/ReportsHeader";
import KPISection from "@/components/reports/KPISection";
import WorkforceCharts from "@/components/reports/WorkforceCharts";
import AttendanceCharts from "@/components/reports/AttendanceCharts";
import DepartmentChart from "@/components/reports/DepartmentChart";
import LeavePieChart from "@/components/reports/LeavePieChart";
import ExecutiveInsights from "@/components/reports/ExecutiveInsights";
import WorkforceHealthMeter from "@/components/reports/WorkforceHealthMeter";

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    department: "all",
  });

  return (
    <div className="p-6 space-y-8">
      
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Reports & Analytics
      </h1>

      {/* Header Filters */}
      <ReportsHeader filters={filters} setFilters={setFilters} />

      {/* Executive Insights Panel */}
      <ExecutiveInsights />

      {/* KPI Section */}
      <KPISection filters={filters} />

      {/* Charts */}
      <WorkforceCharts filters={filters} />
      <AttendanceCharts filters={filters} />

      <div className="grid md:grid-cols-2 gap-6">
        <DepartmentChart filters={filters} />
        <LeavePieChart filters={filters} />
      </div>
      <WorkforceHealthMeter filters={filters} />
    </div>
  );
}
