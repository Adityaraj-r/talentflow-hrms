import ExecutiveInsights from "@/pages/reports/ExecutiveInsights";
import KPISection from "@/pages/reports/KPISection";
import WorkforceCharts from "@/pages/reports/WorkforceCharts";
import AttendanceCharts from "@/pages/reports/AttendanceCharts";
import DepartmentChart from "@/pages/reports/DepartmentChart";
import LeavePieChart from "@/pages/reports/LeavePieChart";
import WorkforceHealthMeter from "@/pages/reports/WorkforceHealthMeter";

export default function DashboardSection({
  data,
  loading,
  error,
  filters,
}) {
  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <>
      <ExecutiveInsights data={data.summary} />
      <KPISection data={data.summary} />

      <WorkforceCharts
        data={data.workforceTrend}
        filters={filters}
      />

      <AttendanceCharts
        data={data.attendanceTrend}
        filters={filters}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <DepartmentChart data={data.departmentDistribution} />
        <LeavePieChart data={data.leaveBreakdown} />
      </div>

      <WorkforceHealthMeter data={data.summary} />
    </>
  );
}