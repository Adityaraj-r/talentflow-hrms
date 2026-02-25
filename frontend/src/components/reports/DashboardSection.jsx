import ExecutiveInsights from "@/components/reports/ExecutiveInsights";
import KPISection from "@/components/reports/KPISection";
import WorkforceCharts from "@/components/reports/WorkforceCharts";
import AttendanceCharts from "@/components/reports/AttendanceCharts";
import DepartmentChart from "@/components/reports/DepartmentChart";
import LeavePieChart from "@/components/reports/LeavePieChart";
import WorkforceHealthMeter from "@/components/reports/WorkforceHealthMeter";
import DepartmentWorkingHours from "@/components/reports/DepartmentWorkingHours";
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
      <DepartmentWorkingHours data={data?.departmentWorkingHours} />
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