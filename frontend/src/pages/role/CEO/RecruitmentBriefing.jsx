import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { Briefcase, DollarSign, ClipboardList, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const RecruitmentBriefing = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/ceo/recruitment-overview");
      setOverview(res?.data || null);
    } catch {
      setOverview(null);
      toast.error("Could not load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summaryLines = useMemo(() => {
    if (!overview) return [];
    const open = overview?.hiringVelocity?.openRequisitions ?? 0;
    const pendingExec = overview?.bottlenecks?.pendingExecutiveRequisitions ?? 0;
    const util = overview?.financialHealth?.utilizationPct ?? 0;
    const ytd = overview?.hiringVelocity?.ytdRequisitions ?? 0;
    return [
      `${open} open requisition${open === 1 ? "" : "s"}; ${ytd} logged this year.`,
      `Recruitment budget: ${util}% of plan.`,
      pendingExec > 0
        ? `${pendingExec} item${pendingExec === 1 ? "" : "s"} need executive approval.`
        : "No executive approvals pending.",
    ];
  }, [overview]);

  const target = overview?.hiringVelocity?.targetOpenRequisitions ?? 0;
  const openReqs = overview?.hiringVelocity?.openRequisitions ?? 0;
  const hiringPct = target > 0 ? Math.min(100, (openReqs / target) * 100) : 0;
  const budgetPct = Math.min(100, overview?.financialHealth?.utilizationPct ?? 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            CEO Briefing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Recruitment and staffing at a glance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 xl:p-6">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Open requisitions</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl xl:text-3xl font-bold dark:text-white">{openReqs}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 xl:p-6">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget vs plan</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl xl:text-3xl font-bold dark:text-white">{budgetPct}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {overview?.financialHealth?.actual ?? 0} / {overview?.financialHealth?.budgetTarget ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 xl:p-6">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending approvals</p>
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl xl:text-3xl font-bold dark:text-white">
              {overview?.bottlenecks?.pendingExecutiveRequisitions ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 xl:p-6">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">YTD requisitions</p>
              <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <p className="text-2xl xl:text-3xl font-bold dark:text-white">
              {overview?.hiringVelocity?.ytdRequisitions ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Hiring target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {openReqs} / {target} ({overview?.hiringVelocity?.targetYear ?? new Date().getFullYear()})
              </span>
            </div>
            <Progress value={hiringPct} className="h-2" />
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Budget use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{budgetPct}% of recruitment budget</span>
            </div>
            <Progress value={budgetPct} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-900 dark:border-slate-800 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {summaryLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruitmentBriefing;
