import { PriorityDot } from "@/components/ui/PriorityDot";
import { useMemo, useState } from "react"
import * as React from "react"
import apiClient from "@/services/apiClient"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"
import * as Motion from "framer-motion"
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Mail,
  MessageSquareText,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CandidateAvatar,
  RecruitmentEmptyState,
  RecruitmentKpiCard,
  RecruitmentSkeleton,
  RecruitmentStatusBadge,
} from "@/components/recruitment/RecruitmentUI"

export const PIPELINE_STAGES = [
  { id: "Applied", label: "Applied", apiStatus: "Applied", accent: "sky", color: "bg-sky-400" },
  { id: "Under Review", label: "Under Review", apiStatus: "Under Review", accent: "indigo", color: "bg-purple-400" },
  { id: "HR Screening", label: "HR Screening", apiStatus: "HR Screening", accent: "purple", color: "bg-purple-400" },
  { id: "Assessment", label: "Assessment", apiStatus: "Assessment", accent: "orange", color: "bg-orange-400" },
  { id: "Interview Round 1", label: "Interview Rd 1", apiStatus: "Interview Round 1", accent: "amber", color: "bg-amber-400" },
  { id: "Interview Round 2", label: "Interview Rd 2", apiStatus: "Interview Round 2", accent: "yellow", color: "bg-yellow-400" },
  { id: "Hiring Manager Review", label: "HM Review", apiStatus: "Hiring Manager Review", accent: "pink", color: "bg-pink-400" },
  { id: "Approved", label: "Approved", apiStatus: "Approved", accent: "teal", color: "bg-teal-400" },
  { id: "Offer Sent", label: "Offer Sent", apiStatus: "Offer Sent", accent: "cyan", color: "bg-cyan-400" },
  { id: "Offer Accepted", label: "Offer Accepted", apiStatus: "Offer Accepted", accent: "green", color: "bg-emerald-500" },
  { id: "Background Verification", label: "BGV Checks", apiStatus: "Background Verification", accent: "rose", color: "bg-rose-500" },
  { id: "Hired", label: "Hired", apiStatus: "Hired", accent: "emerald", color: "bg-emerald-600" },
  { id: "Rejected", label: "Rejected", apiStatus: "Rejected", accent: "rose", color: "bg-rose-600" },
]

const stageAliases = {
  applied: "Applied",
  new: "Applied",
  submitted: "Applied",
  "under review": "Under Review",
  "hr screening": "HR Screening",
  screening: "HR Screening",
  shortlisted: "HR Screening",
  shortlist: "HR Screening",
  assessment: "Assessment",
  "interview round 1": "Interview Round 1",
  "interview rd 1": "Interview Round 1",
  interview: "Interview Round 1",
  "interview scheduled": "Interview Round 1",
  interview_scheduled: "Interview Round 1",
  "interview round 2": "Interview Round 2",
  "interview rd 2": "Interview Round 2",
  "hiring manager review": "Hiring Manager Review",
  "hm review": "Hiring Manager Review",
  approved: "Approved",
  "offer sent": "Offer Sent",
  selected: "Offer Sent",
  offered: "Offer Sent",
  offer: "Offer Sent",
  "offer accepted": "Offer Accepted",
  accepted: "Offer Accepted",
  "background verification": "Background Verification",
  bgv: "Background Verification",
  hired: "Hired",
  rejected: "Rejected",
  declined: "Rejected",
}

const priorities = ["Critical", "High", "Medium", "Low", "Normal"]

const getAtsMatchLabel = (score = 0) => {
  const normalized = Math.min(100, Math.max(0, Number(score) || 0))
  if (normalized >= 90) return "Excellent Match"
  if (normalized >= 75) return "Strong Match"
  if (normalized >= 60) return "Moderate Match"
  return "Weak Match"
}

const getToneClass = (tone) => ({
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  sky: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  indigo: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  purple: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-400/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
  pink: "border-pink-400/30 bg-pink-500/10 text-pink-300",
  teal: "border-teal-400/30 bg-teal-500/10 text-teal-300",
  green: "border-green-400/30 bg-green-500/10 text-green-300",
}[tone] || "border-white/10 bg-muted/10 text-muted-foreground")

const getRiskTone = (risk = "") => {
  if (risk === "Low Risk") return "emerald"
  if (risk === "High Risk") return "rose"
  return "amber"
}

export const normalizePipelineStage = (status) => {
  const key = (status || "").toString().trim().toLowerCase()
  return stageAliases[key] || "Applied"
}

export const enrichCandidate = (app) => {
  const job = app?.jobId || {}
  const role = app?.selectedPositionTitle || app?.hiringRoleName || job?.jobTitle || "Open Role"
  const department = job?.department || app?.department || "Unassigned"
  const matchedSkills = Array.isArray(app?.matchedSkills) ? app.matchedSkills : []
  const missingSkills = Array.isArray(app?.missingSkills) ? app.missingSkills : []
  const skills = Array.isArray(app?.skills)
    ? app.skills
    : typeof app?.skills === "string"
      ? app.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : matchedSkills
  const parsedExperience = Number.parseFloat(app?.experienceYears ?? app?.experience ?? 0)
  const experienceYears = Number.isFinite(parsedExperience) ? parsedExperience : 0
  const matchScore = Number(app?.aiFitScore ?? app?.matchScore ?? app?.score ?? app?.candidateScore ?? 0)
  const explicitRating = Number(app?.rating ?? app?.recruiterRating)
  const rating = Number.isFinite(explicitRating) && explicitRating > 0
    ? Math.min(5, Math.max(0, explicitRating))
    : Number((Math.min(100, Math.max(0, matchScore)) / 20).toFixed(1))
  const stage = normalizePipelineStage(app?.status)
  const createdAt = app?.createdAt ? new Date(app.createdAt) : new Date()
  const interviewDate =
    app?.interviewDate
      ? new Date(app.interviewDate).toLocaleDateString()
      : stage === "Interview" || stage === "Offer" || stage === "Hired"
        ? new Date(createdAt).toLocaleDateString()
      : null

  return {
    ...app,
    stage,
    role,
    department,
    skills,
    recruiter: app?.recruiterName || app?.recruiter || app?.assignedRecruiter || "Unassigned",
    priority: app?.priority || app?.urgency || "Normal",
    experienceYears,
    matchScore,
    rating,
    interviewDate,
    matchedSkills,
    missingSkills,
    aiRank: Number(app?.aiRank) || null,
    recommendationStage: app?.aiRecommendationLabel || app?.recommendationStage || getAtsMatchLabel(matchScore),
    fitSummary: app?.fitSummary || `${matchScore}% fit for ${role}.`,
    scoreFactors: app?.scoreFactors || {
      skills: Number(app?.skillsScore ?? matchScore) || 0,
      experience: Number(app?.experienceScore ?? matchScore) || 0,
      role: Number(app?.roleScore ?? matchScore) || 0,
      education: Number(app?.educationScore ?? 0) || 0,
      resumeQuality: Number(app?.resumeQualityScore ?? 0) || 0,
      requirements: Number(app?.jobRequirementScore ?? matchScore) || 0,
    },
    strengths: Array.isArray(app?.strengths) ? app.strengths : matchedSkills,
    riskLevel: app?.riskLevel || (app?.resume ? "Medium Risk" : "High Risk"),
    riskSignals: Array.isArray(app?.riskSignals) ? app.riskSignals : [],
    hiringProbability: Number(app?.hiringProbability ?? matchScore) || 0,
    hiringProbabilityLabel: app?.hiringProbabilityLabel || (matchScore >= 75 ? "Likely Hire" : matchScore >= 55 ? "Potential Hire" : "Uncertain"),
    suggestedNextAction: app?.suggestedNextAction || (matchScore >= 75 ? "Schedule Interview" : matchScore >= 60 ? "Move To Screening" : "Manual Review"),
    duplicateFlag: Boolean(app?.duplicateFlag),
  }
}

export function SkillTags({ skills = [], limit = 3 }) {
  const visible = skills.slice(0, limit)
  const hidden = skills.length - visible.length
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((skill) => (
        <span key={skill} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {skill}
        </span>
      ))}
      {hidden > 0 && (
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{hidden}
        </span>
      )}
    </div>
  )
}

export function RecruiterAvatarGroup({ names = [] }) {
  const visible = names.filter(Boolean).slice(0, 3)
  return (
    <div className="flex -space-x-2">
      {visible.map((name) => (
        <span
          key={name}
          title={name}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-semibold"
        >
          {name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
      ))}
    </div>
  )
}

export function MatchScoreBadge({ score = 0, size = "sm" }) {
  const normalized = Math.min(100, Math.max(0, Number(score) || 0))
  const label = getAtsMatchLabel(normalized)
  const color = normalized >= 75 ? "text-emerald-300" : normalized >= 60 ? "text-amber-300" : "text-rose-300"
  const ring = `conic-gradient(currentColor ${normalized * 3.6}deg, rgb(255 255 255 / 0.09) 0deg)`

  return (
    <div
      className={cn(
        "inline-flex min-w-[76px] shrink-0 items-center justify-end gap-2 overflow-hidden",
        size === "lg" && "min-w-[132px]",
        color
      )}
      aria-label={`${normalized}% ${label}`}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full",
          size === "lg" ? "h-16 w-16" : "h-9 w-9"
        )}
        style={{ background: ring }}
      >
        <span className={cn("grid place-items-center rounded-full bg-card font-semibold text-foreground", size === "lg" ? "h-12 w-12 text-sm" : "h-7 w-7 text-[10px]")}>
          {normalized}%
        </span>
      </span>
      <span className="min-w-0 text-right text-[11px] font-semibold leading-tight text-foreground">
        <span className="block whitespace-normal">{label}</span>
      </span>
    </div>
  )
}


export function PipelineFilters({ filters, onChange, options, onSaveFilter, savedFilters, onApplySavedFilter }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
   <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
       <div className="relative">
         <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
         <Input
           value={filters.search}
           onChange={(e) => set("search", e.target.value)}
           placeholder="Search candidate, role..."
           className="pl-9 h-9 w-full"
         />
       </div>
       <FilterSelect label="Recruiter" value={filters.recruiter} onChange={(v) => set("recruiter", v)} options={options.recruiters} />
       <FilterSelect label="Department" value={filters.department} onChange={(v) => set("department", v)} options={options.departments} />
       <FilterSelect label="Role" value={filters.role} onChange={(v) => set("role", v)} options={options.roles} />
     </div>
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <FilterSelect label="Stage" value={filters.stage} onChange={(v) => set("stage", v)} options={PIPELINE_STAGES.map(s => s.id)} />
       <FilterSelect label="Experience" value={filters.experience} onChange={(v) => set("experience", v)} options={["0-2 years", "3-5 years", "6+ years"]} />
       <FilterSelect label="Priority" value={filters.priority} onChange={(v) => set("priority", v)} options={priorities} />
       <Button type="button" variant="outline" onClick={onSaveFilter} className="h-9 w-full">Save Filter</Button>
     </div>
     {savedFilters.length > 0 && (
       <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
         <span>Saved:</span>
         {savedFilters.map((saved, index) => (
           <button key={index} type="button" onClick={() => onApplySavedFilter(saved.filters)} className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-muted cursor-pointer">
             {saved.label}
           </button>
         ))}
       </div>
     )}
   </section>
  )
}

function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50 cursor-pointer"
      >
        <option value="All">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

export function PipelineInsightsPanel({ candidates }) {
  const interviewCount = candidates.filter((c) => c.stage === "Interview").length
  const rejectedCount = candidates.filter((c) => c.stage === "Rejected").length
  const highScore = candidates.filter((c) => c.matchScore >= 85).length
  const moderateMatches = candidates.filter((c) => c.recommendationStage === "Moderate Match").length
  const strongMatches = candidates.filter((c) => ["Excellent Match", "Strong Match"].includes(c.recommendationStage)).length
  const topRole = candidates.reduce((acc, candidate) => {
    const role = candidate.role || "selected roles"
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})
  const roleLabel = Object.entries(topRole).sort((a, b) => b[1] - a[1])[0]?.[0] || "selected role"
  const total = candidates.length || 1

  const insights = [
    {
      icon: TrendingDown,
      title: "Stage drop-off watch",
      text: `${Math.round((rejectedCount / total) * 100)}% of visible candidates are closed as rejected.`,
      tone: "rose",
    },
    {
      icon: TrendingUp,
      title: "Interview momentum",
      text: `${interviewCount} candidates are ready for interview coordination.`,
      tone: "amber",
    },
    {
      icon: Sparkles,
      title: "Resume fit intelligence",
      text: `${strongMatches} strong matches and ${moderateMatches} moderate matches for ${roleLabel}. ${highScore} profiles score above 85%.`,
      tone: "emerald",
    },
  ]

  return (
    <aside className="rounded-lg border border-white/10 bg-card/80 p-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-semibold">Pipeline Intelligence</h2>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {insights.map(({ icon, title, text, tone }) => (
          <div key={title} className="rounded-lg border border-white/10 bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              {React.createElement(icon, { className: cn("h-4 w-4", tone === "rose" && "text-rose-300", tone === "amber" && "text-amber-300", tone === "emerald" && "text-emerald-300") })}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
            </div>
            <p className="mt-2 text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function AtsRecommendationWidgets({ candidates }) {
  const ranked = [...candidates].sort((a, b) => {
    const scoreDelta = Number(b.matchScore || 0) - Number(a.matchScore || 0)
    if (scoreDelta) return scoreDelta
    const experienceDelta = Number(b.scoreFactors?.experience || 0) - Number(a.scoreFactors?.experience || 0)
    if (experienceDelta) return experienceDelta
    return Number(b.scoreFactors?.skills || 0) - Number(a.scoreFactors?.skills || 0)
  })
  const priorityQueue = ranked
    .filter((candidate) => ["Interview", "Screening"].includes(candidate.stage) || candidate.matchScore >= 60)
    .slice(0, 5)

  return (
    <div className="rounded-lg border border-white/10 bg-card/80 p-4">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-amber-300" />
        <h2 className="text-sm font-semibold">Interview Priority Queue</h2>
      </div>
      <div className="space-y-2">
        {priorityQueue.length ? priorityQueue.slice(0, 3).map((candidate, index) => (
          <div key={candidate._id} className="rounded-lg border border-white/10 bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority {index + 1}</span>
              <span className="text-xs font-semibold text-amber-300">{candidate.hiringProbability}% probability</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold">{candidate.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{candidate.suggestedNextAction}</p>
          </div>
        )) : (
          <p className="rounded-lg border border-dashed border-white/15 bg-muted/10 p-4 text-sm text-muted-foreground">No interview-ready candidates in the current view.</p>
        )}
      </div>
    </div>
  )
}

export function CandidateTimeline({ candidate }) {
  const currentIndex = PIPELINE_STAGES.findIndex((stage) => stage.id === candidate.stage)
  return (
    <div className="space-y-3">
      {PIPELINE_STAGES.filter((stage) => stage.id !== "Rejected" || candidate.stage === "Rejected").map((stage, index) => {
        const active = candidate.stage === stage.id
        const complete = index < currentIndex || candidate.stage === "Hired"
        return (
          <div key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("h-3 w-3 rounded-full border", active || complete ? stage.color : "bg-muted")} />
              {index < PIPELINE_STAGES.length - 1 && <span className="mt-1 h-8 w-px bg-border" />}
            </div>
            <div>
              <p className={cn("text-sm font-medium", active && "text-primary")}>{stage.label}</p>
              <p className="text-xs text-muted-foreground">{active ? "Current workflow stage" : complete ? "Completed" : "Upcoming"}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CandidateDrawer({ candidate, open, onClose, uploadBaseUrl, onRefresh }) {
  // Local state for Evaluation Form
  const [evaluationForm, setEvaluationForm] = useState({
    round: "Interview Round 1",
    rating: 5,
    feedback: "",
    recommendation: "Recommended"
  });
  const [evaluating, setEvaluating] = useState(false);

  // Local state for BGV updates
  const bgv = candidate?.backgroundVerification || {};
  const [bgvChecks, setBgvChecks] = useState({
    identity: bgv.checks?.identity || "Pending",
    education: bgv.checks?.education || "Pending",
    employment: bgv.checks?.employment || "Pending",
    criminal: bgv.checks?.criminal || "Pending",
  });
  const [bgvNotes, setBgvNotes] = useState(bgv.notes || "");
  const [bgvStatus, setBgvStatus] = useState(bgv.status || "Pending");
  const [savingBgv, setSavingBgv] = useState(false);

  // Sync state when candidate changes
  React.useEffect(() => {
    if (candidate) {
      const freshBgv = candidate.backgroundVerification || {};
      setBgvChecks({
        identity: freshBgv.checks?.identity || "Pending",
        education: freshBgv.checks?.education || "Pending",
        employment: freshBgv.checks?.employment || "Pending",
        criminal: freshBgv.checks?.criminal || "Pending",
      });
      setBgvNotes(freshBgv.notes || "");
      setBgvStatus(freshBgv.status || "Pending");
    }
  }, [candidate]);

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      await apiClient.post(`/applications/${candidate._id}/evaluate`, evaluationForm);
      toast.success("Interview evaluation scorecard submitted successfully");
      setEvaluationForm({ round: "Interview Round 1", rating: 5, feedback: "", recommendation: "Recommended" });
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const handleBgvSubmit = async (e) => {
    e.preventDefault();
    setSavingBgv(true);
    try {
      await apiClient.put(`/applications/${candidate._id}/bgv`, {
        checks: bgvChecks,
        notes: bgvNotes,
        status: bgvStatus
      });
      toast.success("Background verification checks updated successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update BGV details");
    } finally {
      setSavingBgv(false);
    }
  };

  return (
    <AnimatePresence>
      {open && candidate && (
        <>
          <Motion.motion.button
            aria-label="Close candidate drawer overlay"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <Motion.motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${candidate.name} candidate details`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-white/10 bg-background shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <CandidateAvatar name={candidate.name} />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{candidate.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{candidate.role} - {candidate.department}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close candidate drawer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={Mail} label="Email" value={candidate.email || "Not provided"} />
                <InfoTile icon={BriefcaseBusiness} label="Experience" value={`${candidate.experienceYears} years`} />
                <InfoTile icon={UserRound} label="Recruiter" value={candidate.recruiter} />
                <InfoTile icon={CalendarClock} label="Interview" value={candidate.interviewDate || "Not scheduled"} />
              </div>

              <div className="rounded-lg border border-white/10 bg-card/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Resume Fit Score</p>
                    <p className="text-xs text-muted-foreground">{candidate.fitSummary}</p>
                  </div>
                  <MatchScoreBadge score={candidate.matchScore} size="lg" />
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">Recommended action</span>
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", getToneClass(candidate.matchScore >= 75 ? "emerald" : candidate.matchScore >= 60 ? "amber" : "rose"))}>
                      {candidate.suggestedNextAction}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {Object.entries(candidate.scoreFactors).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{label.replace(/([A-Z])/g, " $1")} match</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile icon={Sparkles} label="AI Rank" value={candidate.aiRank ? `#${candidate.aiRank}` : "Pending"} />
                <InfoTile icon={BadgeCheck} label="Hiring Probability" value={`${candidate.hiringProbability}% ${candidate.hiringProbabilityLabel}`} />
                <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                  <div className="text-xs text-muted-foreground">Resume Risk</div>
                  <span className={cn("mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", getToneClass(getRiskTone(candidate.riskLevel)))}>
                    {candidate.riskLevel}
                  </span>
                </div>
              </div>

              <DrawerSection title="Skill Breakdown" icon={ShieldCheck}>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strengths</p>
                    <SkillTags skills={candidate.strengths.length ? candidate.strengths : candidate.skills} limit={(candidate.strengths.length ? candidate.strengths : candidate.skills).length} />
                  </div>
                  {candidate.missingSkills.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing</p>
                      <SkillTags skills={candidate.missingSkills} limit={candidate.missingSkills.length} />
                    </div>
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="Resume Risk Signals" icon={ShieldCheck}>
                {candidate.riskSignals.length ? (
                  <SkillTags skills={candidate.riskSignals} limit={candidate.riskSignals.length} />
                ) : (
                  <p className="text-sm text-muted-foreground">No material resume risks detected.</p>
                )}
              </DrawerSection>

              <DrawerSection title="Interview Evaluations" icon={NotebookPen}>
                <div className="space-y-4">
                  {candidate.interviewEvaluations && candidate.interviewEvaluations.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.interviewEvaluations.map((evalItem, idx) => (
                        <div key={idx} className="rounded-lg border border-white/5 bg-muted/20 p-3 text-sm space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>{evalItem.round}</span>
                            <span className="text-primary">{evalItem.rating}/5 ⭐</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Evaluated by {evalItem.interviewerName} on {new Date(evalItem.evaluatedAt).toLocaleDateString()}
                          </div>
                          <div className="mt-1 text-xs italic text-foreground">
                            "{evalItem.feedback || "No feedback comments."}"
                          </div>
                          <div className="mt-1">
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border", 
                              evalItem.recommendation === "Recommended" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                              evalItem.recommendation === "Borderline" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" :
                              "border-rose-500/30 bg-rose-500/10 text-rose-300"
                            )}>
                              {evalItem.recommendation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No interview evaluations logged yet.</p>
                  )}

                  <form onSubmit={handleEvaluationSubmit} className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submit Evaluation</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Round</label>
                        <select 
                          value={evaluationForm.round}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, round: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Interview Round 1">Technical Round 1</option>
                          <option value="Interview Round 2">Technical Round 2</option>
                          <option value="Hiring Manager Review">Hiring Manager Review</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Recommendation</label>
                        <select 
                          value={evaluationForm.recommendation}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendation: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Recommended">Recommended</option>
                          <option value="Borderline">Borderline</option>
                          <option value="Not Recommended">Not Recommended</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Rating (1-5)</label>
                        <select 
                          value={evaluationForm.rating}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, rating: Number(e.target.value) })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase">Feedback Notes</label>
                      <textarea
                        value={evaluationForm.feedback}
                        onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })}
                        placeholder="Enter feedback comments..."
                        rows={2}
                        className="w-full rounded-md border border-white/10 bg-background p-2 text-xs text-foreground outline-none resize-none"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full" disabled={evaluating}>
                      {evaluating ? "Submitting..." : "Log Evaluation Scorecard"}
                    </Button>
                  </form>
                </div>
              </DrawerSection>

              {candidate.stage === "Background Verification" && (
                <DrawerSection title="Background Verification Checks" icon={BadgeCheck}>
                  <form onSubmit={handleBgvSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-medium">Identity Check</label>
                        <select
                          value={bgvChecks.identity}
                          onChange={(e) => setBgvChecks({ ...bgvChecks, identity: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Passed">✅ Passed</option>
                          <option value="Failed">❌ Failed</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-medium">Education Check</label>
                        <select
                          value={bgvChecks.education}
                          onChange={(e) => setBgvChecks({ ...bgvChecks, education: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Passed">✅ Passed</option>
                          <option value="Failed">❌ Failed</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-medium">Employment Check</label>
                        <select
                          value={bgvChecks.employment}
                          onChange={(e) => setBgvChecks({ ...bgvChecks, employment: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Passed">✅ Passed</option>
                          <option value="Failed">❌ Failed</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-medium">Criminal Check</label>
                        <select
                          value={bgvChecks.criminal}
                          onChange={(e) => setBgvChecks({ ...bgvChecks, criminal: e.target.value })}
                          className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-foreground outline-none"
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Passed">✅ Passed</option>
                          <option value="Failed">❌ Failed</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-medium">Overall BGV Status Override</label>
                      <select
                        value={bgvStatus}
                        onChange={(e) => setBgvStatus(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-background px-2 py-1.5 text-xs text-foreground font-semibold outline-none"
                      >
                        <option value="Pending">Pending Checks</option>
                        <option value="In Progress">Checks in Progress</option>
                        <option value="Passed">Approved (Verification Passed)</option>
                        <option value="Failed">Rejected (Verification Failed)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-medium">BGV Audit Notes</label>
                      <textarea
                        value={bgvNotes}
                        onChange={(e) => setBgvNotes(e.target.value)}
                        placeholder="Log checklist audit details..."
                        rows={2}
                        className="w-full rounded-md border border-white/10 bg-background p-2 text-xs text-foreground outline-none resize-none"
                      />
                    </div>

                    <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold" disabled={savingBgv}>
                      {savingBgv ? "Saving..." : "Update BGV Checklist"}
                    </Button>
                  </form>
                </DrawerSection>
              )}

              <DrawerSection title="Interview Timeline" icon={Clock3}>
                <CandidateTimeline candidate={candidate} />
              </DrawerSection>

              <DrawerSection title="Resume Preview" icon={FileText}>
                {candidate.resume ? (
                  <a href={`${uploadBaseUrl}/uploads/${candidate.resume}`} target="_blank" rel="noreferrer">
                    <Button variant="outline">Open Resume</Button>
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No resume file is attached to this candidate.</p>
                )}
              </DrawerSection>

              <DrawerSection title="Notes" icon={NotebookPen}>
                <p className="text-sm text-muted-foreground">{candidate.fitSummary} Validate availability, compensation expectations, and notice period in the next recruiter touchpoint.</p>
              </DrawerSection>

              <DrawerSection title="Communication Log" icon={MessageSquareText}>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Application received and profile parsed.</p>
                  <p>Recruiter assigned: {candidate.recruiter}.</p>
                  <p>Status updated to {candidate.stage}.</p>
                </div>
              </DrawerSection>
            </div>
          </Motion.motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {React.createElement(icon, { className: "h-3.5 w-3.5" })}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  )
}

function DrawerSection({ title, icon, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-card/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

export function CandidateCard({ candidate, onOpen, canDrag = true, dragging = false }) {
  const [expanded, setExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate._id,
    data: { type: "candidate", candidate },
    disabled: !canDrag,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    contentVisibility: "auto",
    containIntrinsicSize: "180px",
  }

  return (
    <Motion.motion.article
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ y: -3 }}
      className={cn(
        "group rounded-lg border border-white/10 bg-card/90 p-3 shadow-sm outline-none transition-all",
        "hover:border-white/20 hover:shadow-lg hover:shadow-black/20 focus-within:ring-2 focus-within:ring-ring",
        (isDragging || dragging) && "border-cyan-300/60 bg-cyan-500/10 shadow-cyan-500/20"
      )}
      aria-label={`${candidate.name}, ${candidate.role}, ${candidate.stage}`}
    >
      <button
        type="button"
        className="w-full text-left focus:outline-none cursor-pointer hover:cursor-grab active:cursor-grabbing"
        onClick={() => onOpen(candidate)}
        {...(canDrag ? attributes : {})}
        {...(canDrag ? listeners : {})}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CandidateAvatar name={candidate.name} />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{candidate.aiRank ? `#${candidate.aiRank} ` : ""}{candidate.name}</h3>
              <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
            </div>
          </div>
          <MatchScoreBadge score={candidate.matchScore} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{candidate.experienceYears} yrs exp</span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            {candidate.rating.toFixed(1)}
          </span>
        </div>
        <div className="mt-3">
          <SkillTags skills={candidate.skills} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <RecruitmentStatusBadge status={candidate.stage} />
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", getToneClass(getRiskTone(candidate.riskLevel)))}>
            {candidate.riskLevel}
          </span>
        </div>
        <div className="mt-3 rounded-md border border-white/10 bg-muted/10 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">ATS recommendation</span>
            <span className={cn(
              "font-semibold",
              candidate.matchScore >= 75 && "text-emerald-300",
              candidate.matchScore >= 60 && candidate.matchScore < 75 && "text-amber-300",
              candidate.matchScore < 60 && "text-rose-300"
            )}>
              {candidate.recommendationStage}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Next action</span>
            <span className="font-semibold text-foreground">{candidate.suggestedNextAction}</span>
          </div>
          {candidate.duplicateFlag && (
            <div className="mt-2 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300">
              Possible Duplicate
            </div>
          )}
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1">{candidate.interviewDate ? `Interview ${candidate.interviewDate}` : <><PriorityDot priority={candidate.priority} className="w-auto" /> Priority</>}</span>
        <button
          type="button"
          className="text-xs font-medium text-primary outline-none hover:underline focus:ring-2 focus:ring-ring cursor-pointer"
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((prev) => !prev)
          }}
        >
          {expanded ? "Less" : "Preview"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <Motion.motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-md border border-white/10 bg-muted/10 p-3 text-xs text-muted-foreground">
              Recruiter {candidate.recruiter} is tracking this candidate for {candidate.department}. Next best action: validate availability and compensation fit.
            </div>
          </Motion.motion.div>
        )}
      </AnimatePresence>
    </Motion.motion.article>
  )
}

export function PipelineColumn({ stage, candidates, onOpen, activeStage, canWrite }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: "stage", stage },
  })
  

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex max-h-[calc(100vh-310px)] min-h-[520px] w-[320px] shrink-0 flex-col rounded-lg border border-border bg-card/50 transition-colors",
        (isOver || activeStage === stage.id) && "border-primary/50 bg-primary/5"
      )}
      aria-label={`${stage.label} stage`}
    >
      <header className="sticky top-0 z-10 rounded-t-lg border-b border-border bg-card/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
            <h2 className="text-sm font-semibold">{stage.label}</h2>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{candidates.length}</span>
        </div>
        
      </header>
      <SortableContext items={candidates.map((candidate) => candidate._id)} strategy={verticalListSortingStrategy}>
        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
          {candidates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-muted/10 p-5 text-center text-sm text-muted-foreground">
              Drop candidates here
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard key={candidate._id} candidate={candidate} onOpen={onOpen} canDrag={canWrite} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  )
}

export function PipelineBoard({ candidates, onMoveCandidate, onOpenCandidate, canWrite, loading }) {
  const [activeCandidate, setActiveCandidate] = useState(null)
  const [activeStage, setActiveStage] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const grouped = useMemo(() => {
    const initial = PIPELINE_STAGES.reduce((acc, stage) => ({ ...acc, [stage.id]: [] }), {})
    candidates.forEach((candidate) => {
      const stage = normalizePipelineStage(candidate.stage)
      initial[stage].push(candidate)
    })
    return initial
  }, [candidates])

  const findCandidate = (id) => candidates.find((candidate) => candidate._id === id)
  const findStageForId = (id) => {
    if (PIPELINE_STAGES.some((stage) => stage.id === id)) return id
    return findCandidate(id)?.stage
  }

  if (loading) return <RecruitmentSkeleton type="table" rows={8} />

  if (candidates.length === 0) {
    return (
      <RecruitmentEmptyState
        title="No candidates in this pipeline"
        description="Candidates will appear as draggable cards once applications match your filters."
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => {
        if (!canWrite) return
        const candidate = findCandidate(active.id)
        setActiveCandidate(candidate || null)
        setActiveStage(candidate?.stage || null)
      }}
      onDragOver={({ over }) => {
        if (!canWrite || !over) return
        setActiveStage(findStageForId(over.id))
      }}
      onDragCancel={() => {
        setActiveCandidate(null)
        setActiveStage(null)
      }}
      onDragEnd={({ active, over }) => {
        if (!canWrite) return
        setActiveCandidate(null)
        setActiveStage(null)
        if (!over || active.id === over.id) return
        const candidate = findCandidate(active.id)
        const targetStage = findStageForId(over.id)
        if (!candidate || !targetStage || candidate.stage === targetStage) return
        onMoveCandidate(candidate, targetStage)
      }}
    >
      <div className="custom-scrollbar -mx-1 overflow-x-auto pb-3">
        <div className="flex min-w-max gap-4 px-1">
          {PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              candidates={grouped[stage.id] || []}
              onOpen={onOpenCandidate}
              activeStage={activeStage}
              canWrite={canWrite}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeCandidate ? <CandidateDragPreview candidate={activeCandidate} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function CandidateDragPreview({ candidate }) {
  return (
    <div className="w-[296px] rounded-lg border border-cyan-300/60 bg-card p-3 shadow-2xl shadow-cyan-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CandidateAvatar name={candidate.name} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{candidate.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
          </div>
        </div>
        <MatchScoreBadge score={candidate.matchScore} />
      </div>
      <div className="mt-3">
        <SkillTags skills={candidate.skills} />
      </div>
    </div>
  )
}

export function PipelineAnalytics({ candidates, activeStage = "All", onSelectStage }) {
  const total = candidates.length
  const hired = candidates.filter((candidate) => candidate.stage === "Hired").length
  const interview = candidates.filter((candidate) => (candidate.stage || "").includes("Interview") || candidate.stage === "HR Screening").length
  const rejected = candidates.filter((candidate) => candidate.stage === "Rejected").length
  const offer = candidates.filter((candidate) => (candidate.stage || "").includes("Offer")).length
  const conversion = total ? Math.round(((hired + offer) / total) * 100) : 0
  const interviewSuccess = interview + offer + hired ? Math.round(((offer + hired) / (interview + offer + hired)) * 100) : 0
  const dropOff = total ? Math.round((rejected / total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <RecruitmentKpiCard
          title="Total Candidates"
          value={total}
          icon={Users}
          helper="Click to view all"
          accent="sky"
          active={activeStage === "All"}
          onClick={() => onSelectStage?.("All")}
        />
        <RecruitmentKpiCard
          title="Conversion Rate"
          value={`${conversion}%`}
          icon={BadgeCheck}
          helper="Click to view Hired"
          accent="emerald"
          active={activeStage === "Hired"}
          onClick={() => onSelectStage?.("Hired")}
        />
        <RecruitmentKpiCard
          title="Avg Stage Age"
          value={`${averageStageAge(candidates)}d`}
          icon={Clock3}
          helper="Click to view Applied"
          accent="cyan"
          active={activeStage === "Applied"}
          onClick={() => onSelectStage?.("Applied")}
        />
        <RecruitmentKpiCard
          title="Stage Drop-off"
          value={`${dropOff}%`}
          icon={TrendingDown}
          helper="Click to view Rejected"
          accent="rose"
          active={activeStage === "Rejected"}
          onClick={() => onSelectStage?.("Rejected")}
        />
        <RecruitmentKpiCard
          title="Hiring Velocity"
          value={`${hired + offer}`}
          icon={TrendingUp}
          helper="Click to view Offer Sent"
          accent="violet"
          active={activeStage === "Offer Sent"}
          onClick={() => onSelectStage?.("Offer Sent")}
        />
        <RecruitmentKpiCard
          title="Interview Success"
          value={`${interviewSuccess}%`}
          icon={Sparkles}
          helper="Click to view Rd 1"
          accent="amber"
          active={activeStage === "Interview Round 1"}
          onClick={() => onSelectStage?.("Interview Round 1")}
        />
      </div>
    </div>
  )
}

function averageStageAge(candidates = []) {
  const dated = candidates
    .map((candidate) => new Date(candidate.updatedAt || candidate.createdAt).getTime())
    .filter((time) => Number.isFinite(time))
  if (!dated.length) return 0
  const dayMs = 1000 * 60 * 60 * 24
  return Math.round(dated.reduce((sum, time) => sum + Math.max(0, Date.now() - time) / dayMs, 0) / dated.length)
}
