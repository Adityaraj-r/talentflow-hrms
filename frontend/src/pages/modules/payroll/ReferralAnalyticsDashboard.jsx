import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  TrendingUp,
  Users,
  Briefcase,
  Building,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Calendar,
  Percent,
  BarChart3,
  PieChart,
  UserCheck,
  X,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReferralTimelineModal from "@/components/recruitment/ReferralTimelineModal";

export default function ReferralAnalyticsDashboard() {
  // Main Data States
  const [funnelData, setFunnelData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Performance Report State
  const [perfData, setPerfData] = useState([]);
  const [perfPagination, setPerfPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [perfSearch, setPerfSearch] = useState("");
  const [perfDept, setPerfDept] = useState("all");
  const [dateRange, setDateRange] = useState("6m");
  const [loadingPerf, setLoadingPerf] = useState(true);

  // Selected Employee Detail Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeDetailData, setEmployeeDetailData] = useState(null);
  const [loadingEmpDetail, setLoadingEmpDetail] = useState(false);
  const [empDetailModalOpen, setEmpDetailModalOpen] = useState(false);
  const [empDetailPage, setEmpDetailPage] = useState(1);

  // Timeline Modal State
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState(null);

  // Fetch Funnel, Status Distribution & 6-Month Trend
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const res = await apiClient.get("/referrals/reports/funnel", {
        params: { department: perfDept },
      });
      if (res?.data) {
        setFunnelData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load referral analytics dashboard");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [perfDept]);

  // Fetch Employee Operational Performance Report
  const fetchPerformanceReport = useCallback(async (page = 1) => {
    try {
      setLoadingPerf(true);
      const res = await apiClient.get("/referrals/reports/employee-performance", {
        params: {
          page,
          limit: 10,
          search: perfSearch,
          department: perfDept,
        },
      });
      if (res?.data) {
        setPerfData(res.data);
        if (res.pagination) setPerfPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Failed to load HR referral performance report");
    } finally {
      setLoadingPerf(false);
    }
  }, [perfSearch, perfDept]);

  // Fetch Single Employee Referral Detail
  const fetchEmployeeDetail = useCallback(async (employeeId, page = 1) => {
    try {
      setLoadingEmpDetail(true);
      const res = await apiClient.get(`/referrals/reports/employee-detail/${employeeId}`, {
        params: { page, limit: 10 },
      });
      if (res?.data) {
        setEmployeeDetailData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load employee referral detail");
    } finally {
      setLoadingEmpDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchPerformanceReport(1);
  }, [fetchAnalytics, fetchPerformanceReport]);

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setEmpDetailPage(1);
    setEmpDetailModalOpen(true);
    fetchEmployeeDetail(employeeId, 1);
  };

  const handlePerfSearchSubmit = (e) => {
    e.preventDefault();
    fetchPerformanceReport(1);
  };

  const counts = funnelData?.counts || {};
  const conversionRates = funnelData?.conversionRates || {};
  const funnelStages = funnelData?.funnelStages || [];
  const statusDist = funnelData?.statusDistribution || [];
  const monthlyTrend = funnelData?.monthlyTrend || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-600" /> Referral Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            HR operational overview of referral conversion funnel, status composition, and employee referral records.
          </p>
        </div>

        {/* Global Minimal Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-lg border">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              value={perfDept}
              onChange={(e) => setPerfDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-lg border">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="6m">Last 6 Months</option>
              <option value="3m">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => { fetchAnalytics(); fetchPerformanceReport(1); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI CARDS (Real Database Numbers)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border bg-slate-50/80 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Referrals</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-cyan-600" /> : counts.totalReferrals || 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Submitted invites</p>
          </CardContent>
        </Card>

        <Card className="border bg-blue-50/60 dark:bg-blue-950/30 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Applications</p>
            <p className="text-2xl font-extrabold text-blue-950 dark:text-blue-100 mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : counts.applied || 0}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">{conversionRates.referralToAppRate || "0.0%"} app rate</p>
          </CardContent>
        </Card>

        <Card className="border bg-purple-50/60 dark:bg-purple-950/30 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Interviews</p>
            <p className="text-2xl font-extrabold text-purple-950 dark:text-purple-100 mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-purple-600" /> : (counts.inProcess || 0) + (counts.selected || 0) + (counts.hired || 0)}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Evaluated candidates</p>
          </CardContent>
        </Card>

        <Card className="border bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Hired</p>
            <p className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : counts.hired || 0}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{conversionRates.referralToHireRate || "0.0%"} hire rate</p>
          </CardContent>
        </Card>

        <Card className="border bg-rose-50/60 dark:bg-rose-950/30 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Rejected</p>
            <p className="text-2xl font-extrabold text-rose-950 dark:text-rose-100 mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-rose-600" /> : counts.rejected || 0}
            </p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Unsuccessful matches</p>
          </CardContent>
        </Card>

        <Card className="border bg-cyan-50/60 dark:bg-cyan-950/30 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Probation Passed</p>
            <p className="text-2xl font-extrabold text-cyan-950 dark:text-cyan-100 mt-1">
              {loadingAnalytics ? <Loader2 className="h-5 w-5 animate-spin text-cyan-600" /> : counts.probationPassed || 0}
            </p>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5">Confirmed hires</p>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: COMPULSORY CHARTS (Funnel, Distribution, Trend)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COMPULSORY CHART #1: REFERRAL FUNNEL */}
        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-cyan-600" /> 1. Referral Funnel</span>
              <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">Hire Rate: {conversionRates.referralToHireRate || "0.0%"}</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Candidate progression from referral to probation completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {loadingAnalytics ? (
              <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-cyan-600" /></div>
            ) : funnelStages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No funnel data available.</p>
            ) : (
              funnelStages.map((stg, idx) => {
                const maxVal = Math.max(1, counts.totalReferrals || 1);
                const barWidth = Math.max(8, Math.round((stg.count / maxVal) * 100));

                const colorMap = [
                  "bg-slate-700 dark:bg-slate-300",
                  "bg-blue-600",
                  "bg-purple-600",
                  "bg-cyan-600",
                  "bg-emerald-600",
                  "bg-teal-500",
                ];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{stg.stage}</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {stg.count} <span className="text-[10px] text-slate-500 font-normal">({stg.percentage})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorMap[idx % colorMap.length]}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* COMPULSORY CHART #2: REFERRAL STATUS DISTRIBUTION */}
        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-purple-600" /> 2. Status Distribution
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Current referral pipeline composition across active states.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loadingAnalytics ? (
              <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-600" /></div>
            ) : statusDist.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No status data recorded.</p>
            ) : (
              statusDist.map((item, idx) => {
                const total = Math.max(1, counts.totalReferrals || 1);
                const pct = ((item.count / total) * 100).toFixed(1);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.status}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.count} <span className="text-[10px] text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, Math.round((item.count / total) * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* COMPULSORY CHART #3: MONTHLY REFERRAL TREND */}
        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-emerald-600" /> 3. Monthly Referral Trend</span>
              <span className="text-[10px] text-slate-500 font-medium">Last 6 Months</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Referral submission volume vs successful hires over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loadingAnalytics ? (
              <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" /></div>
            ) : monthlyTrend.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No historical data available.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-4 text-[11px] font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 inline-block" /> Referrals
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Hires
                  </span>
                </div>

                <div className="space-y-2.5">
                  {monthlyTrend.map((m, idx) => {
                    const maxVal = Math.max(1, ...monthlyTrend.map((t) => t.referrals));
                    const refPct = Math.max(6, Math.round((m.referrals / maxVal) * 100));
                    const hirePct = Math.max(4, Math.round((m.hires / maxVal) * 100));

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{m.month}</span>
                          <span className="text-[11px] text-slate-500">
                            <span className="font-bold text-cyan-700 dark:text-cyan-300">{m.referrals} refs</span> · <span className="font-bold text-emerald-600">{m.hires} hires</span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${refPct}%` }} />
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${hirePct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: EMPLOYEE PERFORMANCE TABLE (NO GAMIFICATION / LEADERBOARD)
         ───────────────────────────────────────────────────────────── */}
      <Card className="bg-white dark:bg-slate-900 border shadow-sm">
        <CardHeader className="p-5 border-b bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" /> Employee Referral Performance Report
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Operational breakdown of employee referral contributions. Click any employee row to view full referral history.
            </CardDescription>
          </div>

          {/* Search Filter */}
          <form onSubmit={handlePerfSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search employee by name or ID..."
                className="pl-8 h-9 text-xs"
                value={perfSearch}
                onChange={(e) => setPerfSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9 text-xs cursor-pointer">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-center">Referrals</th>
                  <th className="p-4 text-center">Applied</th>
                  <th className="p-4 text-center">Interview</th>
                  <th className="p-4 text-center">Hired</th>
                  <th className="p-4 text-center">Rejected</th>
                  <th className="p-4 text-center">Referral Quality</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingPerf ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-600" />
                      Loading employee referral records...
                    </td>
                  </tr>
                ) : perfData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No referral activity found matching search filters.
                    </td>
                  </tr>
                ) : (
                  perfData.map((row) => (
                    <tr
                      key={row.employeeId}
                      className="hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 cursor-pointer transition-colors"
                      onClick={() => handleEmployeeClick(row.employeeId)}
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{row.employeeName}</div>
                        <div className="text-[11px] text-slate-500">{row.employeeCode}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{row.department}</td>
                      <td className="p-4 text-center font-extrabold text-slate-900 dark:text-slate-100">{row.totalReferrals}</td>
                      <td className="p-4 text-center font-bold text-blue-600 dark:text-blue-400">{row.applied}</td>
                      <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400">{row.inProcess}</td>
                      <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.hired}</td>
                      <td className="p-4 text-center text-rose-600 font-medium">{row.rejected}</td>
                      <td className="p-4 text-center">
                        {row.qualityScore?.status === "Not_Available" ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                            Not Available
                          </Badge>
                        ) : row.qualityScore?.status === "Limited_Data" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Limited Data
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`font-bold ${
                              row.qualityScore?.rating === "Strong"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : row.qualityScore?.rating === "Good"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {row.qualityScore?.scoreText} ({row.qualityScore?.rating})
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-600 hover:text-cyan-700">
                          View Details <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {perfPagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center text-xs text-slate-500">
              <span>
                Page {perfPagination.currentPage} of {perfPagination.totalPages} ({perfPagination.totalRecords} employees)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={perfPagination.currentPage <= 1}
                  onClick={() => fetchPerformanceReport(perfPagination.currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={perfPagination.currentPage >= perfPagination.totalPages}
                  onClick={() => fetchPerformanceReport(perfPagination.currentPage + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          EMPLOYEE REFERRAL DETAIL MODAL (DRILL-DOWN VIEW)
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={empDetailModalOpen} onOpenChange={setEmpDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-cyan-600" />
                  {employeeDetailData?.employeeInfo?.employeeName || "Employee"} Referral History
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {employeeDetailData?.employeeInfo?.department} · Code: {employeeDetailData?.employeeInfo?.employeeCode}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingEmpDetail ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-600 mb-2" />
              Fetching employee referral breakdown...
            </div>
          ) : employeeDetailData ? (
            <div className="space-y-6 pt-2">
              {/* Employee KPI Cards & Referral Quality Score */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Referrals</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{employeeDetailData.kpis.totalReferrals}</p>
                </div>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200">
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-semibold">Applied</p>
                  <p className="text-lg font-bold text-blue-950 dark:text-blue-100">{employeeDetailData.kpis.applied}</p>
                </div>
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200">
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold">Interview</p>
                  <p className="text-lg font-bold text-purple-950 dark:text-purple-100">{employeeDetailData.kpis.inProcess}</p>
                </div>
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg border border-cyan-200">
                  <p className="text-[10px] text-cyan-700 dark:text-cyan-300 uppercase font-semibold">Selected</p>
                  <p className="text-lg font-bold text-cyan-950 dark:text-cyan-100">{employeeDetailData.kpis.selected}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Hired</p>
                  <p className="text-lg font-bold text-emerald-950 dark:text-emerald-100">{employeeDetailData.kpis.hired}</p>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200">
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-semibold">Rejected</p>
                  <p className="text-lg font-bold text-rose-950 dark:text-rose-100">{employeeDetailData.kpis.rejected}</p>
                </div>
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200">
                  <p className="text-[10px] text-teal-700 dark:text-teal-300 uppercase font-semibold">Probation</p>
                  <p className="text-lg font-bold text-teal-950 dark:text-teal-100">{employeeDetailData.kpis.probationPassed}</p>
                </div>
              </div>

              {/* Quality Score Banner */}
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-slate-800 dark:to-slate-850 rounded-xl border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-purple-600" /> Referral Quality Score
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {employeeDetailData.qualityScore?.reason || "Operational output assessment"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-3 py-1 ${
                    employeeDetailData.qualityScore?.rating === "Strong"
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : employeeDetailData.qualityScore?.rating === "Good"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {employeeDetailData.qualityScore?.scoreText} ({employeeDetailData.qualityScore?.rating})
                </Badge>
              </div>

              {/* Candidate Referral List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Referred Candidates ({employeeDetailData.referrals?.length || 0})
                </h4>

                <div className="border rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b">
                      <tr>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Job Opening</th>
                        <th className="p-3">Submitted Date</th>
                        <th className="p-3">Referral Status</th>
                        <th className="p-3">Reward Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {employeeDetailData.referrals?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            This employee has not submitted any referrals yet.
                          </td>
                        </tr>
                      ) : (
                        employeeDetailData.referrals.map((ref) => (
                          <tr key={ref._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                            <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                              {ref.candidateName}
                              <div className="text-[11px] text-slate-500 font-normal">{ref.candidateEmail}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">{ref.jobId?.jobTitle || "Job Position"}</div>
                              <div className="text-[11px] text-slate-500">{ref.jobId?.department}</div>
                            </td>
                            <td className="p-3 text-slate-500">{new Date(ref.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${
                                  ref.status === "Successful"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                    : ref.status === "Applied"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                                    : ref.status === "In Process"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : ref.status === "Rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {ref.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-600">
                              {ref.rewardId?.rewardStatus ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                                  {ref.rewardId.rewardStatus} ({ref.rewardId.currency || "INR"} {ref.rewardId.bonusAmount})
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-[11px]">N/A</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs cursor-pointer"
                                onClick={() => setSelectedReferralForTimeline(ref._id)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View Timeline
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Referral Timeline Modal */}
      {selectedReferralForTimeline && (
        <ReferralTimelineModal
          referralId={selectedReferralForTimeline}
          open={!!selectedReferralForTimeline}
          onClose={() => setSelectedReferralForTimeline(null)}
        />
      )}
    </div>
  );
}
