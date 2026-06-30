import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/apiClient";

import KPISection from "@/components/reports/KPISection";
import AttendanceCharts from "@/components/reports/AttendanceCharts";
import LeavePieChart from "@/components/reports/LeavePieChart";
import PerformanceSection from "@/components/reports/PerformanceSection";
import ProductivityCards from "@/components/reports/ProductivityCards";
import TopLowPerformers from "@/components/reports/TopLowPerformers";
import AbsenteeismCard from "@/components/reports/AbsenteeismCard";

export default function DashboardSection({
  data,
  loading,
  error,
  filters,
  setFilters,
  performanceFilters,
  setPerformanceFilters,
  performanceHook,
}) {
  const { user } = useAuth();

  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || "";

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  if (!data) return null;

  return (
    <div className="space-y-8">

      {/* Common KPI for both manager roles */}
      {(role === "DEPARTMENT_MANAGER" ||
        role === "DIRECT_MANAGER") && (
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />
        )}

      {/* Department Manager */}
      {role === "DEPARTMENT_MANAGER" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Department Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Department Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Top / Low Performers */}
          <TopLowPerformers
            data={data.performance}
          />

          {/* Department Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Team Strength
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.headcount }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Avg Productivity
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.avgWorkingHours } hrs
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Pending Requests
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.pendingRequests }
              </h3>
            </div>
          </div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "ADMIN" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                System Health Score
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data?.summary?.workforceHealthScore }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Total Payroll
              </p>
              <h3 className="text-2xl font-bold mt-2">
                ₹{data?.summary?.totalPayroll }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Attrition Rate
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data?.summary?.attritionRate }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Open Positions
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data?.summary?.openPositions }
              </h3>
            </div>

          </div>

          {/* Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          <TopLowPerformers
            data={data.performance}
          />

          {/* Admin Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Best Department
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.bestDepartment || "N/A"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Highest Attrition
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.highestAttrition || "N/A"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Lowest Attendance
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.lowestAttendance || "N/A"}
              </h3>
            </div>
          </div>

          {/* Export Actions */}
          {/* Export Actions */}
          <div className="flex gap-4">

  <button
    onClick={async () => {
      const blob = await api.get(
        "/reports/export?type=csv",
        { responseType: "blob" }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "reports.csv";
      link.click();
    }}
    className="px-4 py-2 rounded-xl bg-black text-white"
  >
    Export CSV
  </button>

  <button
    onClick={async () => {
      const blob = await api.get(
        "/reports/export?type=pdf",
        { responseType: "blob" }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "reports.pdf";
      link.click();
    }}
    className="px-4 py-2 rounded-xl bg-slate-700 text-white"
  >
    Export PDF
  </button>

</div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {/* Direct Manager */}
      {role === "DIRECT_MANAGER" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Team Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Team Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Top / Needs Attention */}
          <TopLowPerformers
            data={data.performance}
          />

          {/* Team Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Team Size
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.headcount }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Avg Team Score
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.score }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Pending Approvals
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.pendingApprovals }
              </h3>
            </div>
          </div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "HR_MANAGER" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Employee Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Top / Low Performers */}
          <TopLowPerformers
            data={data.performance}
          />

          {/* Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* HR Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Best Department
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.bestDepartment || "IT"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Highest Attrition
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.highestAttrition || "N/A"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Lowest Attendance
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.ceoInsights?.lowestAttendance || "N/A"}
              </h3>
            </div>
          </div>

          {/* Absenteeism Summary */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "CEO" && (
        <>
          {/* Main KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Workforce Health Score
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data.summary?.workforceHealthScore }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Payroll Cost
              </p>
              <h3 className="text-2xl font-bold mt-2">
                ₹{data.summary?.totalPayroll }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Attrition Risk
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data.summary?.attritionRate }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Avg Productivity
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {data.summary?.avgWorkingHours } hrs
              </h3>
            </div>

          </div>

          {/* Workforce Growth Trend */}
          {data.workforceTrend?.length > 0 && (
            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                Workforce Growth Trend
              </h2>

              {data.workforceTrend?.length ? (
                data.workforceTrend.map((item, i) => (
                  <div key={i}>{item.month} - {item.headcount}</div>
                ))
              ) : (
                <p>No workforce data available</p>
              )}
            </div>
          )}

          {/* Department Comparison */}
          {data.departmentWorkingHours?.length > 0 && (
            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                Department Comparison
              </h2>

              {data.departmentWorkingHours?.length ? (
                data.departmentWorkingHours.map((item, i) => (
                  <div key={i}>{item.department}</div>
                ))
              ) : (
                <p>No department data available</p>
              )}
            </div>
          )}

          {/* Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          <TopLowPerformers
            data={data.performance}
          />

          {/* CEO Insights */}
          {data.ceoInsights && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  Top Performers
                </h2>

                {data.ceoInsights.topPerformers?.map((emp, i) => (
                  <div
                    key={i}
                    className="py-2 border-b last:border-0"
                  >
                    {emp.name} — {emp.performance}%
                  </div>
                ))}
              </div>

              <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  Performance Distribution
                </h2>

                <div className="space-y-2 text-sm">
                  <p>Grade A: {data.ceoInsights.distribution?.A }</p>
                  <p>Grade B: {data.ceoInsights.distribution?.B }</p>
                  <p>Grade C: {data.ceoInsights.distribution?.C }</p>
                  <p>Grade D: {data.ceoInsights.distribution?.D }</p>
                </div>
              </div>

            </div>
          )}

          {/* Smart Executive Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Best Department
              </p>
              <h3 className="text-xl font-bold mt-2">
                {data?.ceoInsights?.bestDepartment || "N/A"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Highest Attrition
              </p>
              <h3 className="text-xl font-bold mt-2">
                {data?.ceoInsights?.highestAttrition || "N/A"}
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Lowest Attendance
              </p>
              <h3 className="text-xl font-bold mt-2">
                {data?.ceoInsights?.lowestAttendance || "N/A"}
              </h3>
            </div>

          </div>

          {/* Workforce Risk */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "OPERATIONS_MANAGER" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Productivity */}
          <ProductivityCards
            data={data.departmentWorkingHours}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Top / Low Performers */}
          <TopLowPerformers
            data={data.performance}
          />

          {/* Operations Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Efficiency Rate
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.efficiencyRate }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Overtime Hours
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.overtimeHours }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Workforce Utilization
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.utilization }%
              </h3>
            </div>
          </div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "HR_OFFICER" && (
        <>
          {/* KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Employee Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Top / Low Performers */}
          <TopLowPerformers
            data={data.performance}
          />

          {/* HR Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Pending Leaves
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.pendingLeaves }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                New Joiners
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.newJoiners }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Probation Employees
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.probationEmployees }
              </h3>
            </div>
          </div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

      {role === "EMPLOYEE" && (
        <>
          {/* Personal KPI Cards */}
          <KPISection
            data={data.summary}
            loading={loading}
            error={error}
          />

          {/* Attendance + Leave */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AttendanceCharts
              data={data.attendanceTrend}
              filters={filters}
            />

            <LeavePieChart
              data={data.leaveBreakdown}
            />
          </div>

          {/* Personal Performance */}
          <PerformanceSection
            hook={performanceHook}
            filters={performanceFilters}
            setFilters={setPerformanceFilters}
          />

          {/* Personal Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                My Attendance
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.avgAttendance }%
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Leave Balance
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.leaveBalance }
              </h3>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-sm p-6">
              <p className="text-muted-foreground text-sm">
                Performance Score
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {data?.summary?.score }
              </h3>
            </div>
          </div>

          {/* Absenteeism */}
          <AbsenteeismCard
            attendance={data.attendanceTrend}
            leaves={data.leaveBreakdown}
          />
        </>
      )}

    </div>
  );
}