import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Stethoscope,
  Briefcase,
  DollarSign,
  Activity,
  TrendingDown,
  TrendingUp,
  ActivitySquare
} from "lucide-react";

const ExecutiveDashboard = ({ stats, isLoading }) => {
  const metrics = {
    headcount: 847,
    headcountGrowth: "+3.2%",
    activeToday: 712,
    onLeave: 38,
    openReqs: 24,
    payroll: "$4,280,000",
    payrollGrowth: "+1.8%",
    perfScore: "3.7/5.0",
    attrition30: "1.2%",
    attrition90: "3.8%"
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Executive Summary
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          High-level KPIs and critical business intelligence metrics.
        </p>
      </div>

      {/* 8-Card KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Total Headcount */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Total Headcount</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Bottom Row: Number & Trend */}
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.headcount}</p>
              <div className="mt-2 h-5 flex items-center text-xs">
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">
                  <TrendingUp className="h-3 w-3 mr-1" /> {metrics.headcountGrowth}
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-2 truncate">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Today */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Active Today</p>
              <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg shrink-0">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.activeToday}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* On Leave Today */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">On Leave Today</p>
              <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg shrink-0">
                <Stethoscope className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.onLeave}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Open Requisitions */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Open Requisitions</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.openReqs}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payroll Cost */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Monthly Payroll Cost</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.payroll}</p>
              <div className="mt-2 h-5 flex items-center text-xs">
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">
                  <TrendingUp className="h-3 w-3 mr-1" /> {metrics.payrollGrowth}
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-2 truncate">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Performance Score */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Avg Performance Score</p>
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg shrink-0">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.perfScore}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Attrition Rate 30d */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Attrition Rate (30d)</p>
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
                <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.attrition30}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

        {/* Attrition Rate 90d */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardContent className="p-5 xl:p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Attrition Rate (90d)</p>
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
                <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-2xl xl:text-3xl font-bold dark:text-white tracking-tight">{metrics.attrition90}</p>
              <div className="mt-2 h-5"></div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* CEO Briefing Section */}
      <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ActivitySquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">CEO Briefing</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
          Headcount has grown by {metrics.headcountGrowth} this month, currently standing at {metrics.headcount} employees. Payroll costs are tracking at {metrics.payroll}, showing a {metrics.payrollGrowth} variance from last month. With an average performance score of {metrics.perfScore} and an attrition rate holding at {metrics.attrition30} (30d), the workforce remains stable. There are {metrics.openReqs} active job requisitions pipeline filling current vacancies.
        </p>
      </div>

    </div>
  );
};

export default ExecutiveDashboard;