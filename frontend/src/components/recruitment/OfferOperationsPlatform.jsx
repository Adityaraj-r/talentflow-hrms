import { useEffect, useState } from "react";
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
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileSignature,
  FileText,
  GitBranch,
  Layers,
  MailCheck,
  MessageSquareText,
  PenLine,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    </Motion.motion.div>
  );
}

export function OfferLifecycleTracker({ offer }) {
  const steps = ["Draft", "HR Review", "Manager Review", "Finance Approval", "HR Manager Approval", "Sent", "Viewed", "Negotiation", "Accepted / Rejected", "Joined"];
  const status = offer?.status || "Draft";
  const activeIndex = status === "Pending CEO Approval" || status === "Pending HR Manager Approval" ? 4 : status === "Offered" ? 5 : status === "Accepted" ? 8 : status === "Declined" ? 8 : 2;
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offer Lifecycle Workflow</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Selection to offer release, negotiation, acceptance, and pre-onboarding.</p>
        </div>
        {offer && <OfferStatusBadge status={offer.status} />}
      </div>
      <div className="custom-scrollbar overflow-x-auto pb-2">
        <div className="flex min-w-[1120px] items-start">
          {steps.map((step, index) => {
            const complete = index < activeIndex || status === "Accepted";
            const active = index === activeIndex;
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <Motion.motion.div animate={{ scale: active ? 1.08 : 1 }} className={cn("grid h-11 w-11 place-items-center rounded-full border", complete && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300", active && "border-cyan-300/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200", !complete && !active && "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-500")}>
                    {complete ? <CheckCircle2 className="h-5 w-5" /> : active ? <Clock3 className="h-5 w-5" /> : <GitBranch className="h-5 w-5" />}
                  </Motion.motion.div>
                  <span className="mt-2 w-24 text-xs font-medium text-slate-700 dark:text-slate-300">{step}</span>
                </div>
                {index < steps.length - 1 && <div className={cn("mx-2 mt-5 h-px flex-1", complete ? "bg-emerald-400/40" : "bg-slate-200 dark:bg-white/10")} />}
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

export function OfferApprovalTimeline({ offer, onAction, canWrite }) {
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
                <p className="font-semibold text-slate-900 dark:text-white">{row.role}</p>
                <span className="rounded-full border border-slate-200 dark:border-white/10 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">{row.action}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{row.comments || "No comments recorded"}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(row.at || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      {canWrite && offer?._id && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => onAction("approve", offer)} className="bg-emerald-400 text-white dark:text-slate-950 hover:bg-emerald-300"><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
          <Button variant="outline" onClick={() => onAction("reject", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><XCircle className="mr-2 h-4 w-4" />Reject</Button>
          <Button variant="outline" onClick={() => onAction("changes", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><PenLine className="mr-2 h-4 w-4" />Request Changes</Button>
          <Button variant="outline" onClick={() => onAction("escalate", offer)} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10"><AlertTriangle className="mr-2 h-4 w-4" />Escalate</Button>
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
          {data.map((item, index) => (
            <div key={item.name} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.name}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatMoney(item.value)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((item.value / Math.max(1, compensation.total)) * 100))}%`, backgroundColor: colors[index % colors.length] }} />
              </div>
            </div>
          ))}
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
            <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", item.priority === "high" ? "bg-amber-300" : item.priority === "success" ? "bg-emerald-300" : "bg-cyan-600 dark:bg-cyan-300")} />
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
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Center</h2>
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white">{notifications.length}</span>
      </div>
      <div className="space-y-3">
        {notifications.slice(0, 7).map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
            <div className="flex items-start gap-3">
              <Bell className={cn("mt-0.5 h-4 w-4", item.priority === "high" ? "text-amber-300" : item.priority === "success" ? "text-emerald-300" : "text-cyan-600 dark:text-cyan-300")} />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CandidateComparisonPanel({ offers = [] }) {
  const candidates = offers.slice(0, 3).map((offer) => ({
    name: offer.candidateName,
    skills: Number(offer.skillsScore ?? offer.matchScore ?? 0),
    experience: Number(offer.experienceScore ?? 0),
    interviews: Number(offer.interviewScore ?? 0),
    salaryFit: Number(offer.salaryFitScore ?? 0),
    recruiterRating: Number(offer.recruiterRating ?? 0),
    expectedSalary: offer.salary,
    offerPackage: offer.compensation?.totalCtc || offer.compensation?.total || offer.salary,
  }));
  const radar = ["skills", "experience", "interviews", "salaryFit", "recruiterRating"].map((metric) => ({
    metric,
    ...Object.fromEntries(candidates.map((candidate) => [candidate.name, candidate[metric]])),
  }));
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Candidate Comparison Tool</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Side-by-side candidate, score, salary, and offer comparison.</p>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {candidates.length === 0 ? (
          <div className="xl:col-span-2 grid min-h-56 place-items-center rounded-md border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400">
            No candidate comparison data available
          </div>
        ) : (
        <>
        <div className="h-72">
          <ResponsiveContainer>
            <RadarChart data={radar}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
              <PolarRadiusAxis stroke="#475569" />
              {candidates.map((candidate, index) => (
                <Radar key={candidate.name} dataKey={candidate.name} stroke={colors[index]} fill={colors[index]} fillOpacity={0.18} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr><th className="px-3 py-2 text-left">Candidate</th><th className="px-3 py-2 text-left">Skills</th><th className="px-3 py-2 text-left">Interview</th><th className="px-3 py-2 text-left">Expected Salary</th><th className="px-3 py-2 text-left">Offer</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {candidates.map((candidate) => (
                <tr key={candidate.name} className="text-slate-700 dark:text-slate-300">
                  <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">{candidate.name}</td>
                  <td className="px-3 py-3">{candidate.skills}</td>
                  <td className="px-3 py-3">{candidate.interviews}</td>
                  <td className="px-3 py-3">{formatMoney(candidate.expectedSalary)}</td>
                  <td className="px-3 py-3">{formatMoney(candidate.offerPackage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
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

export function TemplatesPanel({ offers = [] }) {
  const templates = [...new Set(offers.map((offer) => offer.templateId).filter(Boolean))]
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-5 shadow-xl shadow-black/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Offer Templates</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {templates.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 dark:border-white/10 p-4 text-sm text-slate-500 dark:text-slate-400 md:col-span-3">
            No offer templates are in use yet.
          </div>
        ) : templates.map((template) => (
          <div key={template} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
            <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">{template}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Branded letter structure with compensation, terms, and signature placeholders.</p>
          </div>
        ))}
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
