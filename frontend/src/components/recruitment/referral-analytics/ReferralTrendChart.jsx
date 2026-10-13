import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const ReferralTrendChart = ({ data = [], loading = false, dateRange = "6m" }) => {
  const hasData = Array.isArray(data) && data.length > 0 && data.some((d) => (d.referrals || 0) > 0 || (d.hires || 0) > 0);

  const rangeLabels = {
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "3m": "Last 3 Months",
    "6m": "Last 6 Months",
    "1y": "Last Year",
  };

  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <TrendingUp className="w-4 h-4" />
          </div>
          Referral & Hire Trend
        </CardTitle>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
          <Calendar className="w-3 h-3 text-slate-400" />
          {rangeLabels[dateRange] || "Last 6 Months"}
        </span>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No trend data available</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Referral activity will appear here over time.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#cbd5e1" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={{ stroke: "#cbd5e1" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="referrals"
                name="Referrals Submitted"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReferrals)"
              />
              <Area
                type="monotone"
                dataKey="hires"
                name="Successful Hires"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorHires)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralTrendChart;
