import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieIcon, Layers, Zap, AlertCircle, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  Applied: "#3b82f6",
  "In Process": "#8b5cf6",
  Selected: "#06b6d4",
  Hired: "#10b981",
  Rejected: "#ef4444",
  Expired: "#64748b",
  Withdrawn: "#f59e0b",
};

const CustomTooltip = ({ active, payload, totalCount }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const pct = totalCount > 0 ? ((data.value / totalCount) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 text-xs min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{data.name}</span>
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span>Count: <strong className="text-slate-900 dark:text-white">{data.value}</strong></span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>
      </div>
    </div>
  );
};

export const ReferralStatusChart = ({
  data = [],
  slaBreachedCount = 0,
  slaAtRiskCount = 0,
  loading = false,
}) => {
  const chartData = data
    .filter((item) => (item.count || 0) > 0)
    .map((item) => ({
      name: item.status,
      value: item.count,
    }));

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.length > 0;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between h-full">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-purple-500" />
          Referral Status Distribution
        </CardTitle>
        {totalCount > 0 && (
          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40 text-[11px] font-bold">
            {totalCount} Total
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-purple-500 animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No status data recorded</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Status breakdown will populate as referrals update.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart with Center Readout */}
            <div className="relative h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    cornerRadius={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip totalCount={totalCount} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {totalCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Referrals
                </span>
              </div>
            </div>

            {/* Smart Alerts Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Smart SLA Alerts
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    SLA Breached
                  </span>
                  <span className="font-extrabold text-rose-950 dark:text-rose-100 tabular-nums">
                    {slaBreachedCount}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    SLA At Risk
                  </span>
                  <span className="font-extrabold text-amber-950 dark:text-amber-100 tabular-nums">
                    {slaAtRiskCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralStatusChart;
