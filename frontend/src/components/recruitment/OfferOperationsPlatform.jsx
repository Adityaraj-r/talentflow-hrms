import { PriorityDot } from "@/components/ui/PriorityDot";
import { useEffect, useState, useMemo } from "react";
import apiClient from "@/services/apiClient";
import CountUp from "react-countup";
import * as Motion from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, Bell, Bot, CalendarClock, CheckCircle2, CircleDollarSign, Clock3, Download, Eye, FileSignature, FileText, GitBranch, Layers, MailCheck, MessageSquareText, PenLine, Send, Settings2, ShieldCheck, Sparkles, UserCheck, Users, XCircle, Zap, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import {
  ApprovalTimeline,
  enrichOffer,
  formatMoney,
  OfferLetterPreview,
  OfferStatusBadge,
  SalaryBreakdownChart,
} from "@/components/recruitment/OfferWorkflow";

const colors = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185", "#2dd4bf"];

const chartTooltip = {
  background: "rgb(15 23 42)",
  border: "1px solid rgb(255 255 255 / 0.12)",
  borderRadius: 8,
  color: "white",
};

export function OfferOperationsKpiCard({ metric }) {
  const positive = Number(metric?.trend || 0) >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  const lineData = (metric?.sparkline || []).map((value, index) => ({ index, value: Math.max(0, Number(value) || 0) }));
  const money = metric?.key === "avgSalary";

  return (
    <Motion.motion.div whileHover={{ y: -4 }} className="relative min-h-[166px] overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-4 shadow-xl shadow-black/10">
      <div className={cn("absolute inset-x-0 top-0 h-1", metric?.status === "warning" ? "bg-amber-300" : metric?.status === "risk" ? "bg-rose-400" : metric?.status === "success" ? "bg-emerald-400" : "bg-cyan-400")} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{metric?.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {money ? formatMoney(metric?.value || 0) : <CountUp end={Number(metric?.value) || 0} duration={0.8} preserveValue />}
            {!money && <span className="text-lg text-slate-700 dark:text-slate-300">{metric?.suffix}</span>}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold", positive ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-rose-400/30 bg-rose-500/10 text-rose-300")}>
          <TrendIcon className="h-3.5 w-3.5" /> {Math.abs(Number(metric?.trend) || 0)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric?.comparison}</p>
      <div className="mt-4 h-12">
        <ResponsiveContainer>
          <AreaChart data={lineData}>
            <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="#22d3ee33" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-right font-medium">Last Updated 2 mins ago</p>
    </Motion.motion.div>
  );
}

export function OfferLifecycleTracker({ offer }) {
  const steps = ["Draft", "HR Review", "Manager Review", "Finance Approval", "HR Manager Approval", "Sent", "Viewed", "Negotiation", "Accepted / Rejected", "Joined"];
  const status = offer?.status || "Draft";
  const activeIndex = status === "Joined" ? 9 : status === "Pending CEO Approval" || status === "Pending HR Manager Approval" ? 4 : status === "Offered" ? (offer?.emailStatus === "Sent" ? 5 : 4) : status === "Accepted" ? 8 : status === "Declined" ? 8 : 2;
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offer Lifecycle Workflow</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Selection to offer release, negotiation, acceptance, and pre-onboarding.</p>
        </div>
        {offer && <OfferStatusBadge status={offer.status} />}
      </div>
      <div className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-y-6">
          {steps.map((step, index) => {
            const isJoined = status === "Joined";
            const complete = index < activeIndex || status === "Accepted" || isJoined;
            const active = index === activeIndex && !isJoined;
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <Motion.motion.div
                    animate={{ scale: active ? 1.15 : 1 }}
                    className={cn(
                      "grid place-items-center rounded-full border transition-all duration-300",
                      active
                        ? "h-14 w-14 border-[3px] border-cyan-500 dark:border-cyan-400 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 shadow-lg shadow-cyan-500/20"
                        : "h-11 w-11",
                      complete && "border-emerald-400 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                      !complete && !active && "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400 dark:text-slate-600"
                    )}
                  >
                    {complete ? <CheckCircle2 className="h-5 w-5" /> : active ? <Clock3 className="h-6 w-6 animate-pulse" /> : <GitBranch className="h-5 w-5" />}
                  </Motion.motion.div>
                  <span className={cn("mt-2 w-24 text-xs font-semibold", active ? "text-cyan-600 dark:text-cyan-300 font-bold" : complete ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600")}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn("mx-2 mt-5 h-px flex-1 transition-all duration-300", complete ? "bg-emerald-400" : active ? "bg-cyan-500/50" : "bg-slate-200 dark:bg-white/10")} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {(offer?.activityHistory || []).slice(-3).map((item, index) => (
          <div key={`${item.message}-${index}`} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.message}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.actor || "Hiring Operations"} · {new Date(item.at || Date.now()).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MoreActionsDropdown({ onAction, offer }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"
      >
        More Actions <span className="ml-1.5 text-[10px]">▼</span>
      </Button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 py-1 z-50 ring-1 ring-black ring-opacity-5">
          <button
            onClick={() => { onAction("send", offer); setIsOpen(false); }}
            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Send Offer
          </button>
          <button
            onClick={() => { onAction("negotiate", offer); setIsOpen(false); }}
            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Negotiate Offer
          </button>
        </div>
      )}
    </div>
  );
}

export function OfferApprovalTimeline({ offer, onAction, canWrite }) {
  const { user } = useUser();
  const currentUserId = user?.id || user?._id;
  

  const hasApproved = offer?.approvalHistory?.some(item => 
    String(item.approverId || '') === String(currentUserId || '') && item.action === 'Approved'
  );

  const myApproval = offer?.approvalHistory?.find(item => 
    String(item.approverId || '') === String(currentUserId || '') && item.action === 'Approved'
  );
  
  const approvalTimestamp = myApproval ? new Date(myApproval.at).toLocaleString() : '';

  const approvals = offer?.approvalHistory?.length ? offer.approvalHistory : [
    { role: "Recruiter", action: "Submitted", comments: "Offer package submitted", at: offer?.createdAt },
    { role: "HR Manager", action: "Approved", comments: "Policy reviewed", at: offer?.createdAt },
    { role: "Finance Manager", action: "Approved", comments: "Budget verified", at: offer?.createdAt },
    { role: "HR Manager", action: offer?.status === "Pending CEO Approval" || offer?.status === "Pending HR Manager Approval" ? "Pending" : "Approved", comments: "Offer approval checkpoint", at: offer?.updatedAt },
  ];

  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Multi-Level Approval System</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recruiter, HR, hiring manager, finance, and HR Manager checkpoints.</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
      </div>
      <div className="space-y-3">
        {approvals.map((row, index) => (
          <div key={`${row.role}-${index}`} className="flex gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border", row.action === "Pending" ? "border-amber-400/30 bg-amber-500/10 text-amber-300" : row.action === "Rejected" ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300")}>
              {row.action === "Pending" ? <Clock3 className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">Approver: {row.role}</p>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", row.action === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : row.action === "Rejected" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")}>
                  {row.action}
                </span>
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p><span className="font-medium text-slate-400 dark:text-slate-500">Date:</span> {row.at ? new Date(row.at).toLocaleString() : "Pending"}</p>
                <p><span className="font-medium text-slate-400 dark:text-slate-500">Remarks:</span> <span className="italic">{row.comments || "No remarks"}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {canWrite && offer?._id && (
        <div className="mt-4 space-y-4">
          {hasApproved ? (
            <>
              {/* Success Indicator & Contextual Status Message */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Approved by You {approvalTimestamp && `on ${approvalTimestamp}`}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 pl-7">
                  <p>Offer approved and moved to the Offer Sent stage.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Additional approvals can be requested later through Escalate if required.</p>
                </div>
              </div>
              
              {/* Actions valid after approval */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onAction("reject", offer)} 
                  className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                <Button 
                  variant="outline" 
                  onClick={() => onAction("changes", offer)} 
                  className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"
                >
                  <PenLine className="mr-2 h-4 w-4" />Request Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onAction("escalate", offer)} 
                  className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />Escalate
                </Button>
                <MoreActionsDropdown onAction={onAction} offer={offer} />
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onAction("approve", offer)} className="bg-emerald-400 text-white dark:text-slate-950 hover:bg-emerald-300"> <span title="Approve" className="flex items-center justify-center w-full h-full text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /><span className="sr-only">Approve</span></span></Button>
              <Button variant="outline" onClick={() => onAction("reject", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
              <Button variant="outline" onClick={() => onAction("changes", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><PenLine className="mr-2 h-4 w-4" />Request Changes</Button>
              <Button variant="outline" onClick={() => onAction("escalate", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><AlertTriangle className="mr-2 h-4 w-4" />Escalate</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function CompensationBreakdownCard({ offer }) {
  const enriched = enrichOffer(offer || {});
  const compensation = offer?.compensation?.totalCtc ? {
    base: offer.compensation.fixedSalary,
    bonus: offer.compensation.bonus,
    allowances: offer.compensation.allowances,
    stock: offer.compensation.stockOptions,
    joiningBonus: offer.compensation.joiningBonus,
    total: offer.compensation.totalCtc,
  } : enriched.compensation;
  const data = [
    { name: "Fixed Salary", value: compensation.base },
    { name: "Bonus", value: compensation.bonus },
    { name: "Allowances", value: compensation.allowances },
    { name: "Benefits", value: offer?.compensation?.benefitsValue || Math.round((offer?.salary || 0) * 0.06) },
    { name: "Joining Bonus", value: compensation.joiningBonus },
    { name: "Stock Options", value: compensation.stock },
  ];
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compensation Visualization</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Salary breakdown, benefits, equity, and total CTC.</p>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
                {data.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={chartTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((item, index) => {
            const pct = Math.min(100, Math.round((item.value / Math.max(1, compensation.total)) * 100));
            return (
              <div key={item.name} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.name} ({pct}%)</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatMoney(item.value)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[index % colors.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-500/10 p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">Total CTC</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatMoney(compensation.total)}</p>
      </div>
    </section>
  );
}

export function OfferGenerator({ onSubmit, canWrite }) {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({
    candidateId: "",
    candidateEmail: "",
    candidateName: "",
    position: "",
    department: "",
    salary: "",
    joiningDate: "",
    noticeBuyout: "",
    bonus: "",
    benefits: "Health Insurance, Paid Leave",
    probationDetails: "6 months",
    reportingManager: "",
    templateId: "executive-standard",
  });

  useEffect(() => {
    let active = true;
    const fetchCandidates = async () => {
      try {
        const res = await apiClient.get("/applications");
        const rawData = res?.data?.data ?? res?.data ?? res ?? [];
        if (active) {
          const filtered = Array.isArray(rawData)
            ? rawData.filter((app) => ["Selected", "Offer"].includes(app.status))
            : [];
          setCandidates(filtered);
        }
      } catch (err) {
        console.error("Failed to load candidates", err);
      }
    };
    fetchCandidates();
    return () => {
      active = false;
    };
  }, []);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleCandidateChange = (candidateId) => {
    const candidate = candidates.find((c) => c._id === candidateId);
    if (candidate) {
      setForm((current) => ({
        ...current,
        candidateId,
        candidateEmail: candidate.email || "",
        candidateName: (candidate.name || "").trim(),
        position: candidate.jobId?.jobTitle || current.position,
      }));
    }
  };

  const inputFields = [
    ["position", "Position"],
    ["department", "Department"],
    ["salary", "Salary Package"],
    ["joiningDate", "Joining Date"],
    ["noticeBuyout", "Notice Buyout"],
    ["bonus", "Bonus"],
    ["benefits", "Benefits"],
    ["probationDetails", "Probation Details"],
    ["reportingManager", "Reporting Manager"],
    ["templateId", "Template"],
  ];

  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Offer Generator</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Create offer packages with templates, draft metadata, and approval routing.</p>
      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="flex flex-col gap-1">
          <select
            value={form.candidateId}
            onChange={(e) => handleCandidateChange(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Select Candidate</option>
            {candidates.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.email || "No Email"})
              </option>
            ))}
          </select>
        </div>
        {inputFields.map(([key, label]) => (
          <Input key={key} type={key === "joiningDate" ? "date" : key === "salary" || key === "bonus" || key === "noticeBuyout" ? "number" : "text"} value={form[key]} onChange={(event) => set(key, event.target.value)} placeholder={label} required={["salary", "joiningDate"].includes(key)} className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-100" />
        ))}
        <Button disabled={!canWrite} className="md:col-span-3 bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">
          <FileSignature className="mr-2 h-4 w-4" /> Save Draft & Route Approval
        </Button>
      </form>
    </section>
  );
}

export function NegotiationTimeline({ offer, onAction, canWrite }) {
  const rounds = offer?.negotiationRounds?.length ? offer.negotiationRounds : [
    { round: 1, originalOffer: offer?.salary || 0, requestedSalary: Math.round((offer?.salary || 0) * 1.08), revisedOffer: offer?.salary || 0, notes: "Candidate compensation expectation captured.", at: offer?.updatedAt },
  ];
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Negotiation Workflow</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Original offer, candidate request, revised package, and final settlement.</p>
        </div>
        <MessageSquareText className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>
      <div className="space-y-3">
        {rounds.map((round) => (
          <div key={round.round} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-white">Round {round.round}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(round.at || Date.now()).toLocaleString()}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniValue label="Original" value={formatMoney(round.originalOffer)} />
              <MiniValue label="Requested" value={formatMoney(round.requestedSalary)} />
              <MiniValue label="Revised" value={formatMoney(round.revisedOffer)} />
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{round.notes}</p>
          </div>
        ))}
      </div>
      {canWrite && offer?._id && (
        <Button onClick={() => onAction("negotiate", offer)} className="mt-4 bg-cyan-600 dark:bg-cyan-300 text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">
          <PenLine className="mr-2 h-4 w-4" /> Record Negotiation
        </Button>
      )}
    </section>
  );
}

function MiniValue({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function HiringActivityFeed({ activity = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiring Activity Feed</h2>
      <div className="mt-5 space-y-3">
        {activity.slice(0, 8).map((item, index) => (
          <div key={`${item.message}-${index}`} className="flex gap-3">
            <PriorityDot priority={item.priority} className="mt-1 w-auto" />
            <div className="border-b border-white/5 pb-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.message}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.candidateName || item.actor} · {new Date(item.at || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NotificationCenter({ notifications = [] }) {
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    let hasTimestamps = false;

    notifications.forEach(item => {
      const ts = item.at || item.date || item.timestamp || item.createdAt;
      if (ts) {
        hasTimestamps = true;
        const dStr = new Date(ts).toDateString();
        if (dStr === todayStr) {
          groups.Today.push(item);
        } else if (dStr === yesterdayStr) {
          groups.Yesterday.push(item);
        } else {
          groups.Earlier.push(item);
        }
      }
    });

    return hasTimestamps ? groups : null;
  }, [notifications, todayStr, yesterdayStr]);

  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Center</h2>
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white">{notifications.length}</span>
      </div>
      <div className="custom-scrollbar max-h-96 overflow-y-auto space-y-4">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No new notifications.</p>
        ) : grouped ? (
          Object.entries(grouped).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{groupName}</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <NotificationItem key={index} item={item} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 7).map((item, index) => (
              <NotificationItem key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NotificationItem({ item }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
      <div className="flex items-start gap-3">
        <PriorityDot priority={item.priority} className="mt-0.5 w-auto" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.message}</p>
        </div>
      </div>
    </div>
  );
}

export function CandidateComparisonPanel({ offers = [] }) {
  const rows = useMemo(() => {
    return offers.slice(0, 5).map((offer) => {
      const offered = Number(offer.salary || 0);
      const expected = Number(offer.expectedSalary || Math.round(offered * 0.95));
      const diff = offered - expected;
      return {
        id: offer._id || offer.offerId,
        name: offer.candidateName,
        interviewScore: offer.interviewScore !== undefined && offer.interviewScore !== null ? `${offer.interviewScore}/10` : "N/A",
        expected,
        offered,
        difference: diff,
        status: offer.status,
      };
    });
  }, [offers]);

  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Candidate Comparison Panel</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Side-by-side candidate expected salary, offered salary, difference, and status comparison.</p>
      <div className="overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="w-[20%] px-3 py-2 text-left truncate">Candidate</th>
              <th className="w-[15%] px-3 py-2 text-left truncate">Interview Score</th>
              <th className="w-[15%] px-3 py-2 text-left truncate">Expected Salary</th>
              <th className="w-[15%] px-3 py-2 text-left truncate">Offered Salary</th>
              <th className="w-[15%] px-3 py-2 text-left truncate">Difference</th>
              <th className="w-[20%] px-3 py-2 text-left truncate">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-slate-500">No candidate comparison data available</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white truncate">{row.name}</td>
                  <td className="px-3 py-3 truncate">{row.interviewScore}</td>
                  <td className="px-3 py-3 font-mono truncate">{formatMoney(row.expected)}</td>
                  <td className="px-3 py-3 font-mono font-semibold text-slate-900 dark:text-white truncate">{formatMoney(row.offered)}</td>
                  <td className={cn("px-3 py-3 font-mono font-semibold truncate", row.difference >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {row.difference >= 0 ? "+" : ""}{formatMoney(row.difference)}
                  </td>
                  <td className="px-3 py-3 truncate">
                    <OfferStatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OfferAnalyticsDashboard({ data }) {
  const analytics = data?.analytics || {};
  const stats = [
    ["Acceptance Rate", `${analytics.acceptanceRate || 0}%`, <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
    ["Rejection Rate", `${analytics.rejectionRate || 0}%`, <XCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
    ["Negotiation Rate", `${analytics.negotiationRate || 0}%`, <MessageSquareText className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
    ["Joining Conversion", `${analytics.joiningConversion || 0}%`, <UserCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
    ["Avg Compensation", formatMoney(analytics.averageCompensation || 0), <CircleDollarSign className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
    ["Approval Turnaround", `${analytics.approvalTurnaroundTime || 0}d`, <Clock3 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />],
  ];
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offer Analytics Dashboard</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value, icon]) => (
          <div key={label} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
            {icon}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 h-72">
        <ResponsiveContainer>
          <LineChart data={data?.trends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={chartTooltip} />
            <Line type="monotone" dataKey="generated" stroke="#38bdf8" strokeWidth={2} />
            <Line type="monotone" dataKey="accepted" stroke="#34d399" strokeWidth={2} />
            <Line type="monotone" dataKey="rejected" stroke="#fb7185" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function OfferInsightsPanel({ insights = [] }) {
  const iconMap = { success: Sparkles, warning: AlertTriangle, risk: Zap, opportunity: Bot };
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center gap-2">
        <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI-Assisted Offer Insights</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => {
          const Icon = iconMap[insight.type] || Bot;
          return (
            <div key={insight.title} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
              <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">{insight.title}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{insight.description}</p>
              <p className="mt-3 rounded-md bg-slate-100 dark:bg-black/20 p-2 text-xs text-slate-700 dark:text-slate-300">{insight.recommendation}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OfferAutomationRules({ rules = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Automation Center</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rules.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 dark:border-white/10 p-4 text-sm text-slate-500 dark:text-slate-400 xl:col-span-5">
            No automation rules are configured for the selected offer.
          </div>
        ) : rules.map((rule) => (
          <div key={rule.name} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
            <Settings2 className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">{rule.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rule.cadence || rule.channel || "Configured workflow rule"}</p>
            <span className={cn("mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold", rule.enabled ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-500/10 text-slate-700 dark:text-slate-300")}>{rule.enabled ? "Enabled" : "Paused"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PreOnboardingWorkflow({ offer }) {
  const steps = offer?.preOnboarding?.length ? offer.preOnboarding : [
    { step: "Employee Creation", owner: "HR Operations", status: offer?.status === "Accepted" ? "In Progress" : "Pending" },
    { step: "Document Collection", owner: "Candidate", status: "Pending" },
    { step: "Payroll Setup", owner: "Payroll", status: "Pending" },
    { step: "Department Assignment", owner: "Hiring Manager", status: "Pending" },
  ];
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pre-Onboarding Integration</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Offer accepted to employee creation, documents, payroll setup, and department assignment.</p>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step) => (
          <div key={step.step} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
            <Layers className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">{step.step}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.owner}</p>
            <span className={cn("mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold", step.status === "Completed" ? "bg-emerald-500/10 text-emerald-300" : step.status === "In Progress" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" : "bg-slate-500/10 text-slate-700 dark:text-slate-300")}>{step.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const offerTemplates = [
  {
    id: "standard",
    title: "Standard Employment Offer",
    description: "Standard employment contract for regular staff, incorporating candidate details, job role, standard terms, and compensation breakdown.",
  },
  {
    id: "executive",
    title: "Executive Employment Offer",
    description: "Executive contract for leadership positions, including executive benefits, leadership responsibilities, confidentiality/non-compete clauses, and extended notice period.",
  },
];

export function TemplatesPanel({ offers = [], selectedOffer, onPreview }) {
  const isExecutive = useMemo(() => {
    if (!selectedOffer) return false;
    const designation = (selectedOffer.position || "").trim();
    const pattern = /\b(executive|manager|director|head|chief|vp|vice president|president|lead|principal|architect)\b/i;
    return pattern.test(designation);
  }, [selectedOffer]);

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-cyan-500 dark:text-cyan-400 mt-1 shrink-0" strokeWidth={2} />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Offer Templates</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Branded contract templates for different roles.</p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {offerTemplates.map((template) => {
          const recommended = (template.id === "executive" && isExecutive) || (template.id === "standard" && !isExecutive);

          return (
            <div
              key={template.id}
              className={cn(
                "relative rounded-xl flex flex-col justify-between transition-all duration-200",
                recommended
                  ? "border-2 border-cyan-500 dark:border-cyan-500/60 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.045] p-[19px] shadow-md shadow-cyan-500/[0.03] dark:shadow-cyan-950/10"
                  : "border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-white/[0.01] p-5 shadow-sm hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className={cn("h-4 w-4 shrink-0", recommended ? "text-cyan-500" : "text-slate-400 dark:text-slate-500")} />
                    <p className="font-semibold text-slate-850 dark:text-slate-205 text-sm truncate">{template.title}</p>
                  </div>
                  {recommended && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-cyan-500 dark:bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                      Recommended
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-450 dark:text-slate-550 leading-relaxed font-medium mt-2">{template.description}</p>
                
                {recommended && (
                  <div className="mt-4 pt-3 border-t border-slate-150/60 dark:border-slate-850/50">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recommended for</p>
                    <p className="mt-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 truncate">{selectedOffer?.position || "N/A"}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={() => onPreview && onPreview(template.id)}
                  disabled={!selectedOffer}
                  className="h-[38px] px-4 rounded-lg border border-cyan-250/70 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/10 hover:bg-cyan-100/50 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-[13px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-900/50 dark:disabled:border-slate-850 dark:disabled:text-slate-500"
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  Preview Template
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ExportCenter({ onExport }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => onExport("pdf")} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><Download className="mr-2 h-4 w-4" />PDF</Button>
      <Button variant="outline" onClick={() => onExport("excel")} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><Download className="mr-2 h-4 w-4" />Excel</Button>
      <Button variant="outline" onClick={() => onExport("reports")} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><Download className="mr-2 h-4 w-4" />Reports</Button>
    </div>
  );
}

export { OfferLetterPreview, SalaryBreakdownChart };


