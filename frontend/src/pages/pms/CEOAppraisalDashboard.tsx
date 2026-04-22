import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/services/apiClient";
import { fetchAppraisalCycles, fetchBonusPreview } from "@/api/pmsApi";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatRatingBandLabel,
  mapOverallRatingToBand,
} from "@/constants/appraisalRatingBands";

type DeptRow = { department: string; avgRating: number; count: number };
type TopRow = { name: string; department: string; rating: number };

interface DashboardPayload {
  departmentAvgRating?: DeptRow[];
  topPerformers?: TopRow[];
}

function unwrapDashboard(res: unknown): DashboardPayload {
  if (!res || typeof res !== "object") return {};
  const r = res as { data?: DashboardPayload };
  return r.data ?? {};
}

export default function CEOAppraisalDashboardSection() {
  const cyclesQuery = useQuery({
    queryKey: ["pmsCycles", "ceoDash"],
    queryFn: () => fetchAppraisalCycles(),
  });

  const analyticsQuery = useQuery({
    queryKey: ["performanceDashboardAnalytics"],
    queryFn: async () => {
      const res = await apiClient.get("/performance/dashboard-analytics");
      return unwrapDashboard(res);
    },
  });

  const processedCycles = useMemo(
    () => (cyclesQuery.data ?? []).filter((c) => c.status === "processed"),
    [cyclesQuery.data]
  );

  const poolQuery = useQuery({
    queryKey: ["pmsBonusPool", processedCycles.map((c) => c._id).join(",")],
    queryFn: async () => {
      let total = 0;
      for (const c of processedCycles) {
        const rows = await fetchBonusPreview(c._id);
        for (const row of rows) {
          if (!row.skippedReason) total += Number(row.bonusAmount) || 0;
        }
      }
      return total;
    },
    enabled: processedCycles.length > 0,
  });

  if (cyclesQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (processedCycles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Appraisal insights</CardTitle>
          <CardDescription>
            No processed appraisal cycles yet. When HR closes the cycle and runs payroll bonuses, executive
            benchmarks will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dept = analyticsQuery.data?.departmentAvgRating ?? [];
  const top = analyticsQuery.data?.topPerformers ?? [];

  const chartData = dept.map((d) => ({
    name: d.department.length > 16 ? `${d.department.slice(0, 14)}…` : d.department,
    full: d.department,
    avg: d.avgRating,
  }));

  return (
    <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Performance &amp; appraisal (processed cycles)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Benchmarks from org performance analytics; bonus pool sums appraisal previews for processed cycles.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Avg rating by department</CardTitle>
            <CardDescription>Organization-wide snapshot (performance module)</CardDescription>
          </CardHeader>
          <CardContent className="h-72 w-full">
            {analyticsQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No department averages available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" domain={[0, 5]} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={88} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(2)} / 5`, "Avg"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.full ? String(payload[0].payload.full) : ""
                    }
                  />
                  <Bar dataKey="avg" fill="rgb(59 130 246)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Total bonus pool</CardTitle>
            <CardDescription>Sum of appraisal bonus previews</CardDescription>
          </CardHeader>
          <CardContent>
            {poolQuery.isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <p className="text-3xl font-bold tabular-nums">
                {poolQuery.data != null
                  ? poolQuery.data.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })
                  : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Top 5 performers</CardTitle>
          <CardDescription>By overall rating (org-wide)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {analyticsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rated reviews yet.</p>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Rating band</th>
                  <th className="pb-2 font-medium tabular-nums">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {top.slice(0, 5).map((row) => (
                  <tr key={`${row.name}-${row.rating}`}>
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 text-muted-foreground">{row.department}</td>
                    <td className="py-2">{formatRatingBandLabel(mapOverallRatingToBand(row.rating))}</td>
                    <td className="py-2 tabular-nums">{row.rating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
