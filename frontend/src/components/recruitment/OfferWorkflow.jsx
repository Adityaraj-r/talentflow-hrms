import * as React from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { AnimatePresence } from "framer-motion"
import * as Motion from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  Eye,
  FileSignature,
  FileText,
  Filter,
  MailCheck,
  MessageSquareText,
  MoreHorizontal,
  NotebookPen,
  PenLine,
  RefreshCcw,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CandidateAvatar, RecruitmentEmptyState, RecruitmentKpiCard, RecruitmentStatusBadge } from "@/components/recruitment/RecruitmentUI"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export const OFFER_WORKFLOW_STEPS = [
  { id: "Draft", label: "Draft", icon: FileText, statuses: ["Draft"] },
  { id: "HR Review", label: "HR Review", icon: ShieldCheck, statuses: ["Under Review"] },
  { id: "Manager Approval", label: "Manager Approval", icon: Users, statuses: ["Manager Approval"] },
  { id: "HR Manager Approval", label: "HR Manager Approval", icon: BadgeCheck, statuses: ["Pending HR Manager Approval", "Pending CEO Approval"] },
  { id: "Offer Released", label: "Offer Released", icon: Send, statuses: ["Offered", "Sent", "Viewed"] },
  { id: "Candidate Decision", label: "Candidate Decision", icon: CheckCircle2, statuses: ["Accepted", "Declined", "Rejected", "Expired"] },
]

const colors = ["#38bdf8", "#8b5cf6", "#22c55e", "#f59e0b", "#f43f5e", "#14b8a6"]

export const canonicalOfferStatus = (status = "") => {
  const value = status.toString().trim().toLowerCase()
  if (value === "pending hr manager approval" || value === "pending hr approval") return "Pending HR Manager Approval"
  if (value === "pending ceo approval" || value === "pending ceo") return "Pending CEO Approval"
  if (value === "offered" || value === "sent" || value === "offer released") return "Offered"
  if (value === "accepted") return "Accepted"
  if (value === "declined" || value === "rejected") return "Declined"
  if (value === "changes requested" || value === "change requested") return "Changes Requested"
  if (value === "expired") return "Expired"
  if (value === "joined") return "Joined"
  if (value === "draft") return "Draft"
  if (value === "under review") return "Under Review"
  return status || "Draft"
}

export const enrichOffer = (offer) => {
  const salary = Number(offer?.salary) || 0
  const backendComp = offer?.compensation || {}
  const base = Number(backendComp.fixedSalary ?? backendComp.base ?? Math.round(salary * 0.72))
  const bonus = Number(backendComp.bonus ?? offer?.bonus ?? Math.round(salary * 0.1))
  const allowances = Number(backendComp.allowances ?? Math.round(salary * 0.12))
  const stock = Number(backendComp.stockOptions ?? backendComp.stock ?? 0)
  const joiningBonus = Number(backendComp.joiningBonus ?? 0)
  const deductions = Number(backendComp.deductions ?? 0)
  const expiryDate = offer?.expiryDate ? new Date(offer.expiryDate) : null
  const status = canonicalOfferStatus(offer?.status)

  let stage = offer?.approvalStage
  if (status === "Joined" || status === "Accepted") {
    stage = "Completed"
  } else if (status === "Declined" || status === "Expired") {
    stage = "Closed"
  } else if (!stage || stage === "Draft") {
    stage = ["Pending CEO Approval", "Pending HR Manager Approval"].includes(status)
      ? "HR Manager Approval"
      : status === "Offered"
      ? "Sent"
      : "Draft"
  }

  return {
    ...offer,
    status,
    position: offer?.position || "Unassigned role",
    department: offer?.department || "Unassigned",
    recruiter: offer?.recruiterName || offer?.recruiter || offer?.createdBy?.firstName || "Unassigned",
    approvalStage: stage,
    lastUpdated: offer?.updatedAt || offer?.createdAt || new Date().toISOString(),
    expiryDate: expiryDate?.toISOString?.() || "",
    responseTimeDays: calculateResponseDays(offer),
    compensation: {
      base,
      bonus,
      allowances,
      stock,
      joiningBonus,
      deductions,
      total: salary + bonus + allowances + stock + joiningBonus - deductions,
    },
  }
}

function calculateResponseDays(offer) {
  if (!offer?.createdAt || !offer?.updatedAt) return 0
  const created = new Date(offer.createdAt).getTime()
  const updated = new Date(offer.updatedAt).getTime()
  if (!Number.isFinite(created) || !Number.isFinite(updated)) return 0
  return Math.max(0, Math.round((updated - created) / 86400000))
}

const formatMoney = (amount = 0) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`

export function OfferStatusBadge({ status, className }) {
  const canonical = canonicalOfferStatus(status)
  let style = ""

  if (canonical === "Pending CEO Approval" || canonical === "Pending HR Manager Approval" || canonical === "Under Review" || canonical === "Pending" || canonical === "Changes Requested") {
    style = "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
  } else if (canonical === "Offered" || canonical === "Sent" || canonical === "Viewed" || canonical === "Released") {
    style = "border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
  } else if (canonical === "Accepted" || canonical === "Approved" || canonical === "Joined") {
    style = "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  } else if (canonical === "Declined" || canonical === "Rejected") {
    style = "border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
  } else if (canonical === "Expired") {
    style = "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400"
  } else {
    style = "border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
  }

  const Icon = canonical === "Accepted" || canonical === "Approved" || canonical === "Joined" ? CheckCircle2 : canonical === "Declined" || canonical === "Rejected" ? XCircle : canonical === "Expired" ? Clock3 : canonical === "Offered" || canonical === "Sent" || canonical === "Released" ? Send : Clock3

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 h-5", style, className)}>
      {React.createElement(Icon, { className: "h-3 w-3 shrink-0" })}
      {canonical}
    </span>
  )
}

export function OfferAnalyticsCard(props) {
  return <RecruitmentKpiCard {...props} />
}

export function OfferDashboardAnalytics({ offers, activeStatus = "All", onSelectStatus }) {
  const total = offers.length
  const pending = offers.filter((offer) => offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval" || (offer.status || "").includes("Pending")).length
  const accepted = offers.filter((offer) => offer.status === "Accepted").length
  const declined = offers.filter((offer) => offer.status === "Declined").length
  const acceptance = total ? Math.round((accepted / total) * 100) : 0
  const avgSalary = total ? Math.round(offers.reduce((sum, offer) => sum + Number(offer.salary || 0), 0) / total) : 0
  const expiryAlerts = offers.filter((offer) => {
    const days = (new Date(offer.expiryDate).getTime() - Date.now()) / 86400000
    return days >= 0 && days <= 3 && offer.status === "Offered"
  }).length

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <OfferAnalyticsCard
        title="Total Offers"
        value={total}
        icon={FileSignature}
        trend={11}
        helper="Click to view all"
        accent="sky"
        active={activeStatus === "All" || !activeStatus}
        onClick={() => onSelectStatus?.("All")}
      />
      <OfferAnalyticsCard
        title="Pending Approvals"
        value={pending}
        icon={Clock3}
        trend={4}
        helper="Click to view pending"
        accent="amber"
        active={activeStatus === "Pending"}
        onClick={() => onSelectStatus?.("Pending")}
      />
      <OfferAnalyticsCard
        title="Accepted Offers"
        value={accepted}
        icon={CheckCircle2}
        trend={18}
        helper="Click to view accepted"
        accent="emerald"
        active={activeStatus === "Accepted"}
        onClick={() => onSelectStatus?.("Accepted")}
      />
      <OfferAnalyticsCard
        title="Declined Offers"
        value={declined}
        icon={XCircle}
        trend={-3}
        helper="Click to view declined"
        accent="rose"
        active={activeStatus === "Declined"}
        onClick={() => onSelectStatus?.("Declined")}
      />
      <OfferAnalyticsCard
        title="Acceptance Rate"
        value={`${acceptance}%`}
        icon={TrendingUp}
        trend={7}
        helper="Click to view accepted"
        accent="violet"
        active={activeStatus === "Accepted"}
        onClick={() => onSelectStatus?.("Accepted")}
      />
      <OfferAnalyticsCard
        title="Expiry Alerts"
        value={expiryAlerts}
        icon={CalendarClock}
        trend={-2}
        helper="Click to view offered"
        accent="amber"
        active={activeStatus === "Offered"}
        onClick={() => onSelectStatus?.("Offered")}
      />
    </div>
  )
}

export function OfferWorkflowTracker({ offer }) {
  const status = canonicalOfferStatus(offer?.status)
  const activeIndex =
    status === "Joined" ? 6 :
    status === "Pending CEO Approval" || status === "Pending HR Manager Approval" ? 3 :
    status === "Offered" ? 4 :
    status === "Accepted" || status === "Declined" ? 5 :
    2

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Offer Workflow</h2>
          <p className="text-xs text-muted-foreground">Configurable approval lifecycle with live status checkpoints.</p>
        </div>
        {offer && <OfferStatusBadge status={offer.status} />}
      </div>
      <div className="custom-scrollbar overflow-x-auto pb-2">
        <div className="flex min-w-[860px] items-center">
          {OFFER_WORKFLOW_STEPS.map((step, index) => {
            const isJoined = status === "Joined"
            const complete = index < activeIndex || status === "Accepted" || isJoined
            const active = index === activeIndex && !isJoined
            const Icon = step.icon
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <Motion.motion.div
                    initial={false}
                    animate={{ scale: active ? 1.08 : 1 }}
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-full border shadow-sm transition-colors",
                      complete && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
                      active && "border-primary/60 bg-primary/10 text-primary shadow-primary/20",
                      !complete && !active && "border-white/10 bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {React.createElement(Icon, { className: "h-5 w-5" })}
                  </Motion.motion.div>
                  <span className="mt-2 w-28 text-xs font-medium">{step.label}</span>
                </div>
                {index < OFFER_WORKFLOW_STEPS.length - 1 && (
                  <div className={cn("mx-2 h-px flex-1", complete ? "bg-emerald-400/40" : "bg-border")} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function CompensationCard({ label, value, total, tone = "sky" }) {
  const pct = total ? Math.min(100, Math.round((Number(value || 0) / total) * 100)) : 0
  const toneClass = {
    sky: "bg-sky-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    violet: "bg-violet-400",
    cyan: "bg-cyan-400",
  }[tone]

  return (
    <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <p className="mt-2 text-base font-semibold">{formatMoney(value)}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", toneClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function SalaryBreakdownChart({ offer }) {
  const data = [
    { name: "Base", value: offer.compensation.base },
    { name: "Bonus", value: offer.compensation.bonus },
    { name: "Allowances", value: offer.compensation.allowances },
    { name: "Stock", value: offer.compensation.stock },
    { name: "Joining", value: offer.compensation.joiningBonus },
  ]

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(255 255 255 / 0.12)", borderRadius: 8, color: "white" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ApprovalTimeline({ offer, isCeo }) {
  const rows = [
    { role: "HR", status: "Approved", detail: "Offer package prepared", icon: ShieldCheck },
    { role: "Hiring Manager", status: "Approved", detail: "Role and joining details reviewed", icon: Users },
    { role: "Finance", status: "Approved", detail: "Compensation guardrails verified", icon: Banknote },
    {
      role: "HR Manager",
      status: ["Pending CEO Approval", "Pending HR Manager Approval"].includes(offer.status) ? "Pending" : "Approved",
      detail: ["Pending CEO Approval", "Pending HR Manager Approval"].includes(offer.status) ? "Awaiting HR Manager approval" : "HR Manager approval completed",
      icon: BadgeCheck,
    },
  ]

  return (
    <div className="space-y-3">
      {rows.map(({ role, status, detail, icon }) => (
        <div key={role} className="flex gap-3 rounded-lg border border-white/10 bg-muted/10 p-3">
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border", status === "Pending" ? "border-amber-400/30 bg-amber-500/10 text-amber-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300")}>
            {React.createElement(icon, { className: "h-4 w-4" })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{role}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-xs", status === "Pending" ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300")}>{status}</span>
            </div>
            <p className="text-xs text-muted-foreground">{detail}</p>
            {role === "HR Manager" && status === "Pending" && !isCeo && (
              <p className="mt-1 text-xs text-muted-foreground">Pending approver: HR Manager</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function OfferStatusTracker({ offer }) {
  const statuses = ["Draft", "Under Review", "Approved", "Sent", "Viewed", "Accepted", "Rejected", "Expired"]
  const current =
    offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval" ? "Under Review" :
    offer.status === "Offered" ? (offer.emailStatus === "Sent" ? "Sent" : "Approved") :
    offer.status === "Accepted" ? "Accepted" :
    offer.status === "Declined" ? "Rejected" :
    offer.status
  const currentIndex = statuses.indexOf(current)

  return (
    <div className="space-y-3">
      {statuses.map((status, index) => {
        const active = status === current
        const done = currentIndex > index
        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("h-3 w-3 rounded-full", active ? "animate-pulse bg-primary" : done ? "bg-emerald-400" : "bg-muted")} />
              {index < statuses.length - 1 && <span className="mt-1 h-6 w-px bg-border" />}
            </div>
            <div>
              <p className={cn("text-sm font-medium", active && "text-primary")}>{status}</p>
              <p className="text-xs text-muted-foreground">{active ? "Current state" : done ? "Completed" : "Upcoming"}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OfferInsightsPanel({ offers }) {
  const departmentStats = offers.reduce((acc, offer) => {
    const key = offer.department || "Unassigned"
    const current = acc[key] || { total: 0, accepted: 0, declined: 0 }
    current.total += 1
    if (offer.status === "Accepted") current.accepted += 1
    if (offer.status === "Declined") current.declined += 1
    acc[key] = current
    return acc
  }, {})
  const topDepartment = Object.entries(departmentStats).sort(([, a], [, b]) => b.total - a.total)[0]
  const riskDepartment = Object.entries(departmentStats).sort(([, a], [, b]) => b.declined - a.declined)[0]
  const pendingApproval = offers.filter((offer) => offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval").length
  const avgResponse = offers.length ? Math.round(offers.reduce((sum, offer) => sum + offer.responseTimeDays, 0) / offers.length) : 0

  const insights = [
    {
      icon: Sparkles,
      title: "Acceptance quality",
      text: topDepartment ? `${topDepartment[0]} acceptance is ${Math.round((topDepartment[1].accepted / Math.max(1, topDepartment[1].total)) * 100)}% in the visible set.` : "Acceptance quality will appear as data grows.",
      tone: "emerald",
    },
    {
      icon: Clock3,
      title: "Approval queue",
      text: pendingApproval ? `${pendingApproval} offers need HR Manager approval before release.` : "No offer approval bottleneck right now.",
      tone: "amber",
    },
    {
      icon: TrendingDown,
      title: "Rejection watch",
      text: riskDepartment?.[1]?.declined ? `${riskDepartment[0]} has ${riskDepartment[1].declined} declined offers. Review compensation fit.` : "No elevated rejection signal detected.",
      tone: "rose",
    },
    {
      icon: TrendingUp,
      title: "Response speed",
      text: `Average offer response time is tracking near ${avgResponse || 0} days.`,
      tone: "cyan",
    },
  ]

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-semibold">Offer Intelligence</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map(({ icon, title, text, tone }) => (
          <div key={title} className="rounded-lg border border-white/10 bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              {React.createElement(icon, { className: cn("h-4 w-4", tone === "emerald" && "text-emerald-300", tone === "amber" && "text-amber-300", tone === "rose" && "text-rose-300", tone === "cyan" && "text-cyan-300") })}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
            </div>
            <p className="mt-2 text-sm">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function OfferFilters({ filters, onChange, options }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search || ""}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search candidate, offer ID..."
            className="pl-9"
          />
        </div>

        {/* Department Filter */}
        <FilterSelect
          label="Department"
          value={filters.department || "All"}
          onChange={(value) => set("department", value)}
          options={options.departments || []}
        />

        {/* Position Filter */}
        <FilterSelect
          label="Position"
          value={filters.position || "All"}
          onChange={(value) => set("position", value)}
          options={options.positions || []}
        />

        {/* Joining Date Filter */}
        <div className="relative">
          <Input
            type="date"
            value={filters.joiningDate || ""}
            onChange={(e) => set("joiningDate", e.target.value)}
            className="w-full text-xs"
            placeholder="Joining Date"
          />
        </div>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <label className="relative min-w-[140px]">
     <select
  value={value}
  onChange={(e) => onChange(e.target.value)}
  className="appearance-none h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
>
        <option value="All">{label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
    </label>
  )
}

export function OfferAnalyticsCharts({ offers }) {
  const trendData = buildOfferTrendData(offers)
  const departmentData = Object.values(offers.reduce((acc, offer) => {
    const department = offer.department || "Unassigned"
    const current = acc[department] || { department, offers: 0 }
    current.offers += 1
    acc[department] = current
    return acc
  }, {}))
  const salaryData = [
    { range: "<100k", count: offers.filter((offer) => offer.salary < 100000).length },
    { range: "100-250k", count: offers.filter((offer) => offer.salary >= 100000 && offer.salary < 250000).length },
    { range: "250k+", count: offers.filter((offer) => offer.salary >= 250000).length },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <ChartCard title="Offer Acceptance Trend">
        {trendData.length === 0 ? <ChartEmptyState /> : <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="offerAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="rgb(148 163 184)" fontSize={12} />
            <YAxis stroke="rgb(148 163 184)" fontSize={12} />
            <Tooltip contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(255 255 255 / 0.12)", borderRadius: 8, color: "white" }} />
            <Area type="monotone" dataKey="accepted" stroke="#22c55e" fill="url(#offerAccepted)" />
            <Area type="monotone" dataKey="released" stroke="#38bdf8" fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>}
      </ChartCard>
      <ChartCard title="Department-wise Offers">
        {departmentData.length === 0 ? <ChartEmptyState /> : <ResponsiveContainer width="100%" height={220}>
          <BarChart data={departmentData}>
            <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
            <XAxis dataKey="department" stroke="rgb(148 163 184)" fontSize={11} />
            <YAxis stroke="rgb(148 163 184)" fontSize={12} />
            <Tooltip contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(255 255 255 / 0.12)", borderRadius: 8, color: "white" }} />
            <Bar dataKey="offers" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>}
      </ChartCard>
      <ChartCard title="Salary Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={salaryData}>
            <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
            <XAxis dataKey="range" stroke="rgb(148 163 184)" fontSize={12} />
            <YAxis stroke="rgb(148 163 184)" fontSize={12} />
            <Tooltip contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(255 255 255 / 0.12)", borderRadius: 8, color: "white" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  )
}

function buildOfferTrendData(offers = []) {
  const grouped = offers.reduce((acc, offer) => {
    const date = offer.createdAt ? new Date(offer.createdAt) : null
    if (!date || Number.isNaN(date.getTime())) return acc
    const month = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    const item = acc[month] || { month, accepted: 0, released: 0 }
    if (offer.status === "Accepted") item.accepted += 1
    if (offer.status === "Offered") item.released += 1
    acc[month] = item
    return acc
  }, {})
  return Object.values(grouped)
}

function ChartEmptyState() {
  return (
    <div className="grid h-[220px] place-items-center rounded-md border border-dashed border-white/10 bg-muted/10 text-sm text-muted-foreground">
      No offer data available
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/80 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

export function OfferTable({ offers, sort, onSort, page, pageSize, onPageChange, onView, onAction, canWrite, isCeo, canApproveOffers = false }) {
  const navigate = useNavigate()
  const pages = Math.max(1, Math.ceil(offers.length / pageSize))
  const visible = offers.slice((page - 1) * pageSize, page * pageSize)
  const columns = [
    ["offerId", "Offer ID"],
    ["candidateName", "Candidate"],
    ["jobCode", "Job ID"],
    ["position", "Position"],
    ["department", "Department"],
    ["salary", "Salary Package"],
    ["joiningDate", "Joining Date"],
    ["status", "Offer Status"],
    ["approvalStage", "Approval Status"],
    ["recruiter", "Recruiter"],
    ["lastUpdated", "Last Updated"],
    ["actions", "Actions"],
  ]

  return (
    <section className="rounded-lg border border-white/10 bg-card/80">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <h2 className="text-sm font-semibold">Offer Data Grid</h2>
          <p className="text-xs text-muted-foreground">{offers.length} offers in current view</p>
        </div>
        <Button variant="outline" onClick={() => onAction("export")}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="custom-scrollbar overflow-x-auto">
        <table className="min-w-[1280px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
            <tr>
              {columns.map(([key, label]) => (
                <th key={key} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                  {key === "actions" ? label : (
                    <button type="button" onClick={() => onSort(key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {label}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-5">
                  <RecruitmentEmptyState title="No offers match this view" description="Adjust filters or create a new offer to continue the workflow." />
                </td>
              </tr>
            ) : visible.map((offer) => {
              const candidateIdVal = offer.candidateId?._id || offer.candidateId
              return (
                <Motion.motion.tr key={offer._id || offer.offerId} whileHover={{ backgroundColor: "rgb(255 255 255 / 0.035)" }} className="odd:bg-white/[0.015]">
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{offer.offerId}</td>
                  <td className="px-4 py-4">
                    <span 
                      onClick={(e) => {
                        if (candidateIdVal) {
                          e.stopPropagation()
                          navigate(`/dashboard/applications/${candidateIdVal}`)
                        } else {
                          onView(offer)
                        }
                      }}
                      className={cn(
                        "font-semibold transition-colors cursor-pointer",
                        candidateIdVal ? "text-cyan-600 dark:text-cyan-400 hover:underline" : "text-foreground"
                      )}
                      title={candidateIdVal ? "Click to view candidate profile" : offer.candidateName}
                    >
                      {offer.candidateName}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                    {offer.jobCode || offer.jobId?.jobCode || offer.candidateId?.jobId?.jobCode || (offer.jobId?._id ? `JOB-${offer.jobId._id.slice(-4)}` : "N/A")}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{offer.position}</td>
                  <td className="px-4 py-4 text-muted-foreground">{offer.department}</td>
                  <td className="px-4 py-4 font-medium">{formatMoney(offer.salary)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{offer.joiningDate}</td>
                  <td className="px-4 py-4"><OfferStatusBadge status={offer.status} /></td>
                  <td className="px-4 py-4"><RecruitmentStatusBadge status={offer.approvalStage} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{offer.recruiter}</td>
                  <td className="px-4 py-4 text-muted-foreground">{new Date(offer.lastUpdated).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onView(offer)}>
                        View
                      </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 px-2 border border-white/10 text-xs">
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 border-white/10 bg-slate-950 text-slate-100 shadow-xl">
                        <DropdownMenuItem onClick={() => onView(offer)} className="cursor-pointer hover:bg-white/10">
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (offer.status === "Draft" || offer.status === "Under Review") {
                            toast.info("Edit package details via renegotiation or duplicate.")
                          } else {
                            onAction("renegotiate", offer)
                          }
                        }} className="cursor-pointer hover:bg-white/10">
                          Edit / Negotiate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction("preview-pdf", offer)} className="cursor-pointer hover:bg-white/10">
                          Preview PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          onView(offer)
                          toast.info("Opening offer history in drawer...")
                        }} className="cursor-pointer hover:bg-white/10">
                          History
                        </DropdownMenuItem>

                        {((isCeo || canApproveOffers) && (offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval")) && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => onAction("approve", offer)} className="cursor-pointer hover:bg-white/10 text-emerald-400">
                              Release/Approve
                            </DropdownMenuItem>
                          </>
                        )}

                        {canWrite && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => onAction("send", offer)} className="cursor-pointer hover:bg-white/10 text-sky-400 font-semibold">
                              Send Offer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </Motion.motion.tr>
            )})}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-white/10">
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={offers.length}
          itemsPerPage={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  )
}

export function OfferDetailsDrawer({ offer, open, onClose, onAction, isCeo, canWrite, canApproveOffers = false, onPreviewLetter }) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    salary: offer?.salary || 0,
    joiningDate: offer?.joiningDate || "",
    expiryDate: offer?.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : "",
    position: offer?.position || "",
    department: offer?.department || "",
    bonus: offer?.bonus || 0,
  })
  const [savingEdit, setSavingEdit] = React.useState(false)

  React.useEffect(() => {
    if (offer) {
      setEditForm({
        salary: offer.salary || 0,
        joiningDate: offer.joiningDate || "",
        expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : "",
        position: offer.position || "",
        department: offer.department || "",
        bonus: offer.bonus || 0,
      })
      setIsEditing(false)
    }
  }, [offer])

  const candidateIdVal = offer?.candidateId?._id || offer?.candidateId

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!offer?._id) return
    try {
      setSavingEdit(true)
      await apiClient.put(`/offers/${offer._id}`, {
        salary: Number(editForm.salary),
        joiningDate: editForm.joiningDate,
        expiryDate: editForm.expiryDate || undefined,
        position: editForm.position,
        department: editForm.department,
        bonus: Number(editForm.bonus || 0),
      })
      toast.success("Offer package updated successfully!")
      setIsEditing(false)
      if (onAction) onAction("export")
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update offer package")
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <AnimatePresence>
      {open && offer && (
        <>
          <Motion.motion.button className="fixed inset-0 z-40 bg-black/50" aria-label="Close offer drawer overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <Motion.motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${offer.candidateName} offer details`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-2xl flex-col border-l border-white/10 bg-background shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <CandidateAvatar name={offer.candidateName} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{offer.candidateName}</h2>
                    {offer.emailStatus && (
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        offer.emailStatus === 'Sent' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        offer.emailStatus === 'Sending' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        offer.emailStatus === 'Failed' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                        "bg-slate-500/10 border-slate-500/20 text-slate-500"
                      )}>
                        {offer.emailStatus === 'Sent' ? '✓ Sent' : offer.emailStatus}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{offer.position} · {offer.department}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close offer drawer"><X className="h-4 w-4" /></Button>
            </div>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              {offer.emailStatus === 'Failed' && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>Offer Email Delivery Failed</p>
                      <p className="text-xs text-rose-500/70 font-mono font-normal normal-case leading-relaxed">
                        Reason: {offer.emailFailureReason || "Unknown SMTP Error"}
                      </p>
                    </div>
                  </div>
                  {canWrite && (
                    <Button 
                      size="sm"
                      onClick={() => onAction("send", offer)} 
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Retry Send Email
                    </Button>
                  )}
                </div>
              )}
              <DrawerSection title="Candidate Summary" icon={UserRound}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Candidate Name</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{offer.candidateName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Candidate ID</span>
                    <p className="font-mono text-xs text-slate-900 dark:text-white">{offer.candidateId?._id || offer.candidateId || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Position</span>
                    <p className="font-medium text-slate-900 dark:text-white">{offer.position || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Department</span>
                    <p className="font-medium text-slate-900 dark:text-white">{offer.department || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Recruiter</span>
                    <p className="font-medium text-slate-900 dark:text-white">{offer.recruiter || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Interview Score</span>
                    <p className="font-semibold text-emerald-400">
                      {offer.interviewScore !== undefined && offer.interviewScore !== null ? `${offer.interviewScore}/10` : "N/A"}
                    </p>
                  </div>
                </div>
                {candidateIdVal && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClose()
                        navigate(`/dashboard/applications/${candidateIdVal}`)
                      }}
                      className="text-xs font-bold text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
                    >
                      <UserRound className="mr-1.5 h-3.5 w-3.5" />
                      View Full Candidate Profile
                    </Button>
                  </div>
                )}
              </DrawerSection>
              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={FileSignature} label="Offer ID" value={offer.offerId} />
                <InfoTile icon={CircleDollarSign} label="Salary Package" value={formatMoney(offer.salary)} />
                <InfoTile icon={CalendarClock} label="Joining Date" value={offer.joiningDate} />
                <InfoTile icon={UserRound} label="Recruiter" value={offer.recruiter} />
              </div>

              {canWrite && (
                <DrawerSection title="Edit Offer Package" icon={PenLine}>
                  {!isEditing ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Modify salary package, joining date, expiry date, or position details.</p>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="text-xs font-bold cursor-pointer">
                        <PenLine className="mr-1.5 h-3.5 w-3.5" /> Edit Package
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Salary Package (INR)</label>
                          <Input
                            type="number"
                            value={editForm.salary}
                            onChange={(e) => setEditForm(prev => ({ ...prev, salary: e.target.value }))}
                            className="h-8 text-xs bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Joining Date</label>
                          <Input
                            type="date"
                            value={editForm.joiningDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                            className="h-8 text-xs bg-background"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Offer Expiry Date</label>
                          <Input
                            type="date"
                            value={editForm.expiryDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Bonus Package (INR)</label>
                          <Input
                            type="number"
                            value={editForm.bonus}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bonus: e.target.value }))}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Position Title</label>
                          <Input
                            type="text"
                            value={editForm.position}
                            onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Department</label>
                          <Input
                            type="text"
                            value={editForm.department}
                            onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={savingEdit} size="sm" className="flex-1 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer">
                          {savingEdit ? "Saving..." : "Save Offer Changes"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-xs cursor-pointer">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </DrawerSection>
              )}

              <DrawerSection title="Compensation Breakdown" icon={Banknote}>
                <div className="grid gap-3 md:grid-cols-2">
                  <SalaryBreakdownChart offer={offer} />
                  <div className="grid gap-2">
                    <CompensationCard label="Base Salary" value={offer.compensation.base} total={offer.compensation.total} tone="sky" />
                    <CompensationCard label="Bonus" value={offer.compensation.bonus} total={offer.compensation.total} tone="emerald" />
                    <CompensationCard label="Allowances" value={offer.compensation.allowances} total={offer.compensation.total} tone="amber" />
                    <CompensationCard label="Total CTC" value={offer.compensation.total} total={offer.compensation.total} tone="violet" />
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection title="Approval Flow" icon={ShieldCheck}>
                <ApprovalTimeline offer={offer} isCeo={isCeo} />
              </DrawerSection>

              <DrawerSection title="Offer Status Tracker" icon={MailCheck}>
                <OfferStatusTracker offer={offer} />
                {offer.emailStatus && (
                  <div className="mt-4 border-t border-dashed border-slate-200 dark:border-white/10 pt-3">
                    <span className="text-xs text-muted-foreground block mb-1">Email Delivery Status</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        offer.emailStatus === 'Sent' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        offer.emailStatus === 'Sending' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        offer.emailStatus === 'Failed' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                        "bg-slate-500/10 border-slate-500/20 text-slate-500"
                      )}>
                        {offer.emailStatus === 'Sent' ? '✓ Sent' : offer.emailStatus}
                      </span>
                      {offer.emailSentAt && (
                        <span className="text-xs text-muted-foreground">
                          at {new Date(offer.emailSentAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </DrawerSection>

              <DrawerSection title="Notes & Comments" icon={NotebookPen}>
                <p className="text-sm text-muted-foreground">Compensation reviewed against internal band. Confirm candidate response before expiry and capture negotiation notes here.</p>
              </DrawerSection>

              <DrawerSection title="Activity Logs" icon={MessageSquareText}>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Offer created for {offer.candidateName}.</p>
                  <p>Status is currently {offer.status}.</p>
                  <p>Last updated {new Date(offer.lastUpdated).toLocaleString()}.</p>
                </div>
              </DrawerSection>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              <Button variant="outline" onClick={() => onPreviewLetter(offer)}><FileText className="mr-2 h-4 w-4" />Preview Letter</Button>
              <Button variant="outline" onClick={() => onAction("download", offer)}><Download className="mr-2 h-4 w-4" />Download</Button>
              {(isCeo || canApproveOffers) && (offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval") && <Button onClick={() => onAction("approve", offer)}>Approve</Button>}
              {canWrite && offer.status === "Offered" && (
                <>
                  <Button onClick={() => onAction("accepted", offer)}>Mark Accepted</Button>
                  <Button variant="destructive" onClick={() => onAction("declined", offer)}>Decline</Button>
                </>
              )}
              {canWrite && (
                <Button variant="default" className="bg-sky-600 hover:bg-sky-700 text-white font-bold" onClick={() => onAction("send", offer)}>
                  {offer.emailStatus === 'Failed' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Send Email
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Offer
                    </>
                  )}
                </Button>
              )}
              {canWrite && offer.status === "Accepted" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                  onClick={() => {
                    const [firstName, ...lastNameParts] = (offer.candidateName || "").split(" ");
                    const lastName = lastNameParts.join(" ");
                    window.location.href = `/employee-center/onboarding?email=${encodeURIComponent(offer.candidateEmail || "")}&firstName=${encodeURIComponent(firstName || "")}&lastName=${encodeURIComponent(lastName || "")}&designation=${encodeURIComponent(offer.position || "")}&department=${encodeURIComponent(offer.department || "")}&joiningDate=${encodeURIComponent(offer.joiningDate || "")}`;
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Onboard Candidate
                </Button>
              )}
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
const executiveDesignationPattern = /\b(executive|manager|director|head|chief|vp|vice president|president|lead|principal|architect)\b/i;

const getActiveTemplate = (offer) => {
  if (!offer) return "standard";
  if (offer.previewTemplateId) {
    return offer.previewTemplateId;
  }
  const tid = (offer.templateId || "").toLowerCase().trim();
  if (tid === "executive" || tid === "executive-offer") {
    return "executive";
  }
  if (tid === "standard" || tid === "standard-offer") {
    return "standard";
  }
  const designation = (offer.position || "").trim();
  return executiveDesignationPattern.test(designation) ? "executive" : "standard";
};

export function OfferLetterPreview({ offer, open, onClose, onDownload }) {
  const activeTemplate = offer ? getActiveTemplate(offer) : "standard";

  const hrRepName = offer?.createdBy && typeof offer.createdBy === 'object'
    ? `${offer.createdBy.firstName} ${offer.createdBy.lastName || ''}`.trim()
    : (offer?.recruiter || "HR Team");
  const hrRepEmail = offer?.createdBy && typeof offer.createdBy === 'object'
    ? offer.createdBy.email
    : "hr@internsland.com";
  const hrRepPhone = offer?.createdBy && typeof offer.createdBy === 'object'
    ? offer.createdBy.phoneNumber
    : "";

  return (
    <AnimatePresence>
      {open && offer && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
          <Motion.motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 p-4">
              <div>
                <h2 className="text-lg font-semibold">Offer Letter Preview</h2>
                <p className="text-sm text-muted-foreground">Branded template preview for {offer.candidateName}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
            <div className="custom-scrollbar max-h-[68vh] overflow-y-auto bg-slate-50/40 dark:bg-transparent p-6">
              <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-5">
                  <div>
                    <p className="text-xl font-semibold">HRMS System</p>
                    <p className="text-sm text-muted-foreground">Official Employment Offer</p>
                  </div>
                  <FileSignature className="h-10 w-10 text-primary" />
                </div>
                {activeTemplate === "executive" ? (
                  <div className="space-y-4 py-5 text-sm leading-6">
                    <p>Dear {offer.candidateName},</p>
                    <p>We are pleased to extend an offer for the executive role of <strong>{offer.position}</strong> in the <strong>{offer.department}</strong> department.</p>
                    <p>Your proposed joining date is <strong>{offer.joiningDate}</strong>, with a salary package of <strong>{formatMoney(offer.salary)}</strong>.</p>
                    
                    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-muted/10 p-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Compensation Summary</p>
                      <p>Base: {formatMoney(offer.compensation.base)}</p>
                      <p>Bonus: {formatMoney(offer.compensation.bonus)}</p>
                      <p>Allowances: {formatMoney(offer.compensation.allowances)}</p>
                      {offer.compensation.stock > 0 && (
                        <p>Equity/ESOP Value: {formatMoney(offer.compensation.stock)}</p>
                      )}
                      <p>Total CTC: {formatMoney(offer.compensation.total)}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">Executive Benefits & Compensation</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          As an executive leader, you will be eligible for executive health screening, premium corporate wellness programs, relocation assistance (where applicable), and executive performance bonus pools. You will also participate in the company Equity Stock Option Plan (ESOP) vesting over a standard four-year schedule.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">Leadership Responsibilities & Reporting Structure</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          In this position, you will report directly to the Chief Executive Officer (CEO) or designated Board members. You will be responsible for department budget management, strategic decision-making, team leadership, and driving organizational key performance metrics.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">Confidentiality & Non-Compete Clauses</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          You agree to strictly maintain the confidentiality of all proprietary company data, IP assets, and strategic roadmaps. Additionally, you agree to a standard one (1) year non-compete clause post-employment.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">Executive Notice Period & Employment Terms</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Due to the strategic nature of this leadership position, an extended notice period of ninety (90) days is required by either party for termination of employment. This position is subject to quarterly key performance indicator (KPI) reviews and standard board approvals.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-5 text-sm leading-6">
                    <p>Dear {offer.candidateName},</p>
                    <p>We are pleased to extend an offer for the role of <strong>{offer.position}</strong> in the <strong>{offer.department}</strong> department.</p>
                    <p>Your proposed joining date is <strong>{offer.joiningDate}</strong>, with a salary package of <strong>{formatMoney(offer.salary)}</strong>.</p>
                    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-muted/10 p-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Compensation Summary</p>
                      <p>Base: {formatMoney(offer.compensation.base)}</p>
                      <p>Bonus: {formatMoney(offer.compensation.bonus)}</p>
                      <p>Allowances: {formatMoney(offer.compensation.allowances)}</p>
                      <p>Total CTC: {formatMoney(offer.compensation.total)}</p>
                    </div>
                    <p>This offer is subject to company policies, documentation verification, and standard employment terms.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6 border-t border-slate-200 dark:border-white/10 pt-5">
                  <div className="h-24 rounded-lg border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/40 dark:bg-muted/5 p-3 text-xs text-muted-foreground">Company Signature</div>
                  <div className="h-24 rounded-lg border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/40 dark:bg-muted/5 p-3 text-xs text-muted-foreground">Candidate Digital Signature</div>
                </div>

                <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6 space-y-4 text-left">
                  <h3 className="text-base font-semibold text-teal-600 dark:text-teal-400">Next Steps</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Congratulations once again on receiving your offer from <strong>InternsLand</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Please review the enclosed Offer Letter carefully. If you have any questions regarding your compensation, joining date, employment terms, benefits, or any other aspect of the offer, our HR team will be happy to assist you.
                  </p>

                  <div className="rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Responding to Your Offer</h4>
                    <p className="text-xs text-muted-foreground">
                      Please communicate your decision on or before the offer expiry date using any of the following methods:
                    </p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-2">
                      <li>
                        <strong>Accept the Offer:</strong> Reply to the offer email or contact your HR representative to confirm your acceptance.
                      </li>
                      <li>
                        <strong>Discuss or Clarify the Offer:</strong> If you would like to discuss any terms or require additional information, please contact your HR representative before the offer expires.
                      </li>
                      <li>
                        <strong>Decline the Offer:</strong> If you decide not to proceed, kindly inform the HR team by replying to the offer email.
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="rounded-lg bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300">HR Contact Details</p>
                      <p className="text-muted-foreground">Representative: {hrRepName}</p>
                      <p className="text-muted-foreground">Email: {hrRepEmail}</p>
                      {hrRepPhone && <p className="text-muted-foreground">Phone: {hrRepPhone}</p>}
                    </div>
                    <div className="rounded-lg bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300">Offer Expiry</p>
                      <p className="text-muted-foreground">Valid Until: {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : "N/A"}</p>
                      <p className="text-[10px] text-rose-500/80 leading-normal">If no response is received by the expiry date, this offer may be considered withdrawn.</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic text-center pt-2">
                    Thank you for considering this opportunity. We look forward to your response and hope to welcome you to the team.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-white/10 p-4">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => onDownload(offer)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
            </div>
          </Motion.motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function OfferActionConfirm({ action, offer, open, onClose, onConfirm }) {
  const labels = {
    approve: ["Approve Offer", "This will release the offer from CEO approval."],
    reject: ["Reject Offer", "This records an approval rejection in the UI workflow."],
    send: ["Send Offer", "This will mark the offer communication as sent in the activity feed."],
    renegotiate: ["Re-negotiate", "This will open the compensation discussion workflow."],
    duplicate: ["Duplicate Offer", "This creates a local duplicate workflow action notification."],
    archive: ["Archive Offer", "This archives the offer from active work queues in the UI."],
    accepted: ["Mark Accepted", "This updates the offer status to Accepted."],
    declined: ["Mark Declined", "This updates the offer status to Declined."],
    download: ["Download Offer", "This generates and downloads the official Offer Letter PDF."],
    export: ["Export View", "This exports the currently filtered offer view."],
  }
  const [title, description] = labels[action] || ["Confirm Action", "Confirm this offer action."]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4">
          <Motion.motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="w-full max-w-md rounded-lg border border-white/10 bg-background p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {offer && <p className="mt-3 rounded-lg bg-muted/30 p-3 text-sm">{offer.candidateName} · {offer.offerId}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={onConfirm}>Confirm</Button>
            </div>
          </Motion.motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function OfferActionBar({ offer, onAction, canWrite, isCeo, canApproveOffers = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canWrite && offer?.status === "Accepted" && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02]"
          onClick={() => {
            const [firstName, ...lastNameParts] = (offer.candidateName || "").split(" ");
            const lastName = lastNameParts.join(" ");
            window.location.href = `/employee-center/onboarding?email=${encodeURIComponent(offer.candidateEmail || "")}&firstName=${encodeURIComponent(firstName || "")}&lastName=${encodeURIComponent(lastName || "")}&designation=${encodeURIComponent(offer.position || "")}&department=${encodeURIComponent(offer.department || "")}&joiningDate=${encodeURIComponent(offer.joiningDate || "")}`;
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Onboard Candidate
        </Button>
      )}
      {canApproveOffers && offer?.status === "Offered" && <Button variant="outline" onClick={() => onAction("send", offer)}><Send className="mr-2 h-4 w-4" />Send Offer</Button>}
      {(isCeo || canApproveOffers) && (offer?.status === "Pending CEO Approval" || offer?.status === "Pending HR Manager Approval") && <Button onClick={() => onAction("approve", offer)}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>}
      {canApproveOffers && <Button variant="outline" onClick={() => onAction("reject", offer)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>}
      {canApproveOffers && <Button variant="outline" onClick={() => onAction("renegotiate", offer)}><PenLine className="mr-2 h-4 w-4" />Re-negotiate</Button>}
      <Button variant="outline" onClick={() => onAction("download", offer)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
      {canApproveOffers && <Button variant="outline" onClick={() => onAction("duplicate", offer)}><Copy className="mr-2 h-4 w-4" />Duplicate</Button>}
      {canApproveOffers && <Button variant="outline" onClick={() => onAction("archive", offer)}><Archive className="mr-2 h-4 w-4" />Archive</Button>}
    </div>
  )
}

export { formatMoney }
