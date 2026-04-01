import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, UserCheck, Stethoscope, Briefcase, DollarSign, Activity,
  TrendingDown, TrendingUp, ActivitySquare, Loader2
} from "lucide-react";

const ExecutiveDashboard = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['executiveAnalytics'],
    queryFn: () => apiClient.get('/executive/analytics/workforce'), 
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-muted-foreground font-medium">Loading live metrics...</p>
      </div>
    );
  }

  const kpis = response?.data?.data?.kpis || response?.data?.kpis || {};

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', currency: 'INR', maximumFractionDigits: 0 
  }).format(val || 0);

  const metrics = {
    headcount: kpis.totalHeadcount || 0,
    headcountGrowth: kpis.headcountGrowth || "0%", 
    activeToday: kpis.activeToday || 0,
    onLeave: kpis.onLeaveToday || 0,
    openReqs: kpis.openRequisitions || 0,
    payroll: formatCurrency(kpis.monthlyPayrollCost),
    payrollGrowth: kpis.payrollGrowth || "0%", 
    perfScore: `${kpis.avgPerformanceScore || 0}/5.0`,
    attrition30: `${kpis.attritionRate30d || 0}%`,
    attrition90: `${kpis.attritionRate90d || 0}%`
  };

  const renderTrend = (trendStr) => {
    const isNegative = trendStr?.startsWith('-');
    const Icon = isNegative ? TrendingDown : TrendingUp;
    const colorClass = isNegative 
      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" 
      : "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10";

    return (
      <span className={`font-medium flex items-center px-1.5 py-0.5 rounded shrink-0 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" /> {trendStr}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Executive Summary
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          High-level KPIs and critical business intelligence metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Headcount Card */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Total Headcount</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.headcount}</p>
              <div className="mt-2 h-5 flex items-center text-xs">
                {renderTrend(metrics.headcountGrowth)}
                <span className="text-slate-500 ml-2">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Today */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Active Today</p>
              <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg shrink-0">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.activeToday}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* On Leave Today */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">On Leave Today</p>
              <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg shrink-0">
                <Stethoscope className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.onLeave}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Open Requisitions */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Open Requisitions</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.openReqs}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Card */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Monthly Payroll Cost</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.payroll}</p>
              <div className="mt-2 h-5 flex items-center text-xs">
                {renderTrend(metrics.payrollGrowth)}
                <span className="text-slate-500 ml-2">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Performance Score */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Avg Performance Score</p>
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg shrink-0">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.perfScore}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Attrition 30d */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Attrition Rate (30d)</p>
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
                <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.attrition30}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Attrition 90d */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500">Attrition Rate (90d)</p>
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
                <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white">{metrics.attrition90}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ActivitySquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">CEO Briefing</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
          Headcount is experiencing {metrics.headcountGrowth} growth this month, currently standing at {metrics.headcount} employees. Payroll costs are tracking at {metrics.payroll}, showing a {metrics.payrollGrowth} variance from last month. With an average performance score of {metrics.perfScore} and an attrition rate holding at {metrics.attrition30} (30d), the workforce remains highly stable. There are {metrics.openReqs} active job requisitions filling vacancies.
        </p>
      </div>

    </div>
  );
};

export default ExecutiveDashboard;