import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Users,
  Award,
  Target,
  BarChart3,
  ClipboardList,
  Layers,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Pagination } from "@/components/ui/pagination";
import apiClient from "@/services/apiClient";
import SkeletonCard from "@/components/reports/SkeletonCard";
import { performanceApi } from "@/services/performanceApi";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import { formatWorkflowStageLabel } from "@/lib/pmsDisplay";

function unwrapPayload(res) {
  if (res == null || typeof res !== "object") return res;
  const inner = res.data;
  if (inner === undefined) return res;
  return inner;
}

const HistogramBar = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#6366f1" name="Reviews" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const PerformanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    overallAvgRating: 0,
    activeCycles: 0,
    pendingPipelineCount: 0,
  });
  const [dashboard, setDashboard] = useState(null);
  const [ratingTrend, setRatingTrend] = useState([]);
  const [pageCycleRows, setPageCycleRows] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const [dashRes, statsRes, cyclesRes] = await Promise.all([
          performanceApi.getDashboardAnalytics(),
          performanceApi.getStats(),
          performanceApi.getCycles(),
        ]);

        const dashInner = unwrapPayload(dashRes);
        const dash =
          dashInner && typeof dashInner === "object" && !Array.isArray(dashInner)
            ? dashInner
            : {};

        const statsRaw = unwrapPayload(statsRes);
        const stats =
          statsRaw && typeof statsRaw === "object" && !Array.isArray(statsRaw)
            ? statsRaw
            : {};

        let reviews = [];
        try {
          const reviewsRes = await apiClient.get("/performance/reviews/all");
          const reviewsRaw = unwrapPayload(reviewsRes);
          reviews = Array.isArray(reviewsRaw) ? reviewsRaw : [];
        } catch {
          toast.error("Could not load reviews for trends");
          reviews = [];
        }

        const monthly = {};
        reviews.forEach((review) => {
          if (!review.createdAt) return;
          const month = new Date(review.createdAt).toLocaleDateString("en-US", {
            month: "short",
          });
          if (!monthly[month]) monthly[month] = { total: 0, count: 0 };
          monthly[month].total += Number(review.overallRating) || 0;
          monthly[month].count += 1;
        });
        const trendRows = Object.entries(monthly).map(([month, data]) => ({
          month,
          avgRating: parseFloat((data.total / Math.max(data.count, 1)).toFixed(1)),
        }));

        const cyclesRaw = unwrapPayload(cyclesRes);
        const cycles = Array.isArray(cyclesRaw) ? cyclesRaw : [];
        const activeCycles =
          cycles.filter((c) => c.status === "active").length || stats.activeCycles || 0;

        const pendingStages = dash.pendingActionsByStage || {};
        const pendingPipelineCount = Object.values(pendingStages).reduce(
          (a, b) => a + Number(b || 0),
          0
        );

        if (!cancelled) {
          setDashboard(dash);
          setRatingTrend(trendRows);
          setKpis({
            totalEmployees: stats.totalEmployees || 0,
            overallAvgRating:
              stats.avgScore != null ? Number(stats.avgScore) : 0,
            activeCycles,
            pendingPipelineCount,
          });
        }
      } catch (err) {
        toast.error(err?.error || err?.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const histogramChartData =
    dashboard?.ratingHistogram?.map((row) => ({
      label: String(row.bucket),
      count: row.count,
    })) ?? [];

  const deptChartData =
    dashboard?.departmentAvgRating?.filter((r) => r.count > 0) ?? [];

  const cycleRows = dashboard?.cycleCompletion ?? [];

  const pendingEntries = Object.entries(dashboard?.pendingActionsByStage ?? {});

  const topPerformers = dashboard?.topPerformers ?? [];

  if (loading)
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );

  return (
    <div className="space-y-6 max-w-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Employees" value={kpis.totalEmployees} icon={Users} variant="purple" />
        <StatsCard title="Org Avg Rating" value={(kpis.overallAvgRating || 0).toFixed(1) + "/5"} icon={TrendingUp} variant="emerald" />
        <StatsCard title="Active Cycles" value={kpis.activeCycles} icon={Target} variant="purple" />
        <StatsCard title="Open pipeline" value={kpis.pendingPipelineCount} icon={ClipboardList} variant="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              Department average rating
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Groups by populated employee department name
            </p>
          </CardHeader>
          <CardContent className="h-[360px] min-h-[360px]">
            {deptChartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Layers className="h-10 w-10 opacity-40" />
                <span>No rated reviews with department attached</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="department"
                    angle={-35}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgRating" fill="#8b5cf6" name="Avg rating" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Rating histogram (1–5)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Count of reviews by rounded overall rating
            </p>
          </CardHeader>
          <CardContent className="h-[360px] min-h-[360px]">
            {histogramChartData.every((d) => d.count === 0) ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <BarChart3 className="h-10 w-10 opacity-40" />
                <span>No rated reviews to chart yet</span>
              </div>
            ) : (
              <HistogramBar data={histogramChartData} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              Cycle completion
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Completed manager-submitted reviews vs assigned review slots
            </p>
          </CardHeader>
          <CardContent>
            {cycleRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <Target className="h-10 w-10 opacity-40" />
                No appraisal cycles configured yet.
              </div>
            ) : (
              <div className="space-y-5">
                {cycleRows.slice((pageCycleRows - 1) * 10, pageCycleRows * 10).map((row) => (
                  <div key={row.cycleId} className="space-y-2">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-muted-foreground">
                        {row.completedReviews} / {row.totalReviews} completed ·{" "}
                        {row.pct}%
                      </span>
                    </div>
                    <Progress value={row.pct} className="h-2" />
                  </div>
                ))}
              </div>
            )}
            {cycleRows.length > 0 && (
              <Pagination
                currentPage={pageCycleRows}
                totalPages={Math.ceil(cycleRows.length / 10)}
                totalItems={cycleRows.length}
                itemsPerPage={10}
                onPageChange={setPageCycleRows}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Rating trend (by review created month)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Uses live review list timestamps
            </p>
          </CardHeader>
          <CardContent className="h-[280px] min-h-[280px]">
            {ratingTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Not enough dated reviews for a trend line
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Avg rating"
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Pending actions by workflow stage
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Non-terminal reviews only — where work is still in flight
          </p>
        </CardHeader>
        <CardContent>
          {pendingEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No items in the pipeline — all reviews are finalized or none exist.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingEntries.map(([stage, count]) => (
                <div
                  key={stage}
                  className="rounded-lg border bg-muted/30 p-4 text-sm"
                >
                  <p className="font-medium leading-tight">
                    {formatWorkflowStageLabel(stage)}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top performers (final / approved reviews)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Top five by overall rating among completed cycles
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            {topPerformers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No finalized ratings yet — complete reviews to populate this table.
              </div>
            ) : (
              <DataTable 
                columns={[
                  { header: "Rank", accessorKey: "rank", cell: ({ row }) => <span className="font-bold">#{row.original.rank}</span> },
                  { header: "Employee", accessorKey: "name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
                  { header: "Department", accessorKey: "department", cell: ({ row }) => <span className="text-muted-foreground">{row.original.department}</span> },
                  { header: "Rating", accessorKey: "rating", cell: ({ row }) => <span className="text-lg font-bold text-orange-600">{(row.original.rating || 0).toFixed(1)}/5</span> },
                  { header: "Visual", cell: ({ row }) => (
                    <div className="h-2 w-full rounded-full bg-muted min-w-[100px]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500"
                        style={{
                          width: `${((row.original.rating || 0) / 5) * 100}%`,
                        }}
                      />
                    </div>
                  ) }
                ]} 
                data={topPerformers.map((p, i) => ({ ...p, rank: i + 1 }))} 
                defaultPageSize={10} 
                searchable={false} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics;
