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
  Users,
  Award,
  IndianRupee,
  ClipboardCheck,
} from "lucide-react";

import {
  formatRatingBandLabel,
  mapOverallRatingToBand,
} from "@/constants/appraisalRatingBands";

type DeptRow = {
  department: string;
  avgRating: number;
  count: number;
};

type TopRow = {
  name: string;
  department: string;
  rating: number;
};

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
    queryKey: ["bonusPool", processedCycles.map((c) => c._id).join(",")],
    queryFn: async () => {
      let total = 0;

      for (const cycle of processedCycles) {
        const rows = await fetchBonusPreview(cycle._id);

        rows.forEach((r) => {
          if (!r.skippedReason) {
            total += Number(r.bonusAmount) || 0;
          }
        });
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
          <CardTitle>CEO Performance Overview</CardTitle>
          <CardDescription>
            No processed appraisal cycles are available yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dept = analyticsQuery.data?.departmentAvgRating ?? [];
  const top = analyticsQuery.data?.topPerformers ?? [];

  const chartData = dept.map((d) => ({
    name:
      d.department.length > 15
        ? `${d.department.slice(0, 13)}...`
        : d.department,
    full: d.department,
    avg: d.avgRating,
  }));

  const avgOrgRating =
    dept.length === 0
      ? 0
      : dept.reduce((sum, d) => sum + d.avgRating, 0) / dept.length;

  return (
    <div className="space-y-8">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          CEO Executive Overview
        </h1>

        <p className="text-muted-foreground">
          High-level performance insights, appraisal progress and organizational
          bonus overview.
        </p>
      </div>

      {/* KPI Cards */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Departments
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">
              {dept.length}
            </p>

            <p className="text-sm text-muted-foreground">
              Participating departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-amber-500" />
              Avg Rating
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">
              {avgOrgRating.toFixed(2)}
            </p>

            <p className="text-sm text-muted-foreground">
              Overall organization rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-5 w-5 text-green-600" />
              Bonus Pool
            </CardTitle>
          </CardHeader>

          <CardContent>
            {poolQuery.isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-3xl font-bold">
                {poolQuery.data?.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }) ?? "—"}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Estimated appraisal payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
              Processed Cycles
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">
              {processedCycles.length}
            </p>

            <p className="text-sm text-muted-foreground">
              Completed appraisal cycles
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Department Chart */}

      <Card>
        <CardHeader>
          <CardTitle>Average Rating by Department</CardTitle>

          <CardDescription>
            Organization-wide department performance.
          </CardDescription>
        </CardHeader>

        <CardContent className="h-80">

          {analyticsQuery.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground">
              No department data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 5]}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                />

                <Tooltip
                  formatter={(v: number) => [
                    `${v.toFixed(2)} / 5`,
                    "Average Rating",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.full ?? ""
                  }
                />

                <Bar
                  dataKey="avg"
                  fill="#3b82f6"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

        </CardContent>
      </Card>

      {/* Top Performers */}

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>

          <CardDescription>
            Highest rated employees across the organization.
          </CardDescription>
        </CardHeader>

        <CardContent>

          {analyticsQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : top.length === 0 ? (
            <p className="text-muted-foreground">
              No performance reviews available.
            </p>
          ) : (
            <table className="w-full text-sm">

              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left">Employee</th>
                  <th className="py-3 text-left">Department</th>
                  <th className="py-3 text-left">Rating Band</th>
                  <th className="py-3 text-left">Rating</th>
                </tr>
              </thead>

              <tbody>

                {top.slice(0, 5).map((row) => (

                  <tr
                    key={`${row.name}-${row.rating}`}
                    className="border-b"
                  >
                    <td className="py-3 font-medium">
                      {row.name}
                    </td>

                    <td>{row.department}</td>

                    <td>
                      {formatRatingBandLabel(
                        mapOverallRatingToBand(row.rating)
                      )}
                    </td>

                    <td>
                      {row.rating.toFixed(2)}
                    </td>

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