import { useCallback, useEffect, useMemo, useState } from "react";
import * as Motion from "framer-motion";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, RefreshCw, Send, CheckCircle2, XCircle, BadgeCheck, Clock3, AlertTriangle, CircleDollarSign, Eye, UserCheck, FileText, Download, UserPlus, Archive, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import offerOperationsService from "@/services/offerOperationsService";
import apiClient from "@/services/apiClient";
import { useUser } from "@/contexts/UserContext";
import { enrichOffer, formatMoney, OfferStatusBadge } from "@/components/recruitment/OfferWorkflow";

const executiveDesignationPattern = /\b(executive|manager|director|head|chief|vp|vice president|president|lead|principal|architect)\b/i;

const getActiveTemplateName = (offer) => {
  if (!offer) return "Standard Employment Offer";
  const tid = (offer.templateId || "").toLowerCase().trim();
  if (tid === "executive" || tid === "executive-offer") {
    return "Executive Employment Offer";
  }
  if (tid === "standard" || tid === "standard-offer") {
    return "Standard Employment Offer";
  }
  const designation = (offer.position || "").trim();
  return executiveDesignationPattern.test(designation) ? "Executive Employment Offer" : "Standard Employment Offer";
};

import { cn } from "@/lib/utils";
import {
  CandidateComparisonPanel,
  CompensationBreakdownCard,
  ExportCenter,
  HiringActivityFeed,
  NegotiationTimeline,
  NotificationCenter,
  OfferApprovalTimeline,
  OfferAutomationRules,
  OfferInsightsPanel,
  OfferLifecycleTracker,
  OfferLetterPreview,
  PreOnboardingWorkflow,
  TemplatesPanel,
} from "@/components/recruitment/OfferOperationsPlatform";

const payload = (res) => res?.data || res || {};
const approvalStatuses = ["Pending HR Manager Approval", "Pending CEO Approval", "Under Review", "Changes Requested"];
const canSendOffer = (offer) => offer?._id && offer.status === "Offered";

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

  const handleAction = async (action, offer) => {
    if (!offer?._id) return;
    const isReleaseAction = action === "send" || action === "escalate";
    const isUtilityAction = action === "preview" || action === "download" || action === "archive";
    
    if (isReleaseAction && !canWrite) {
      toast.error("You do not have permission to send offers");
      return;
    }
    if (!isReleaseAction && !isUtilityAction && !canApproveOffers) {
      toast.error("Only HR Manager can perform offer approval and release actions");
      return;
    }
    if (isReleaseAction && !canSendOffer(offer)) {
      toast.error("Offer must be approved before it can be sent");
      return;
    }
    try {
      if (action === "preview") {
        setPreviewOffer(offer);
        return;
      }
      if (action === "download") {
        const toastId = toast.loading("Generating official Offer Letter PDF...");
        try {
          const res = await apiClient.get(`/offers/${offer._id}/pdf`, { responseType: "blob" });
          const blob = new Blob([res.data || res], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          const formattedName = (offer.candidateName || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
          const version = offer.negotiationRounds?.length ? `_V${offer.negotiationRounds.length + 1}` : "";
          link.href = url;
          link.download = `Offer_Letter_${formattedName}${version}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          toast.dismiss(toastId);
          toast.success("Official Offer Letter PDF downloaded successfully");
        } catch (err) {
          console.error("PDF download error:", err);
          toast.dismiss(toastId);
          toast.error(err?.response?.data?.error || "Failed to download Offer Letter PDF");
        }
        return;
      }
      if (action === "archive") {
        toast.success("Offer folder successfully archived");
        return;
      }
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

  const showApprovalsOnly = section === "approvals";
  const showTemplatesOnly = section === "templates";

  const pendingHr = useMemo(() => offers.filter(o => approvalStatuses.includes(o.status)).length, [offers]);
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
      .slice(0, 6);
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
    <div className="min-h-screen space-y-6 bg-slate-50 dark:bg-slate-950 p-5 text-slate-900 dark:text-slate-100 md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Enterprise Hiring Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">Offer Operations</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Prioritize approvals, releases, responses, and offer follow-through from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/dashboard/offer-management">
            <Button variant="outline" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"><ArrowLeft className="mr-2 h-4 w-4" />Classic Offers</Button>
          </Link>
          <Button onClick={loadDashboard} variant="outline" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <ExportCenter onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="dark-shimmer h-32 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/5 p-8 text-center max-w-lg mx-auto">
          <p className="font-semibold text-slate-900 dark:text-white text-lg">Offer operations could not be loaded</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <Button onClick={loadDashboard} className="mt-5 rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-all shadow-sm">Retry</Button>
        </div>
      ) : (
        <>
          {!showApprovalsOnly && !showTemplatesOnly && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Needs Attention</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Approval blockers, expiry risk, and pending candidate responses.</p>
                  </div>
                </div>
                <Link to="/dashboard/offer-management">
                  <Button variant="outline" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm">
                    <Eye className="mr-2 h-3.5 w-3.5" />View All
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/dashboard/offer-management?status=Pending Approval" className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/35 dark:bg-amber-500/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100/45 dark:hover:bg-amber-500/10 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">HR Approval</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{pendingHr}</p>
                </Link>
                <Link to="/dashboard/offer-management?status=Pending Approval" className="rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50/35 dark:bg-blue-500/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-100/45 dark:hover:bg-blue-500/10 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Manager Approval</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{pendingMgr}</p>
                </Link>
                <Link to="/dashboard/offer-management?expiry=Due soon" className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50/35 dark:bg-rose-500/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100/45 dark:hover:bg-rose-500/10 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Expiring Soon</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{expiringSoon}</p>
                </Link>
                <Link to="/dashboard/offer-management?status=Released" className="rounded-lg border border-violet-200 dark:border-violet-500/20 bg-violet-50/35 dark:bg-violet-500/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-100/45 dark:hover:bg-violet-500/10 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Response Due</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{responsePending}</p>
                </Link>
              </div>
            </section>
          )}

          {offers.length > 0 && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <BriefcaseBusiness className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Active Offer Work Queue</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Open candidate packages and release-ready offers.</p>
                  </div>
                </div>
                {selectedOffer && canWrite && canSendOffer(selectedOffer) && <Button onClick={() => handleAction("send", selectedOffer)} className="rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-all shadow-sm"><Send className="mr-2 h-4 w-4" />Send Selected Offer</Button>}
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1">
                {offers.map((offer) => {
                  const priority = offer.priority || (Number(offer.salary) >= 250000 ? "High" : Number(offer.salary) < 120000 ? "Low" : "Medium");
                  const priorityColor = priority === "High" ? "text-rose-700 border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10" : priority === "Low" ? "text-emerald-700 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10" : "text-amber-700 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10";
                  const isSelected = selectedOffer?._id === offer._id;
                  const initials = (offer.candidateName || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

                  return (
                    <button
                      key={offer._id || offer.offerId}
                      onClick={() => setSelectedOfferId(offer._id)}
                      className={cn(
                        "relative overflow-hidden min-w-72 rounded-lg text-left flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
                        isSelected
                          ? "border-2 border-cyan-500 dark:border-cyan-500/60 bg-cyan-500/[0.025] dark:bg-cyan-500/[0.035] p-[15px] shadow-md shadow-cyan-500/[0.05] dark:shadow-cyan-900/10"
                          : "border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-white/[0.01] p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
                      )}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-500 dark:bg-cyan-400" />}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold text-xs border border-cyan-500/20">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 dark:text-slate-205 text-sm">{offer.candidateName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{offer.offerId}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850">
                        <p className="truncate"><span className="font-semibold text-slate-700 dark:text-slate-300">{offer.status}</span></p>
                        <p className="truncate">{offer.approvalStage || "Draft"}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", priorityColor)}>
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
            <TemplatesPanel offers={offers} selectedOffer={selectedOffer} onPreview={(templateId) => setPreviewOffer({ ...selectedOffer, previewTemplateId: templateId })} />
          ) : showApprovalsOnly ? (
            <OfferApprovalTimeline offer={selectedOffer} onAction={handleAction} canWrite={canApproveOffers} />
          ) : (
            <>
              {/* Recent Offer Activities & Operational Summary */}
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                {/* Recent Offer Activities */}
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Recent Activity</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Latest offer events only.</p>
                      </div>
                    </div>
                    <Link to="/dashboard/offer-management">
                      <Button variant="outline" size="sm" className="rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm">
                        <Eye className="mr-2 h-3.5 w-3.5" />View All
                      </Button>
                    </Link>
                  </div>
                  <div className="custom-scrollbar max-h-[300px] overflow-y-auto space-y-3 pr-1">
                    {recentActivities.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500">No recent activities available.</p>
                    ) : (
                      Object.entries(groupedActivities).map(([groupName, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={groupName} className="space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{groupName}</h3>
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
                                  <div key={index} className="flex gap-3 items-start rounded-lg border border-transparent p-2.5 transition-colors duration-150 hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/[0.015]">
                                    <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} />
                                    <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[0.9fr_1.2fr_auto] gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-205 truncate">{act.candidateName}</p>
                                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{act.offerId}</p>
                                      </div>
                                      <div className="min-w-0 text-xs">
                                        <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{act.action}</p>
                                      </div>
                                      <div className="text-xs sm:text-right shrink-0">
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">{act.actor}</p>
                                        <p className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{dateFormatted} · {timeFormatted}</p>
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
                {/* Selected Candidate Overview */}
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Selected Candidate Overview</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Review the active candidate and offer information before proceeding with offer actions.</p>
                    </div>
                  </div>
                  {selectedOffer ? (
                    (() => {
                      const initials = (selectedOffer.candidateName || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                      const isAutoRecommended = !selectedOffer.templateId || selectedOffer.templateId === "executive-standard";
                      const empType = selectedOffer.employmentType || selectedOffer.candidateId?.jobId?.employmentType || "Full-Time";
                      
                      return (
                        <div className="space-y-4 mt-4">
                          {/* Candidate Identity (Primary Focus) */}
                          <div className="space-y-3.5">
                            <div className="h-10 w-10 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold text-xs border border-cyan-500/20 grid place-items-center shrink-0">
                              {initials}
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">{selectedOffer.candidateName}</h3>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">{selectedOffer.position}</p>
                              <p className="text-xs text-slate-450 dark:text-slate-500">
                                {selectedOffer.department} &bull; {empType}
                              </p>
                            </div>
                          </div>

                          <hr className="border-slate-100 dark:border-slate-850" />

                          {/* Key-Value Information Grid */}
                          <div className="grid grid-cols-[120px_1fr] gap-y-3.5 text-xs">
                            <span className="text-slate-400 dark:text-slate-500 font-semibold py-0.5">Offer status</span>
                            <div className="py-0.5">
                              <OfferStatusBadge status={selectedOffer.status} />
                            </div>

                            <span className="text-slate-400 dark:text-slate-500 font-semibold py-0.5">Employee ID</span>
                            <div className="py-0.5">
                              {(() => {
                                const empRef = selectedOffer.employeeId;
                                const empCode = typeof empRef === "object" ? empRef?.employeeCode : (selectedOffer.employeeCode || null);
                                const empProfileId = typeof empRef === "object" ? empRef?._id : (typeof empRef === "string" ? empRef : null);

                                if (empCode || empProfileId) {
                                  return (
                                    <Link
                                      to={`/employee-center/employee/${empProfileId || empCode}`}
                                      className="inline-flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                                      title="View Employee Profile in Employee Center"
                                    >
                                      {empCode || "View Profile"}
                                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    </Link>
                                  );
                                }
                                return <span className="text-slate-400 dark:text-slate-500 italic font-normal">Not Generated</span>;
                              })()}
                            </div>

                            <span className="text-slate-400 dark:text-slate-500 font-semibold">Template</span>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{getActiveTemplateName(selectedOffer)}</p>
                              {isAutoRecommended && (
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 font-medium">Auto Recommended</p>
                              )}
                            </div>

                            <span className="text-slate-400 dark:text-slate-500 font-semibold">Joining Date</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOffer.joiningDate || "N/A"}</span>

                            <span className="text-slate-400 dark:text-slate-500 font-semibold">Annual CTC</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatMoney(selectedOffer.compensation?.total || selectedOffer.salary)}</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <UserCheck className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a candidate from the Active Offer Work Queue above to view their details.</p>
                    </div>
                  )}
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
              <OfferAutomationRules rules={selectedOffer?.automationRules || []} />
              <TemplatesPanel offers={offers} selectedOffer={selectedOffer} onPreview={(templateId) => setPreviewOffer({ ...selectedOffer, previewTemplateId: templateId })} />
              <PreOnboardingWorkflow offer={selectedOffer} />
              {selectedOffer && (
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Offer Letter Preview</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Review the selected candidate letter.</p>
                      </div>
                    </div>
                    <Button onClick={() => setPreviewOffer(selectedOffer)} className="rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-all shadow-sm hover:-translate-y-0.5">Preview Offer</Button>
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
