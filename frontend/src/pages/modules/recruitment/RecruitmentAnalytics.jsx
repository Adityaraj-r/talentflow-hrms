import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Activity, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import recruitmentAnalyticsService from "@/services/recruitmentAnalyticsService";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AnalyticsFilters,
  AnalyticsLoading,
  DepartmentDemandChart,
  DrillDownPanel,
  ExportCenter,
  HiringFunnelChart,
  HiringVelocityChart,
  InsightsPanel,
  RecruitmentHealthScore,
  RecruiterLeaderboard,
  SourceAnalyticsChart,
  TrendChart,
} from "@/components/recruitment/RecruitmentAnalyticsComponents";

const toISODate = (date) => date.toISOString().slice(0, 10);

const defaultFilters = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
    recruiter: "All",
    department: "All",
    role: "All",
    source: "All",
    status: "All",
  };
};

const getPayload = (response) => response?.data || response || {};

const flattenReport = (analytics) => [
  ...(analytics.overview || []).map((item) => ({ report: "Overview", metric: item.label, value: `${item.value}${item.suffix || ""}`, trend: item.trend })),
  ...(analytics.funnel || []).map((item) => ({ report: "Funnel", metric: item.stage, value: item.count, conversion: item.conversion, dropOff: item.dropOff })),
  ...(analytics.recruiters || []).map((item) => ({ report: "Recruiter", metric: item.recruiter, hires: item.hires, interviews: item.interviews, score: item.productivityScore })),
  ...(analytics.sources || []).map((item) => ({ report: "Source", metric: item.source, candidates: item.candidates, quality: item.quality, hireSuccessRate: item.hireSuccessRate })),
  ...(analytics.departmentDemand || []).map((item) => ({ report: "Department", metric: item.department, openPositions: item.openPositions, demandScore: item.demandScore, conversion: item.conversion })),
];

const tableColumns = {
  recruiters: [
    { key: "rank", label: "Rank" },
    { key: "recruiter", label: "Recruiter" },
    { key: "hires", label: "Hires" },
    { key: "interviews", label: "Interviews" },
    { key: "conversionRate", label: "Conversion %" },
    { key: "averageHiringTime", label: "Avg Hiring Time" },
    { key: "offerAcceptance", label: "Offer Acceptance %" },
    { key: "productivityScore", label: "Score" },
  ],
  sources: [
    { key: "source", label: "Source" },
    { key: "candidates", label: "Candidates" },
    { key: "contribution", label: "Contribution %" },
    { key: "quality", label: "Quality %" },
    { key: "conversionRate", label: "Conversion %" },
    { key: "hireSuccessRate", label: "Hire Success %" },
  ],
  funnel: [
    { key: "stage", label: "Stage" },
    { key: "count", label: "Count" },
    { key: "conversion", label: "Conversion %" },
    { key: "dropOff", label: "Drop-off %" },
    { key: "bottleneck", label: "Bottleneck" },
  ],
  departments: [
    { key: "department", label: "Department" },
    { key: "openPositions", label: "Open Positions" },
    { key: "applications", label: "Applications" },
    { key: "hires", label: "Hires" },
    { key: "conversion", label: "Conversion %" },
    { key: "demandScore", label: "Demand Score" },
  ],
};

const RecruitmentAnalytics = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDrilldown, setSelectedDrilldown] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await recruitmentAnalyticsService.getOverview(filters);
      setAnalytics(getPayload(response));
    } catch (error) {
      const message = error?.message || "Failed to load recruitment analytics";
      setError(message);
      toast.error(message);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const options = analytics?.filters || { recruiters: [], departments: [], roles: [], sources: [], statuses: [] };
  const exportRows = useMemo(() => flattenReport(analytics || {}), [analytics]);

  const handleExport = (type) => {
    if (!exportRows.length) {
      toast.warning("No analytics rows available to export");
      return;
    }

    if (type === "csv") {
      const headers = [...new Set(exportRows.flatMap((row) => Object.keys(row)))];
      const csv = [
        headers.join(","),
        ...exportRows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recruitment-analytics.csv";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (type === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recruitment Analytics");
      XLSX.writeFile(workbook, "recruitment-analytics.xlsx");
      return;
    }

    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Recruitment Analytics Report", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Report", "Metric", "Value", "Trend", "Score"]],
      body: exportRows.map((row) => [row.report, row.metric, row.value ?? row.candidates ?? row.openPositions ?? row.count ?? "", row.trend ?? row.conversion ?? "", row.score ?? row.demandScore ?? ""]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });
    doc.save("recruitment-analytics.pdf");
  };

  return (
    <div id="report-container" className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Recruitment Analytics & Intelligence</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Executive hiring intelligence across funnel health, recruiter productivity, source quality, hiring velocity, and staffing demand.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={fetchAnalytics} variant="outline" size="icon" className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-white/10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ExportCenter onExport={handleExport} />
        </div>
      </div>

      <AnalyticsFilters
        filters={filters}
        options={options}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters())}
      />

      {loading ? (
        <AnalyticsLoading />
      ) : error ? (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-6 text-center">
          <p className="font-semibold text-slate-900 dark:text-white">Recruitment analytics could not be loaded</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4 bg-cyan-600 dark:bg-cyan-300 text-slate-900 dark:text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">
            Retry
          </Button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(analytics?.overview || []).map((metric, idx) => (
              <StatsCard
                key={metric.key}
                title={metric.label}
                value={metric.value}
                variant={idx % 4 === 0 ? "purple" : idx % 4 === 1 ? "blue" : idx % 4 === 2 ? "emerald" : "amber"}
                isActive={activeMetric === metric.key}
                onClick={() => {
                  setActiveMetric(metric.key);
                  setSelectedDrilldown({ label: metric.label, value: Number(metric.value) || 0, trend: Number(metric.trend) || 0 });
                }}
              />
            ))}
          </section>

          <DrillDownPanel item={selectedDrilldown} onClose={() => setSelectedDrilldown(null)} />

          <section className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
            <HiringFunnelChart data={analytics?.funnel || []} onStageClick={setSelectedDrilldown} />
            <RecruiterLeaderboard data={analytics?.recruiters || []} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
            <SourceAnalyticsChart data={analytics?.sources || []} />
            <RecruitmentHealthScore health={analytics?.health} />
          </section>

          <HiringVelocityChart data={analytics?.velocity || []} />
          <DepartmentDemandChart data={analytics?.departmentDemand || []} onClick={setSelectedDrilldown} />
          <TrendChart data={analytics?.monthly || []} />
          <InsightsPanel insights={analytics?.insights || []} />

          <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10">
            <div className="mb-5 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary dark:text-cyan-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analytics Tables</h2>
            </div>
            <div className="grid gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Recruiter Performance Table</h3>
                <DataTable data={analytics?.tables?.recruiters || []} columns={tableColumns.recruiters.map(c => ({ accessorKey: c.key, header: c.label }))} />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Source Performance Table</h3>
                <DataTable data={analytics?.tables?.sources || []} columns={tableColumns.sources.map(c => ({ accessorKey: c.key, header: c.label }))} />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Hiring Funnel Breakdown</h3>
                <DataTable data={(analytics?.tables?.funnel || []).map((row) => ({ ...row, bottleneck: row.bottleneck ? "Yes" : "No" }))} columns={tableColumns.funnel.map(c => ({ accessorKey: c.key, header: c.label }))} />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Department Hiring Table</h3>
                <DataTable data={analytics?.tables?.departments || []} columns={tableColumns.departments.map(c => ({ accessorKey: c.key, header: c.label }))} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RecruitmentAnalytics;
