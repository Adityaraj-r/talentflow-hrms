import { useState } from "react";
import ReportsHeader from "../reports/ReportsHeader";
import KPISection from "../reports/KPISection";
import WorkforceCharts from "../reports/WorkforceCharts";
import AttendanceCharts from "../reports/AttendanceCharts";
import DepartmentChart from "../reports/DepartmentChart";
import LeavePieChart from "../reports/LeavePieChart";
import ExecutiveInsights from "../reports/ExecutiveInsights";
import WorkforceHealthMeter from "../reports/WorkforceHealthMeter";

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
      <ExecutiveInsights filters={filters}/>

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
