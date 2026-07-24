import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, RefreshCw, Send, CheckCircle2, XCircle, BadgeCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import offerOperationsService from "@/services/offerOperationsService";
import { useUser } from "@/contexts/UserContext";
import { enrichOffer, formatMoney } from "@/components/recruitment/OfferWorkflow";
import { cn } from "@/lib/utils";
import {
  CandidateComparisonPanel,
  CompensationBreakdownCard,
  ExportCenter,
  HiringActivityFeed,
  NegotiationTimeline,
  NotificationCenter,
  OfferAnalyticsDashboard,
  OfferApprovalTimeline,
  OfferAutomationRules,
  OfferGenerator,
  OfferInsightsPanel,
  OfferLifecycleTracker,
  OfferLetterPreview,
  OfferOperationsKpiCard,
  PreOnboardingWorkflow,
  TemplatesPanel,
} from "@/components/recruitment/OfferOperationsPlatform";

const payload = (res) => res?.data || res || {};

const OfferOperations = () => {
  const { user } = useUser();
  const role = (typeof user?.role === "string" ? user.role : user?.role?.name || "").toUpperCase().replace(/\s+/g, "_");
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER";
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator;
  const canApproveOffers = user?.can?.("recruitment", "write") && role === "HR_MANAGER";
  const location = useLocation();
  const section = location.pathname.split("/").pop();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [previewOffer, setPreviewOffer] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await offerOperationsService.getDashboard();
      setData(payload(res));
    } catch (error) {
      const message = error?.message || "Failed to load offer operations";
      setError(message);
      toast.error(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const offers = useMemo(() => (data?.offers || []).map(enrichOffer), [data]);
  const selectedOffer = useMemo(() => offers.find((offer) => offer._id === selectedOfferId) || offers[0], [offers, selectedOfferId]);

  const handleCreate = async (form) => {
    if (!canWrite) {
      toast.error("You do not have permission to generate offers");
      return;
    }
    try {
      await offerOperationsService.createOffer({
        ...form,
        salary: Number(form.salary),
        noticeBuyout: Number(form.noticeBuyout || 0),
        bonus: Number(form.bonus || 0),
      });
      toast.success("Offer draft created and routed");
      await loadDashboard();
    } catch (error) {
      toast.error(error?.error || error?.message || "Offer creation failed");
    }
  };

  const handleAction = async (action, offer) => {
    if (!offer?._id) return;
    if (!canApproveOffers) {
      toast.error("Only HR Manager can perform offer approval and release actions");
      return;
    }
    try {
      if (action === "approve") await offerOperationsService.approveOffer(offer._id, { comments: "Approved from operations dashboard" });
      if (action === "reject") await offerOperationsService.rejectOffer(offer._id, { comments: "Rejected from operations dashboard" });
      if (action === "changes") await offerOperationsService.rejectOffer(offer._id, { requestChanges: true, comments: "Changes requested by approver" });
      if (action === "negotiate") await offerOperationsService.negotiateOffer(offer._id, { requestedSalary: Math.round(Number(offer.salary || 0) * 1.08), revisedOffer: Math.round(Number(offer.salary || 0) * 1.04), notes: "Negotiation round added from operations dashboard" });
      if (action === "send" || action === "escalate") await offerOperationsService.sendOffer(offer._id, { comments: action === "escalate" ? "Escalated and resent" : "Sent from operations dashboard" });
      toast.success("Offer workflow action completed");
      await loadDashboard();
    } catch (error) {
      toast.error(error?.error || error?.message || "Offer action failed");
    }
  };

  const exportRows = useMemo(() => offers.map((offer) => ({
    offerId: offer.offerId,
    candidate: offer.candidateName,
    position: offer.position,
    department: offer.department,
    salary: offer.salary,
    status: offer.status,
    joiningDate: offer.joiningDate,
  })), [offers]);

  const handleExport = (type) => {
    if (type === "excel") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exportRows), "Offer Operations");
      XLSX.writeFile(workbook, "offer-operations.xlsx");
      return;
    }
    const doc = new jsPDF("landscape");
    doc.text("Offer Operations Report", 14, 16);
    autoTable(doc, { startY: 24, head: [["Offer", "Candidate", "Position", "Department", "Salary", "Status"]], body: exportRows.map((row) => [row.offerId, row.candidate, row.position, row.department, row.salary, row.status]) });
    doc.save(type === "reports" ? "offer-reports.pdf" : "offer-operations.pdf");
  };

  const showAnalyticsOnly = section === "analytics";
  const showApprovalsOnly = section === "approvals";
  const showTemplatesOnly = section === "templates";

  const pendingHr = useMemo(() => offers.filter(o => o.status === "Pending HR Manager Approval" || o.status === "Under Review").length, [offers]);
  const pendingMgr = useMemo(() => offers.filter(o => o.status === "Manager Approval" || o.status === "Pending Manager Approval").length, [offers]);
  const expiringSoon = useMemo(() => offers.filter(o => {
    if (o.status !== "Offered") return false;
    const days = (new Date(o.expiryDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 3;
  }).length, [offers]);
  const responsePending = useMemo(() => offers.filter(o => o.status === "Offered").length, [offers]);

  const highestOffer = useMemo(() => offers.length ? Math.max(...offers.map(o => Number(o.salary) || 0)) : 0, [offers]);
  const lowestOffer = useMemo(() => offers.length ? Math.min(...offers.map(o => Number(o.salary) || 0)) : 0, [offers]);
  const avgOfferValue = useMemo(() => offers.length ? Math.round(offers.reduce((sum, o) => sum + (Number(o.salary) || 0), 0) / offers.length) : 0, [offers]);
  const avgResponseTime = useMemo(() => offers.length ? Math.round(offers.reduce((sum, o) => sum + (o.responseTimeDays || 0), 0) / offers.length) : 0, [offers]);
  const offersThisMonth = useMemo(() => offers.filter(o => {
    const date = o.createdAt ? new Date(o.createdAt) : null;
    if (!date) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length, [offers]);

  const recentActivities = useMemo(() => {
    const list = [];
    offers.forEach(offer => {
      if (Array.isArray(offer.activityHistory)) {
        offer.activityHistory.forEach(act => {
          list.push({
            candidateName: offer.candidateName || "N/A",
            offerId: offer.offerId || "N/A",
            action: act.message || "Activity recorded",
            at: act.at || offer.updatedAt || offer.createdAt,
            actor: act.actor || "Hiring Operations",
          });
        });
      }
      if (Array.isArray(offer.approvalHistory)) {
        offer.approvalHistory.forEach(app => {
          list.push({
            candidateName: offer.candidateName || "N/A",
            offerId: offer.offerId || "N/A",
            action: `${app.role} ${app.action}: ${app.comments || ""}`,
            at: app.at || offer.updatedAt || offer.createdAt,
            actor: app.role || "HR Manager",
          });
        });
      }
    });
    return list
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);
  }, [offers]);

  const groupedActivities = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const groups = { Today: [], Yesterday: [], Earlier: [] };

    recentActivities.forEach(act => {
      const actDate = new Date(act.at);
      const actDateStr = actDate.toDateString();

      if (actDateStr === todayStr) {
        groups.Today.push(act);
      } else if (actDateStr === yesterdayStr) {
        groups.Yesterday.push(act);
      } else {
        groups.Earlier.push(act);
      }
    });

    return groups;
  }, [recentActivities]);

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 dark:bg-slate-950 p-4 text-slate-900 dark:text-slate-100 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Enterprise Hiring Operations
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">Offer Workflow & Hiring Operations</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Manage selection, offer creation, approvals, release, negotiation, acceptance, and pre-onboarding from a single enterprise command center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/offer-management">
            <Button variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><ArrowLeft className="mr-2 h-4 w-4" />Classic Offers</Button>
          </Link>
          <Button onClick={loadDashboard} variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <ExportCenter onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="dark-shimmer h-40 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-6 text-center">
          <p className="font-semibold text-slate-900 dark:text-white">Offer operations could not be loaded</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{error}</p>
          <Button onClick={loadDashboard} className="mt-4 bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">Retry</Button>
        </div>
      ) : (
        <>
          {!showApprovalsOnly && !showTemplatesOnly && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(data?.overview || []).map((metric) => <OfferOperationsKpiCard key={metric.key} metric={metric} />)}
            </section>
          )}

          {offers.length > 0 && (
            <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-4 shadow-xl shadow-black/10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900 dark:text-white">Active Offer Work Queue</h2>
                {selectedOffer && canApproveOffers && <Button onClick={() => handleAction("send", selectedOffer)} className="bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200"><Send className="mr-2 h-4 w-4" />Send Selected Offer</Button>}
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1.5">
                {offers.map((offer) => {
                  const priority = offer.priority || (Number(offer.salary) >= 250000 ? "High" : Number(offer.salary) < 120000 ? "Low" : "Medium");
                  const priorityColor = priority === "High" ? "text-rose-500 border-rose-500/20 bg-rose-500/10" : priority === "Low" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : "text-amber-500 border-amber-500/20 bg-amber-500/10";
                  return (
                    <button
                      key={offer._id || offer.offerId}
                      onClick={() => setSelectedOfferId(offer._id)}
                      className={cn(
                        "min-w-72 rounded-md border p-4 text-left flex flex-col justify-between gap-2.5 transition-all duration-200 hover:scale-[1.01] cursor-pointer",
                        selectedOffer?._id === offer._id
                          ? "border-cyan-300/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/5"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <div>
                        <p className="truncate font-semibold text-slate-900 dark:text-white text-base">{offer.candidateName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{offer.offerId}</p>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <p>Status: <span className="font-semibold text-slate-900 dark:text-white">{offer.status}</span></p>
                        <p>Stage: <span className="font-semibold text-slate-900 dark:text-white">{offer.approvalStage || "Draft"}</span></p>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/50 dark:border-white/5">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", priorityColor)}>
                          {priority} Priority
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {showTemplatesOnly ? (
            <TemplatesPanel offers={offers} />
          ) : showAnalyticsOnly ? (
            <OfferAnalyticsDashboard data={data} />
          ) : showApprovalsOnly ? (
            <OfferApprovalTimeline offer={selectedOffer} onAction={handleAction} canWrite={canApproveOffers} />
          ) : (
            <>
              {/* Offers Requiring Attention */}
              <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offers Requiring Attention</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Actionable items requiring HR or manager intervention.</p>
                  </div>
                  <Link to="/dashboard/offer-management">
                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-white/10 text-xs font-semibold">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Link to="/dashboard/offer-management?status=Pending Approval" className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors block">
                    <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Pending HR Approval</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{pendingHr}</p>
                  </Link>
                  <Link to="/dashboard/offer-management?status=Pending Approval" className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 hover:bg-blue-500/10 transition-colors block">
                    <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Pending Manager Approval</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{pendingMgr}</p>
                  </Link>
                  <Link to="/dashboard/offer-management?expiry=Due soon" className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 hover:bg-rose-500/10 transition-colors block">
                    <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Offers Expiring Soon</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{expiringSoon}</p>
                  </Link>
                  <Link to="/dashboard/offer-management?status=Released" className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 hover:bg-purple-500/10 transition-colors block">
                    <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Candidate Response Pending</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{responsePending}</p>
                  </Link>
                </div>
              </section>

              {/* Recent Offer Activities & Operational Summary */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Offer Activities */}
                <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Offer Activities</h2>
                  <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Real-time status updates and operations history log.</p>
                  <div className="custom-scrollbar max-h-[340px] overflow-y-auto space-y-4 pr-1">
                    {recentActivities.length === 0 ? (
                      <p className="text-sm text-slate-500">No recent activities available.</p>
                    ) : (
                      Object.entries(groupedActivities).map(([groupName, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={groupName} className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{groupName}</h3>
                            <div className="space-y-2">
                              {items.map((act, index) => {
                                const lowerAction = act.action.toLowerCase();
                                const isAccepted = lowerAction.includes("accept");
                                const isDeclined = lowerAction.includes("decline") || lowerAction.includes("reject");
                                const isApproved = lowerAction.includes("approve");
                                const isSent = lowerAction.includes("send") || lowerAction.includes("release");
                                
                                const Icon = isAccepted ? CheckCircle2 : isDeclined ? XCircle : isApproved ? BadgeCheck : isSent ? Send : Clock3;
                                const iconColor = isAccepted ? "text-emerald-500" : isDeclined ? "text-rose-500" : isApproved ? "text-amber-500" : "text-sky-500";
                                
                                const dateObj = new Date(act.at);
                                const dateFormatted = dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
                                const timeFormatted = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                                return (
                                  <div key={index} className="flex gap-3 items-start border-b border-slate-100 dark:border-white/5 pb-2.5">
                                    <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} />
                                    <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{act.candidateName}</p>
                                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{act.offerId}</p>
                                      </div>
                                      <div className="min-w-0 text-xs">
                                        <span className="text-slate-500 dark:text-slate-400">Action:</span>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{act.action}</p>
                                      </div>
                                      <div className="text-xs sm:text-right shrink-0">
                                        <p className="text-slate-500 dark:text-slate-400">Performed by: <span className="font-semibold text-slate-800 dark:text-slate-200">{act.actor}</span></p>
                                        <p className="text-slate-400 text-3xs mt-0.5">{dateFormatted} · {timeFormatted}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Operational Summary */}
                <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Operational Summary</h2>
                  <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Key metrics outlining compensation ranges, efficiency, and pipeline velocity.</p>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Highest Offer</span>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(highestOffer)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Lowest Offer</span>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(lowestOffer)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Average Offer CTC</span>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(avgOfferValue)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Avg Response Time</span>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{avgResponseTime} days</p>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3 sm:col-span-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Offers This Month</span>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{offersThisMonth}</p>
                    </div>
                  </div>
                </section>
              </div>
              <OfferLifecycleTracker offer={selectedOffer} />
              <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
                <OfferApprovalTimeline offer={selectedOffer} onAction={handleAction} canWrite={canApproveOffers} />
                <CompensationBreakdownCard offer={selectedOffer} />
              </div>
              <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
                <NegotiationTimeline offer={selectedOffer} onAction={handleAction} canWrite={canApproveOffers} />
                <NotificationCenter notifications={data?.notifications || []} />
              </div>
              <div className="grid gap-6 2xl:grid-cols-[1fr_1fr]">
                <HiringActivityFeed activity={data?.activity || []} />
                <CandidateComparisonPanel offers={offers} />
              </div>
              <OfferInsightsPanel insights={data?.insights || []} />
              <OfferAnalyticsDashboard data={data} />
              <OfferAutomationRules rules={selectedOffer?.automationRules || []} />
              <TemplatesPanel offers={offers} />
              <PreOnboardingWorkflow offer={selectedOffer} />
              {selectedOffer && (
                <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offer Letter Preview</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Professional offer letter with compensation, terms, and digital signature placeholders.</p>
                    </div>
                    <Button onClick={() => setPreviewOffer(selectedOffer)} className="bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">Preview Offer</Button>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <OfferLetterPreview offer={previewOffer} open={Boolean(previewOffer)} onClose={() => setPreviewOffer(null)} onDownload={() => handleExport("pdf")} />
    </div>
  );
};

export default OfferOperations;
