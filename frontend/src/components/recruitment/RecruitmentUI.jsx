import * as React from "react"
import * as Motion from "framer-motion"
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  Minus,
  SearchX,
  Sparkles,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const statusConfig = {
  pending: { icon: Clock3, className: "border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-amber-500/10" },
  approved: { icon: CheckCircle2, className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10" },
  draft: { icon: FileText, className: "border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 shadow-slate-500/10" },
  published: { icon: Sparkles, className: "border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-sky-500/10" },
  rejected: { icon: XCircle, className: "border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-rose-500/10" },
  interview: { icon: Clock3, className: "border-violet-400/30 bg-violet-500/10 text-violet-300 shadow-violet-500/10" },
  shortlisted: { icon: CircleDashed, className: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300 shadow-indigo-500/10" },
  selected: { icon: CheckCircle2, className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10" },
  offered: { icon: FileText, className: "border-cyan-400/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 shadow-cyan-500/10" },
  accepted: { icon: CheckCircle2, className: "border-lime-400/30 bg-lime-500/10 text-lime-300 shadow-lime-500/10" },
  declined: { icon: XCircle, className: "border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-rose-500/10" },
  closed: { icon: Minus, className: "border-zinc-400/30 bg-zinc-500/10 text-zinc-300 shadow-zinc-500/10" },
  applied: { icon: FileText, className: "border-blue-400/30 bg-blue-500/10 text-blue-300 shadow-blue-500/10" },
}

const normalizeStatus = (status = "") =>
  status.toString().trim().toLowerCase().replace(/\s+/g, " ")

export function RecruitmentStatusBadge({ status, className }) {
  const key = normalizeStatus(status)
    .replace("pending ceo approval", "pending")
    .replace("pending hr manager approval", "pending")
    .replace("interview scheduled", "interview")
    .replace("screening", "shortlisted")
  const config = statusConfig[key] || statusConfig[normalizeStatus(status)] || statusConfig.draft
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        config.className,
        className
      )}
    >
      {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
      {status || "Draft"}
    </span>
  )
}

export function RecruitmentPageHeader({ title, subtitle, summary, actions }) {
  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-slate-200 dark:border-white/10 bg-background/90 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {summary && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{summary}</p>}
        </div>
        {actions && <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:flex lg:flex-wrap lg:items-center">{actions}</div>}
      </div>
    </div>
  )
}

export function RecruitmentKpiCard({
  title,
  value,
  icon: Icon,
  trend = 0,
  trendLabel = "this month",
  helper,
  updated = "Updated just now",
  accent = "sky",
  onClick,
  active,
}) {
  const positive = Number(trend) >= 0
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight
  const accentClass = {
    sky: "from-sky-500/20 text-sky-300 ring-sky-400/20",
    emerald: "from-emerald-500/20 text-emerald-300 ring-emerald-400/20",
    amber: "from-amber-500/20 text-amber-300 ring-amber-400/20",
    rose: "from-rose-500/20 text-rose-300 ring-rose-400/20",
    violet: "from-violet-500/20 text-violet-300 ring-violet-400/20",
    cyan: "from-cyan-500/20 text-cyan-600 dark:text-cyan-300 ring-cyan-400/20",
    slate: "from-slate-500/20 text-slate-700 dark:text-slate-300 ring-slate-400/20",
  }[accent] || "from-sky-500/20 text-sky-300 ring-sky-400/20"

  return (
    <Motion.motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative min-h-[138px] min-w-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-card/80 p-4 text-left shadow-sm transition-all",
        "hover:border-white/20 hover:bg-card hover:shadow-lg hover:shadow-black/10",
        active && "border-primary/40 ring-1 ring-primary/30",
        !onClick && "cursor-default"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", accentClass.split(" ")[0])} />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{value}</div>
        </div>
        {Icon && (
          <div className={cn("shrink-0 rounded-md bg-muted/40 p-2 ring-1", accentClass)}>
            {React.createElement(Icon, { className: "h-5 w-5" })}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className={cn("inline-flex items-center gap-1 font-semibold", positive ? "text-emerald-300" : "text-rose-300")}>
          <TrendIcon className="h-3.5 w-3.5" />
          {Math.abs(Number(trend))}%
        </span>
        <span className="text-muted-foreground">{trendLabel}</span>
      </div>
      <div className="mt-3 flex h-6 items-end gap-1">
        {[35, 55, 42, 70, 48, 82, 64].map((height, index) => (
          <span
            key={index}
            className={cn("w-full rounded-t bg-muted transition-colors group-hover:bg-primary/40", active && "bg-primary/50")}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <span className="min-w-0 break-words">{helper}</span>
        <span className="shrink-0">{updated}</span>
      </div>
    </Motion.motion.button>
  )
}

export function RecruitmentEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-muted/10 p-8 text-center">
      <div className="relative mb-5 h-20 w-28">
        <div className="absolute inset-x-4 bottom-0 h-14 rounded-lg border border-sky-400/20 bg-sky-500/10" />
        <div className="absolute left-0 top-3 h-10 w-10 rounded-md border border-violet-400/20 bg-violet-500/10" />
        <div className="absolute right-1 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10">
          <SearchX className="h-5 w-5 text-emerald-300" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function RecruitmentSkeleton({ type = "cards", rows = 5 }) {
  if (type === "table") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-card/70">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-200 dark:border-white/10 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="dark-shimmer h-4 rounded" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 gap-4 border-b border-white/5 p-4 last:border-0">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="dark-shimmer h-5 rounded" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[138px] rounded-lg border border-slate-200 dark:border-white/10 bg-card/70 p-4">
          <div className="dark-shimmer h-4 w-28 rounded" />
          <div className="dark-shimmer mt-4 h-8 w-16 rounded" />
          <div className="dark-shimmer mt-5 h-5 rounded" />
          <div className="dark-shimmer mt-4 h-3 w-36 rounded" />
        </div>
      ))}
    </div>
  )
}

export function RecruitmentTable({ columns, children, className }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-card/80 shadow-sm", className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-5 py-3 text-left font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    {column}
                    <ArrowUpRight className="h-3 w-3 opacity-40" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function CandidateAvatar({ name = "Candidate" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C"

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-muted text-xs font-semibold text-foreground">
      {initials}
    </span>
  )
}

export function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
