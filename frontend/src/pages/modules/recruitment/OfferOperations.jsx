import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import offerOperationsService from "@/services/offerOperationsService";
import { useUser } from "@/contexts/UserContext";
import { enrichOffer } from "@/components/recruitment/OfferWorkflow";
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
            <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900 dark:text-white">Active Offer Work Queue</h2>
                {selectedOffer && canApproveOffers && <Button onClick={() => handleAction("send", selectedOffer)} className="bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200"><Send className="mr-2 h-4 w-4" />Send Selected Offer</Button>}
              </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {offers.map((offer) => (
                  <button key={offer._id || offer.offerId} onClick={() => setSelectedOfferId(offer._id)} className={`min-w-64 rounded-md border p-3 text-left ${selectedOffer?._id === offer._id ? "border-cyan-300/40 bg-cyan-500/10" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]"}`}>
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{offer.candidateName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{offer.offerId} · {offer.status}</p>
                  </button>
                ))}
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
              <OfferGenerator onSubmit={handleCreate} canWrite={canWrite} />
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
