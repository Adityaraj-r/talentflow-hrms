import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, Clock } from "lucide-react";

export const ReferralSmartActionBox = ({
  slaBreachedCount = 0,
  slaAtRiskCount = 0,
  pendingCount = 0,
  totalReferrals = 0,
  onSelectAlertFilter,
  loading = false,
}) => {
  const getActionRecommendation = () => {
    if (slaBreachedCount > 0) {
      return {
        title: "Immediate Review Action Required Today",
        description: `${slaBreachedCount} candidate referral${slaBreachedCount > 1 ? "s have" : " has"} exceeded the 48-hour SLA review window. Click below to inspect overdue candidates.`,
        variant: "rose",
      };
    } else if (slaAtRiskCount > 0) {
      return {
        title: "Approaching SLA Deadlines Today",
        description: `${slaAtRiskCount} referral${slaAtRiskCount > 1 ? "s are" : " is"} approaching the 48-hour SLA deadline within the next 24 hours. Complete initial screening today.`,
        variant: "amber",
      };
    } else {
      return {
        title: "Referral Pipeline is Healthy",
        description: "All employee referrals are reviewed within configured SLA guidelines. No overdue reviews pending for today.",
        variant: "emerald",
      };
    }
  };

  const rec = getActionRecommendation();

  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between h-full">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Zap className="w-4 h-4" />
            </div>
            Smart HR Action Center
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational review guidance & SLA priorities for today
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40 text-[11px] font-bold"
        >
          Today's Tasks
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 animate-pulse rounded-xl" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800/60 animate-pulse rounded-xl" />
          </div>
        ) : (
          <>
            {/* Clickable SLA Alert Counters Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => onSelectAlertFilter?.("SLA_Breached")}
                className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 flex flex-col justify-between cursor-pointer hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/btn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 group-hover/btn:underline">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 transition-transform group-hover/btn:scale-125" />
                    SLA Breached
                  </span>
                  <span className="text-lg font-black text-rose-950 dark:text-rose-100 tabular-nums transition-transform group-hover/btn:scale-110">
                    {slaBreachedCount}
                  </span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center justify-between">
                  &gt;48h Overdue Review <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-1" />
                </span>
              </div>

              <div
                onClick={() => onSelectAlertFilter?.("Pending_48h")}
                className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 flex flex-col justify-between cursor-pointer hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/btn2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 group-hover/btn2:underline">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform group-hover/btn2:scale-125" />
                    SLA At Risk
                  </span>
                  <span className="text-lg font-black text-amber-950 dark:text-amber-100 tabular-nums transition-transform group-hover/btn2:scale-110">
                    {slaAtRiskCount}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center justify-between">
                  24h–48h Deadline <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn2:opacity-100 transition-all group-hover/btn2:translate-x-1" />
                </span>
              </div>
            </div>

            {/* HR Actionable Recommendation Box */}
            <div
              className={`p-3.5 rounded-xl border transition-all duration-300 hover:shadow-xs ${
                rec.variant === "rose"
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30"
                  : rec.variant === "amber"
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30"
              }`}
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {rec.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {rec.description}
              </p>
            </div>

            {/* Daily Operational Focus Checklist */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recommended Actions Today
              </span>
              <div className="space-y-1 text-xs">
                <div
                  onClick={() => onSelectAlertFilter?.("SLA_Breached")}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/item p-1 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 transition-transform group-hover/item:scale-125" />
                  <span className="group-hover/item:underline font-medium">Review {slaBreachedCount} overdue candidate profiles</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1" />
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Verify candidate interview schedules</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralSmartActionBox;
