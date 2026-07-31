import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/apiClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import KPISection from "@/components/reports/KPISection";
import AttendanceCharts from "@/components/reports/AttendanceCharts";
import LeavePieChart from "@/components/reports/LeavePieChart";
import PerformanceSection from "@/components/reports/PerformanceSection";
import ProductivityCards from "@/components/reports/ProductivityCards";
import TopLowPerformers from "@/components/reports/TopLowPerformers";
import AbsenteeismCard from "@/components/reports/AbsenteeismCard";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

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



  const handleExportPDF = async () => {
    try {
      const response = await api.get("/reports/performance", {
        params: { ...performanceFilters, page: 1, limit: 10000 },
      });
      const allData = response.data || [];
      const { summary } = data;

      const doc = new jsPDF("portrait", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const generatedDate = new Date().toLocaleString();

      const appliedFilters = [
        performanceFilters.department && performanceFilters.department !== "all" 
          ? `Dept: ${performanceFilters.department}` : "",
        performanceFilters.role && performanceFilters.role !== "all" 
          ? `Role: ${performanceFilters.role}` : "",
        performanceFilters.search 
          ? `Search: ${performanceFilters.search}` : ""
      ].filter(Boolean).join(" | ") || "None";

      // 1. Centered Title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("HRMS Performance Report", pageWidth / 2, 25, { align: "center" });

      // 2. Compact Report Info Section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(margin, 35, pageWidth - margin * 2, 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Report Type:", margin + 5, 42);
      doc.setFont("helvetica", "normal");
      doc.text("Employee Performance & KPIs", margin + 32, 42);

      doc.setFont("helvetica", "bold");
      doc.text("Generated:", pageWidth / 2 + 5, 42);
      doc.setFont("helvetica", "normal");
      doc.text(generatedDate, pageWidth / 2 + 28, 42);

      doc.setFont("helvetica", "bold");
      doc.text("Filters Applied:", margin + 5, 52);
      doc.setFont("helvetica", "normal");
      doc.text(appliedFilters, margin + 32, 52);

      doc.setFont("helvetica", "bold");
      doc.text("Total Employees:", pageWidth / 2 + 5, 52);
      doc.setFont("helvetica", "normal");
      doc.text(allData.length.toString(), pageWidth / 2 + 38, 52);

      // 3. Dashboard Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Dashboard Summary", margin, 70);

      autoTable(doc, {
        startY: 75,
        head: [["Metric", "Value"]],
        body: [
          ["Total Headcount", summary?.headcount || "N/A"],
          ["Avg Working Hours", `${summary?.avgWorkingHours || "N/A"} hrs`],
          ["Workforce Health", `${summary?.workforceHealthScore || "N/A"}%`],
          ["Total Payroll", `Rs. ${summary?.totalPayroll || "N/A"}`],
          ["Attrition Rate", `${summary?.attritionRate || "N/A"}%`],
          ["Open Positions", summary?.openPositions || "0"],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        bodyStyles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      });

      // 4. Employee Performance Data
      const finalY = doc.lastAutoTable.finalY || 75;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Performance Data", margin, finalY + 15);

      const tableDataFull = allData.map((emp) => [
        emp.employeeCode || emp.userId?.toString().slice(-6) || "N/A",
        `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "N/A",
        emp.department || "N/A",
        emp.designation || "N/A",
        `${emp.attendance ?? 0}%`,
        `${emp.leaves ?? 0}`,
        `${emp.lateMarks ?? 0}`,
        `${emp.compliance ?? 0}%`,
        `${emp.performanceScore ?? 0}%`,
        emp.grade || "N/A",
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [
          [
            "Emp ID",
            "Name",
            "Department",
            "Role",
            "Attn.",
            "Leaves",
            "Late",
            "Comp.",
            "Score",
            "Grade",
          ],
        ],
        body: tableDataFull,
        theme: "grid",
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        bodyStyles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin, bottom: 25 },
        styles: { fontSize: 7, cellPadding: 2 },
      });

      // 5. Page Borders and Footers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Outer Page Border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Footer Text
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        
        // Left
        doc.text(generatedDate, 14, pageHeight - 14);
        
        // Center
        doc.text("HRMS Performance Report", pageWidth / 2, pageHeight - 14, { align: "center" });

        // Right
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 14,
          { align: "right" }
        );
      }

      doc.save(`HRMS_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

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
          <div className="flex gap-4">

            <Button
              onClick={async () => {
                const blob = await api.get(
                  "/reports/export?type=csv",
                  { responseType: "blob", params: performanceFilters }
                );

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "reports.csv";
                link.click();
              }}
              variant="outline"
              className="bg-background shadow-sm hover:bg-muted/50 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

            <Button
              onClick={handleExportPDF}
              className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>

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