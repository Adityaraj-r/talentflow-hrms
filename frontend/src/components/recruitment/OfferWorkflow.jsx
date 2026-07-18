import * as React from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CandidateAvatar, RecruitmentEmptyState, RecruitmentKpiCard, RecruitmentStatusBadge } from "@/components/recruitment/RecruitmentUI"

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
  if (value === "expired") return "Expired"
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

  return {
    ...offer,
    status: canonicalOfferStatus(offer?.status),
    position: offer?.position || "Unassigned role",
    department: offer?.department || "Unassigned",
    recruiter: offer?.recruiterName || offer?.recruiter || offer?.createdBy?.firstName || "Unassigned",
    approvalStage: offer?.approvalStage || (["Pending CEO Approval", "Pending HR Manager Approval"].includes(offer?.status) ? "HR Manager Approval" : offer?.status === "Offered" ? "Released" : "Completed"),
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
  `INR ${Number(amount || 0).toLocaleString("en-IN")}`

export function OfferStatusBadge({ status, className }) {
  const canonical = canonicalOfferStatus(status)
  const style =
    canonical === "Pending CEO Approval" || canonical === "Pending HR Manager Approval"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-amber-500/10"
      : canonical === "Offered"
        ? "border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-sky-500/10"
        : canonical === "Accepted"
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10"
          : canonical === "Declined" || canonical === "Expired"
            ? "border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-rose-500/10"
            : "border-violet-400/30 bg-violet-500/10 text-violet-300 shadow-violet-500/10"
  const Icon = canonical === "Accepted" ? CheckCircle2 : canonical === "Declined" || canonical === "Expired" ? XCircle : canonical === "Offered" ? Send : Clock3

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm", style, className)}>
      {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
      {canonical}
    </span>
  )
}

export function OfferAnalyticsCard(props) {
  return <RecruitmentKpiCard {...props} />
}

export function OfferDashboardAnalytics({ offers }) {
  const total = offers.length
  const pending = offers.filter((offer) => offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval").length
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
      <OfferAnalyticsCard title="Total Offers" value={total} icon={FileSignature} trend={11} helper="All active offer records" accent="sky" />
      <OfferAnalyticsCard title="Pending Approvals" value={pending} icon={Clock3} trend={4} helper="Waiting approval action" accent="amber" />
      <OfferAnalyticsCard title="Accepted Offers" value={accepted} icon={CheckCircle2} trend={18} helper="Confirmed candidates" accent="emerald" />
      <OfferAnalyticsCard title="Declined Offers" value={declined} icon={XCircle} trend={-3} helper="Closed as declined" accent="rose" />
      <OfferAnalyticsCard title="Acceptance Rate" value={`${acceptance}%`} icon={TrendingUp} trend={7} helper="Accepted / total offers" accent="violet" />
      <OfferAnalyticsCard title="Avg Salary" value={avgSalary ? formatMoney(avgSalary) : "INR 0"} icon={CircleDollarSign} trend={9} helper="Average offer package" accent="cyan" />
      <OfferAnalyticsCard title="Expiry Alerts" value={expiryAlerts} icon={CalendarClock} trend={-2} helper="Due within 3 days" accent="amber" />
    </div>
  )
}

export function OfferWorkflowTracker({ offer }) {
  const status = canonicalOfferStatus(offer?.status)
  const activeIndex =
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
            const complete = index < activeIndex || status === "Accepted"
            const active = index === activeIndex
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
    offer.status === "Offered" ? "Sent" :
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

export function OfferFilters({ filters, onChange, options, onSave, savedFilters, onApply }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4">
  <div className="grid gap-3 xl:grid-cols-4">

    {/* Search */}
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
        placeholder="Search offer, candidate, recruiter..."
        className="pl-9"
      />
    </div>

    <FilterSelect
      label="Status"
      value={filters.status}
      onChange={(value) => set("status", value)}
      options={["Offered", "Accepted", "Declined", "Pending HR Manager Approval", "Pending CEO Approval"]}
    />

    <FilterSelect
      label="Department"
      value={filters.department}
      onChange={(value) => set("department", value)}
      options={options.departments}
    />

    <FilterSelect
      label="Recruiter"
      value={filters.recruiter}
      onChange={(value) => set("recruiter", value)}
      options={options.recruiters}
    />

    <FilterSelect
      label="Approval"
      value={filters.approvalStage}
      onChange={(value) => set("approvalStage", value)}
      options={["Released", "HR Manager Approval", "Completed"]}
    />

    <FilterSelect
      label="Salary"
      value={filters.salaryRange}
      onChange={(value) => set("salaryRange", value)}
      options={["Below 100k", "100k-250k", "250k+"]}
    />

    <FilterSelect
      label="Expiry"
      value={filters.expiry}
      onChange={(value) => set("expiry", value)}
      options={["Due soon", "Expired", "Healthy"]}
    />

    <Button variant="outline" onClick={onSave} className="w-full">
      <Filter className="mr-2 h-4 w-4" />
      Save
    </Button>

  </div>

  {savedFilters.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="py-1">Saved:</span>
      {savedFilters.map((saved, index) => (
        <button
          key={`${saved.label}-${index}`}
          type="button"
          onClick={() => onApply(saved.filters)}
          className="rounded-full border border-white/10 px-3 py-1 hover:bg-muted"
        >
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
  const pages = Math.max(1, Math.ceil(offers.length / pageSize))
  const visible = offers.slice((page - 1) * pageSize, page * pageSize)
  const columns = [
    ["offerId", "Offer ID"],
    ["candidateName", "Candidate"],
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
                      <MoreHorizontal className={cn("h-3 w-3", sort.key === key && "text-primary")} />
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
            ) : visible.map((offer) => (
              <Motion.motion.tr key={offer._id || offer.offerId} whileHover={{ backgroundColor: "rgb(255 255 255 / 0.035)" }} className="odd:bg-white/[0.015]">
                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{offer.offerId}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <CandidateAvatar name={offer.candidateName} />
                    <span className="font-medium">{offer.candidateName}</span>
                  </div>
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
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                    {(isCeo || canApproveOffers) && (offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval") && (
                      <Button size="sm" onClick={() => onAction("approve", offer)}>Approve</Button>
                    )}
                    {canApproveOffers && offer.status === "Offered" && (
                      <Button size="sm" variant="outline" onClick={() => onAction("send", offer)}>Send</Button>
                    )}
                  </div>
                </td>
              </Motion.motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</Button>
        </div>
      </div>
    </section>
  )
}

export function OfferDetailsDrawer({ offer, open, onClose, onAction, isCeo, canWrite, canApproveOffers = false, onPreviewLetter }) {
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
                  <h2 className="truncate text-lg font-semibold">{offer.candidateName}</h2>
                  <p className="truncate text-sm text-muted-foreground">{offer.position} · {offer.department}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close offer drawer"><X className="h-4 w-4" /></Button>
            </div>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              <OfferWorkflowTracker offer={offer} />
              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={FileSignature} label="Offer ID" value={offer.offerId} />
                <InfoTile icon={CircleDollarSign} label="Salary Package" value={formatMoney(offer.salary)} />
                <InfoTile icon={CalendarClock} label="Joining Date" value={offer.joiningDate} />
                <InfoTile icon={UserRound} label="Recruiter" value={offer.recruiter} />
              </div>

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
              {canApproveOffers && offer.status === "Offered" && <Button variant="outline" onClick={() => onAction("send", offer)}>Send Offer</Button>}
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

export function OfferLetterPreview({ offer, open, onClose, onDownload }) {
  return (
    <AnimatePresence>
      {open && offer && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
          <Motion.motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="text-lg font-semibold">Offer Letter Preview</h2>
                <p className="text-sm text-muted-foreground">Branded template preview for {offer.candidateName}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
            <div className="custom-scrollbar max-h-[68vh] overflow-y-auto p-6">
              <div className="rounded-lg border border-white/10 bg-card p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xl font-semibold">HRMS System</p>
                    <p className="text-sm text-muted-foreground">Official Employment Offer</p>
                  </div>
                  <FileSignature className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-4 py-5 text-sm leading-6">
                  <p>Dear {offer.candidateName},</p>
                  <p>We are pleased to extend an offer for the role of <strong>{offer.position}</strong> in the <strong>{offer.department}</strong> department.</p>
                  <p>Your proposed joining date is <strong>{offer.joiningDate}</strong>, with a salary package of <strong>{formatMoney(offer.salary)}</strong>.</p>
                  <div className="rounded-lg border border-white/10 bg-muted/10 p-4">
                    <p className="font-semibold">Compensation Summary</p>
                    <p>Base: {formatMoney(offer.compensation.base)}</p>
                    <p>Bonus: {formatMoney(offer.compensation.bonus)}</p>
                    <p>Allowances: {formatMoney(offer.compensation.allowances)}</p>
                    <p>Total CTC: {formatMoney(offer.compensation.total)}</p>
                  </div>
                  <p>This offer is subject to company policies, documentation verification, and standard employment terms.</p>
                </div>
                <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-5">
                  <div className="h-24 rounded-lg border border-dashed border-white/15 p-3 text-xs text-muted-foreground">Company Signature</div>
                  <div className="h-24 rounded-lg border border-dashed border-white/15 p-3 text-xs text-muted-foreground">Candidate Digital Signature</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
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
    download: ["Download Offer", "This opens the browser print/download flow."],
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
