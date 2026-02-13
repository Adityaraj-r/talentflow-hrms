import { useState } from "react";
import ReportsHeader from "../../components/reports/ReportsHeader";
import KPISection from "../../components/reports/KPISection";
import WorkforceCharts from "../../components/reports/WorkforceCharts";
import AttendanceCharts from "../../components/reports/AttendanceCharts";
import DepartmentChart from "../../components/reports/DepartmentChart";
import LeavePieChart from "../../components/reports/LeavePieChart";
import ExecutiveInsights from "../../components/reports/ExecutiveInsights";


export default function ReportsPage() {
  const [filters, setFilters] = useState({});

  return (
    <div className="p-6 space-y-8 text-white" id="report-container">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Reports & Analytics
      </h1>

      <ReportsHeader filters={filters} setFilters={setFilters} />
      <ExecutiveInsights />
      <KPISection filters={filters} />

      <WorkforceCharts />
      <AttendanceCharts />

      <div className="grid md:grid-cols-2 gap-6">
        <DepartmentChart />
        <LeavePieChart />
      </div>
    </div>
  );
}
