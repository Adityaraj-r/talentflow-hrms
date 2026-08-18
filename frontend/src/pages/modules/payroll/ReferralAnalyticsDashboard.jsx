import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  BarChart3,
  Filter,
  Calendar,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Activity,
  UserCheck,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Search,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReferralTimelineModal from "@/components/recruitment/ReferralTimelineModal";

import ReferralStatsCard from "@/components/recruitment/referral-analytics/ReferralStatsCard";
import ReferralTrendChart from "@/components/recruitment/referral-analytics/ReferralTrendChart";
import ReferralSmartActionBox from "@/components/recruitment/referral-analytics/ReferralSmartActionBox";
import ReferralFunnel from "@/components/recruitment/referral-analytics/ReferralFunnel";
import ReferralAging from "@/components/recruitment/referral-analytics/ReferralAging";
import ReferralDepartmentTable from "@/components/recruitment/referral-analytics/ReferralDepartmentTable";
import TopReferrersTable from "@/components/recruitment/referral-analytics/TopReferrersTable";
import RecentReferralActivity from "@/components/recruitment/referral-analytics/RecentReferralActivity";

export default function ReferralAnalyticsDashboard() {
  // Main Data States
  const [funnelData, setFunnelData] = useState(null);
  const [deptAnalyticsData, setDeptAnalyticsData] = useState([]);
  const [slaData, setSlaData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  // Performance Report State
  const [perfData, setPerfData] = useState([]);
  const [perfPagination, setPerfPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [perfSearch, setPerfSearch] = useState("");
  const [perfDept, setPerfDept] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("6m");
  const [loadingPerf, setLoadingPerf] = useState(true);

  // Selected Employee Detail Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeDetailData, setEmployeeDetailData] = useState(null);
  const [loadingEmpDetail, setLoadingEmpDetail] = useState(false);
  const [empDetailModalOpen, setEmpDetailModalOpen] = useState(false);

  // Timeline Modal State
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState(null);

  // DOM Ref for auto-scrolling
  const recentActivityRef = useRef(null);

  // Fetch Funnel, Status Distribution & SLA Data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(false);

      const [funnelRes, deptRes, slaRes] = await Promise.all([
        apiClient.get("/referrals/reports/funnel", { params: { department: perfDept } }),
        apiClient.get("/referrals/reports/job-department"),
        apiClient.get("/referrals/reports/sla-tracking"),
      ]);

      if (funnelRes?.data) {
        setFunnelData(funnelRes.data);
      }
      if (deptRes?.data?.byDepartment) {
        setDeptAnalyticsData(deptRes.data.byDepartment);
      }
      if (slaRes?.data?.items) {
        setSlaData(slaRes.data.items);
      }
    } catch (err) {
      console.error(err);
      setAnalyticsError(true);
      toast.error("Failed to load referral analytics dashboard");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [perfDept]);

  // Fetch Employee Performance Report
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
      console.error(err);
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
      console.error(err);
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
    if (!employeeId) return;
    setSelectedEmployeeId(employeeId);
    setEmpDetailModalOpen(true);
    fetchEmployeeDetail(employeeId, 1);
  };

  const handlePerfSearchSubmit = (e) => {
    e.preventDefault();
    fetchPerformanceReport(1);
  };

  const handleRefreshAll = () => {
    fetchAnalytics();
    fetchPerformanceReport(1);
  };

  // Option 1: Direct Filter & Auto-Scroll Handler
  const handleSelectAlertFilter = (filterKey) => {
    setStatusFilter(filterKey);
    recentActivityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const counts = funnelData?.counts || {};
  const conversionRates = funnelData?.conversionRates || {};
  const funnelStages = funnelData?.funnelStages || [];
  const monthlyTrend = funnelData?.monthlyTrend || [];

  // Derived SLA Metrics
  const slaBreachedCount = slaData.filter((i) => i.slaStatus === "SLA_Breached" || (i.elapsedHours || 0) > 48).length;
  const slaAtRiskCount = slaData.filter((i) => i.slaStatus === "Pending_48h" || ((i.elapsedHours || 0) > 24 && (i.elapsedHours || 0) <= 48)).length;
  const attentionRequiredCount = slaBreachedCount + slaAtRiskCount;

  // Derived KPI values
  const totalReferrals = counts.totalReferrals || 0;
  const activeReferrals = (counts.applied || 0) + (counts.inProcess || 0) + (counts.selected || 0);
  const pendingInvitations = Math.max(0, totalReferrals - (counts.applied || 0) - (counts.hired || 0) - (counts.rejected || 0));
  const successfulHires = counts.hired || 0;
  const hireRate = conversionRates.referralToHireRate || (totalReferrals > 0 ? `${((successfulHires / totalReferrals) * 100).toFixed(1)}%` : "0.0%");

  // Filtered SLA items for recent activity table
  const filteredSlaItems = statusFilter === "all"
    ? slaData
    : slaData.filter((i) =>
        (i.slaStatus || "").toLowerCase().includes(statusFilter.toLowerCase()) ||
        (i.status || "").toLowerCase().includes(statusFilter.toLowerCase())
      );

  return (
    <div className="space-y-6 max-w-full pb-12">
      {/* ─────────────────────────────────────────────────────────────
          HEADER BAR & GLOBAL FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Employee Referral Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track referral pipeline performance, SLA turnaround time, and hiring outcomes.
          </p>
        </div>

        {/* Global Compact Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 7 Days</option>
              <option value="30d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 30 Days</option>
              <option value="3m" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 3 Months</option>
              <option value="6m" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 6 Months</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              value={perfDept}
              onChange={(e) => setPerfDept(e.target.value)}
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Departments</option>
              <option value="Engineering" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Engineering</option>
              <option value="Product" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Product</option>
              <option value="Sales" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Sales</option>
              <option value="Marketing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Marketing</option>
              <option value="HR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">HR</option>
              <option value="Finance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Finance</option>
              <option value="Operations" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operations</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
              <option value="SLA_Breached" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">SLA Breached</option>
              <option value="Pending_48h" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">SLA At Risk</option>
              <option value="applied" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Applied</option>
              <option value="in process" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">In Interview</option>
              <option value="successful" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Hired</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8.5 text-xs cursor-pointer rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            onClick={handleRefreshAll}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ERROR STATE BANNER */}
      {analyticsError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">Unable to load referral analytics</p>
              <p className="text-xs text-rose-700 dark:text-rose-400">Please check your network connection and try again.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-rose-300 dark:border-rose-800 text-xs" onClick={handleRefreshAll}>
            Retry
          </Button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ROW 1: 6 ENTERPRISE KPI CARDS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ReferralStatsCard
          title="Total Referrals"
          value={totalReferrals}
          subtitle="submitted invites"
          icon={Users}
          variant="blue"
          loading={loadingAnalytics}
        />
        <ReferralStatsCard
          title="Active Referrals"
          value={activeReferrals}
          subtitle="in recruitment pipeline"
          icon={Activity}
          variant="amber"
          loading={loadingAnalytics}
        />
        <ReferralStatsCard
          title="Pending Invites"
          value={pendingInvitations}
          subtitle="awaiting application"
          icon={Clock}
          variant="purple"
          loading={loadingAnalytics}
        />
        <ReferralStatsCard
          title="Attention Required"
          value={attentionRequiredCount}
          subtitle={`${slaBreachedCount} breached · ${slaAtRiskCount} at risk`}
          icon={AlertTriangle}
          variant="rose"
          loading={loadingAnalytics}
          onClick={() => handleSelectAlertFilter("SLA_Breached")}
        />
        <ReferralStatsCard
          title="Hired"
          value={successfulHires}
          subtitle="successful hires"
          icon={CheckCircle2}
          variant="emerald"
          loading={loadingAnalytics}
        />
        <ReferralStatsCard
          title="Hire Rate"
          value={hireRate}
          subtitle="hire conversion rate"
          icon={TrendingUp}
          variant="indigo"
          loading={loadingAnalytics}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: REFERRAL PIPELINE TREND & SMART HR ACTION CENTER
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ReferralTrendChart data={monthlyTrend} loading={loadingAnalytics} dateRange={dateRange} />
        </div>
        <div className="xl:col-span-1">
          <ReferralSmartActionBox
            slaBreachedCount={slaBreachedCount}
            slaAtRiskCount={slaAtRiskCount}
            pendingCount={pendingInvitations}
            totalReferrals={totalReferrals}
            onSelectAlertFilter={handleSelectAlertFilter}
            loading={loadingAnalytics}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: REFERRAL CONVERSION FUNNEL & REFERRAL AGING (SLA RISK)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-1">
          <ReferralFunnel stages={funnelStages} conversionRates={conversionRates} loading={loadingAnalytics} />
        </div>
        <div className="xl:col-span-1">
          <ReferralAging slaData={slaData} loading={loadingAnalytics} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: DEPARTMENT REFERRAL PERFORMANCE
         ───────────────────────────────────────────────────────────── */}
      <ReferralDepartmentTable data={deptAnalyticsData} loading={loadingAnalytics} />

      {/* ─────────────────────────────────────────────────────────────
          ROW 5: TOP REFERRERS
         ───────────────────────────────────────────────────────────── */}
      <TopReferrersTable
        data={perfData}
        pagination={perfPagination}
        search={perfSearch}
        onSearchChange={setPerfSearch}
        onSearchSubmit={handlePerfSearchSubmit}
        onPageChange={(page) => fetchPerformanceReport(page)}
        onEmployeeClick={handleEmployeeClick}
        loading={loadingPerf}
      />

      {/* ─────────────────────────────────────────────────────────────
          ROW 6: RECENT REFERRAL ACTIVITY
         ───────────────────────────────────────────────────────────── */}
      <div ref={recentActivityRef}>
        <RecentReferralActivity
          activities={filteredSlaItems}
          onViewTimeline={(refId) => setSelectedReferralForTimeline(refId)}
          loading={loadingAnalytics}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EMPLOYEE REFERRAL DETAIL MODAL (DRILL-DOWN VIEW)
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={empDetailModalOpen} onOpenChange={setEmpDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {employeeDetailData?.employeeInfo?.employeeName || "Employee"} Referral History
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {employeeDetailData?.employeeInfo?.department} · Code: {employeeDetailData?.employeeInfo?.employeeCode}
            </DialogDescription>
          </DialogHeader>

          {loadingEmpDetail ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-2" />
              Fetching employee referral breakdown...
            </div>
          ) : employeeDetailData ? (
            <div className="space-y-6 pt-2">
              {/* Employee KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Referrals</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">{employeeDetailData.kpis.totalReferrals}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/40">
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-semibold">Applied</p>
                  <p className="text-lg font-extrabold text-blue-950 dark:text-blue-100 tabular-nums">{employeeDetailData.kpis.applied}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/40">
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold">Interview</p>
                  <p className="text-lg font-extrabold text-purple-950 dark:text-purple-100 tabular-nums">{employeeDetailData.kpis.inProcess}</p>
                </div>
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-900/40">
                  <p className="text-[10px] text-cyan-700 dark:text-cyan-300 uppercase font-semibold">Selected</p>
                  <p className="text-lg font-extrabold text-cyan-950 dark:text-cyan-100 tabular-nums">{employeeDetailData.kpis.selected}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Hired</p>
                  <p className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100 tabular-nums">{employeeDetailData.kpis.hired}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40">
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-semibold">Rejected</p>
                  <p className="text-lg font-extrabold text-rose-950 dark:text-rose-100 tabular-nums">{employeeDetailData.kpis.rejected}</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/40">
                  <p className="text-[10px] text-teal-700 dark:text-teal-300 uppercase font-semibold">Probation</p>
                  <p className="text-lg font-extrabold text-teal-950 dark:text-teal-100 tabular-nums">{employeeDetailData.kpis.probationPassed}</p>
                </div>
              </div>

              {/* Candidate Referral List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Referred Candidates ({employeeDetailData.referrals?.length || 0})
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Job Opening</th>
                        <th className="p-3">Submitted Date</th>
                        <th className="p-3">Referral Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {employeeDetailData.referrals?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
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
