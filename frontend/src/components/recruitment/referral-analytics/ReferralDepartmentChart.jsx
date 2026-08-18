import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const ReferralDepartmentChart = ({ data = [], loading = false }) => {
  const hasData = Array.isArray(data) && data.length > 0 && data.some((d) => (d.referrals || 0) > 0);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Department-wise Referral Analytics
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Referral volume and successful hiring outcomes by department
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No department referral data</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Department breakdown will populate automatically.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <YAxis
                dataKey="department"
                type="category"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="referrals" name="Total Referrals" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="hired" name="Successful Hires" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralDepartmentChart;
