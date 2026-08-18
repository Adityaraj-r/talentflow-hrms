import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export const ReferralAging = ({ slaData = [], loading = false }) => {
  const aging24 = slaData.filter((i) => (i.elapsedHours || 0) <= 24).length;
  const aging48 = slaData.filter((i) => (i.elapsedHours || 0) > 24 && (i.elapsedHours || 0) <= 48).length;
  const aging72 = slaData.filter((i) => (i.elapsedHours || 0) > 48 && (i.elapsedHours || 0) <= 72).length;
  const agingPlus = slaData.filter((i) => (i.elapsedHours || 0) > 72).length;

  const agingItems = [
    { label: "0–24h", count: aging24, color: "bg-emerald-500", status: "On Track", badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
    { label: "24–48h", count: aging48, color: "bg-blue-500", status: "Active", badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" },
    { label: "48–72h", count: aging72, color: "bg-amber-500", status: "At Risk 🟡", badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" },
    { label: "72h+", count: agingPlus, color: "bg-rose-500", status: "Breached 🔴", badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" },
  ];

  const maxVal = Math.max(1, ...agingItems.map((i) => i.count));

  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between h-full">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Clock className="w-4 h-4" />
            </div>
            Referral Aging & SLA Risk
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Turnaround time breakdown for active referral processing
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-around space-y-4">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 bg-slate-100 dark:bg-slate-800/60 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          agingItems.map((item, idx) => {
            const pct = Math.max(6, Math.round((item.count / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group/age">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2 font-mono">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} group-hover/age:scale-125 transition-transform`} />
                    <span className="group-hover/age:text-indigo-600 dark:group-hover/age:text-indigo-400 transition-colors font-sans font-medium">
                      {item.label}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeBg}`}>
                      {item.status}
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold tabular-nums w-6 text-right group-hover/age:scale-110 transition-transform">
                      {item.count}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 group-hover/age:brightness-110 ${item.color}`}
                    style={{ width: `${pct}%` }}
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

export default ReferralAging;
