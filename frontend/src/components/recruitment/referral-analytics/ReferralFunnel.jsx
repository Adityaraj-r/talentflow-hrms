import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Filter } from "lucide-react";

export const ReferralFunnel = ({ stages = [], conversionRates = {}, loading = false }) => {
  const defaultStages = [
    { stage: "Submitted", count: 0, percentage: "100%" },
    { stage: "Invited", count: 0, percentage: "0.0%" },
    { stage: "Applied", count: 0, percentage: "0.0%" },
    { stage: "Screening / Interview", count: 0, percentage: "0.0%" },
    { stage: "Hired", count: 0, percentage: "0.0%" },
  ];

  const displayStages = Array.isArray(stages) && stages.length > 0 ? stages : defaultStages;
  const maxCount = Math.max(1, ...displayStages.map((s) => s.count || 0));

  const colors = [
    "bg-indigo-600 dark:bg-indigo-500",
    "bg-blue-600 dark:bg-blue-500",
    "bg-purple-600 dark:bg-purple-500",
    "bg-cyan-600 dark:bg-cyan-500",
    "bg-teal-600 dark:bg-teal-500",
    "bg-emerald-600 dark:bg-emerald-500",
  ];

  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-900/40 flex items-center justify-center text-cyan-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Filter className="w-4 h-4" />
            </div>
            Referral Conversion Funnel
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage-by-stage candidate progression and conversion efficiency
          </CardDescription>
        </div>
        {conversionRates.referralToHireRate && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-1 rounded-lg">
            Hire Rate: {conversionRates.referralToHireRate}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800/60 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          displayStages.map((stg, idx) => {
            const widthPct = Math.max(10, Math.round(((stg.count || 0) / maxCount) * 100));

            return (
              <div key={idx} className="space-y-1.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group/row">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-5.5 h-5.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-extrabold group-hover/row:bg-indigo-600 group-hover/row:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <span className="group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors font-medium">
                      {stg.stage}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-white font-extrabold tabular-nums group-hover/row:scale-110 transition-transform">
                      {stg.count}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      ({stg.percentage})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 group-hover/row:brightness-110 ${colors[idx % colors.length]}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralFunnel;
