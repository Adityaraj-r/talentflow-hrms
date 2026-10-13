import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import CEOAppraisalDashboardSection from "@/pages/pms/CEOAppraisalDashboard";
import {
  Users, UserCheck, Stethoscope, Briefcase, DollarSign, Activity,
  TrendingDown, TrendingUp, ActivitySquare, Loader2, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['executiveAnalytics'],
    queryFn: () => apiClient.get('/executive/analytics/workforce'), 
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 dark:bg-[#0f172a] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-slate-500 font-medium">Loading executive intelligence...</p>
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
      ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10" 
      : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";

    return (
      <span className={`font-medium flex items-center px-1.5 py-0.5 rounded text-xs shrink-0 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" /> {trendStr}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
          {getGreeting()}, {user?.firstName || "Executive"}
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Here is your executive summary of workforce and financial metrics.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* TOP QUICK METRICS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/all-employees')}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Headcount</span>
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white block">{metrics.headcount}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">+4 joined this month</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/attendance')}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Today</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white block">{metrics.activeToday}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">96% active workforce</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/attendance/leave-management')}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">On Leave</span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white block">{metrics.onLeave}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">5 submitted today</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/recruitment/pipeline')}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Open Reqs</span>
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white block">{metrics.openReqs}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">42 candidates in pipeline</span>
                </div>
            </div>
          </div>

          {/* SECONDARY METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
            {/* Payroll Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md lg:col-span-2" onClick={() => navigate('/payroll')}>
                <div className="flex items-start justify-between gap-2 mb-6">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Monthly Payroll Cost</p>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg shrink-0">
                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.payroll}</p>
                    <div className="mt-3 flex items-center text-xs">
                        {renderTrend(metrics.payrollGrowth)}
                        <span className="text-slate-500 ml-2">vs last month</span>
                    </div>
                </div>
            </div>

            {/* Avg Performance Score */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md" onClick={() => navigate('/pms/appraisal-cycles')}>
                <div className="flex items-start justify-between gap-2 mb-6">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Avg Performance</p>
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg shrink-0">
                        <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.perfScore}</p>
                    <p className="text-xs text-slate-500 mt-2">Company average</p>
                </div>
            </div>

            {/* Attrition Combined */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md" onClick={() => navigate('/all-employees')}>
                <div className="flex items-start justify-between gap-2 mb-6">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Attrition Rate</p>
                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg shrink-0">
                        <TrendingDown className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                    </div>
                </div>
                <div className="mt-auto flex justify-between items-end">
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.attrition30}</p>
                        <p className="text-xs text-slate-500 mt-2">30 days</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{metrics.attrition90}</p>
                        <p className="text-xs text-slate-500 mt-2">90 days</p>
                    </div>
                </div>
            </div>

          </div>
          
          <CEOAppraisalDashboardSection />
        </div>

        {/* SIDEBAR - BRIEFING */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Executive Briefing</h3>
            
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <ActivitySquare className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-[15px] text-slate-900 dark:text-white">Monthly Summary</h4>
                </div>
                <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                    <p>
                        Headcount is experiencing <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.headcountGrowth}</span> growth this month, currently standing at <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.headcount}</span> employees. 
                    </p>
                    <p>
                        Payroll costs are tracking at <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.payroll}</span>, showing a {metrics.payrollGrowth} variance from last month.
                    </p>
                    <p>
                        With an average performance score of <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.perfScore}</span> and an attrition rate holding at <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.attrition30}</span> (30d), the workforce remains stable. 
                    </p>
                    <p>
                        There are <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.openReqs}</span> active job requisitions currently open to fill vacancies.
                    </p>
                </div>
            </div>
            
            <div className="mt-6">
                <div 
                onClick={() => navigate('/reports')}
                className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-5 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex items-center gap-4"
                >
                    <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-purple-700 dark:text-purple-400 shadow-sm shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Financial Reports</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            View full P&L and HR costs.
                        </p>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
