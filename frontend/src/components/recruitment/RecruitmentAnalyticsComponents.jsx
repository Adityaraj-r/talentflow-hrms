import { useMemo, useState } from "react";
import CountUp from "react-countup";
import * as Motion from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RecruitmentKpiCard } from "@/components/recruitment/RecruitmentUI";

const analyticsColors = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185", "#2dd4bf"];

const PremiumTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
      {label && <p className="mb-2 font-semibold text-slate-900 dark:text-white">{label}</p>}
      {payload.map((item) => (
        <div key={`${item.name}-${item.value}`} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartNoData({ label = "No data available" }) {
  return (
    <div className="grid h-full min-h-56 place-items-center rounded-md border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-sm text-slate-500 dark:text-slate-400">
      {label}
    </div>
  );
}

const metricConfigs = {
  openPositions: { icon: BriefcaseBusiness, accent: "sky" },
  totalCandidates: { icon: Users, accent: "emerald" },
  timeToHire: { icon: Clock3, accent: "cyan" },
  timeToFill: { icon: CalendarClock, accent: "amber" },
  offerAcceptance: { icon: BadgeCheck, accent: "emerald" },
  candidateConversion: { icon: TrendingUp, accent: "violet" },
  recruiterEfficiency: { icon: Activity, accent: "sky" },
  hiringVelocity: { icon: Zap, accent: "rose" },
};

export function AnalyticsKpiCard({ metric, onClick, active }) {
  const config = metricConfigs[metric?.key] || { icon: Activity, accent: "sky" };
  const valueDisplay = `${metric?.value ?? ""}${metric?.suffix || ""}`;

  return (
    <RecruitmentKpiCard
      title={metric?.label}
      value={valueDisplay}
      icon={config.icon}
      trend={metric?.trend}
      trendLabel={metric?.comparison}
      helper={metric?.description || "vs previous period"}
      updated="Live data"
      accent={config.accent}
      chartData={metric?.sparkline}
      onClick={onClick}
      active={active}
      tooltip={metric?.description}
    />
  );
}

export function AnalyticsFilters({ filters, options, onChange, onReset }) {
  const setFilter = (key, value) => onChange({ ...filters, [key]: value });
  const selectClass = "w-full border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-100";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-4 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <SlidersHorizontal className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
          Global analytics filters
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10">
          Reset
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Input type="date" value={filters.startDate} onChange={(e) => setFilter("startDate", e.target.value)} className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-100" />
        <Input type="date" value={filters.endDate} onChange={(e) => setFilter("endDate", e.target.value)} className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-100" />
        {[
          ["recruiter", options.recruiters],
          ["department", options.departments],
          ["role", options.roles],
          ["source", options.sources],
        ].map(([key, values]) => (
          <Select key={key} value={filters[key]} onValueChange={(value) => setFilter(key, value)}>
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder={key} />
            </SelectTrigger>
            <SelectContent className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
              <SelectItem value="All">All {key}s</SelectItem>
              {(values || []).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}

export function HiringFunnelChart({ data = [], onStageClick }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiring Funnel Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Conversion, drop-off, and bottleneck visibility by stage.</p>
        </div>
        <Filter className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>
      <div className="space-y-3">
        {data.map((stage, index) => {
          const width = Math.max(28, (stage.count / max) * 100);
          return (
            <Motion.motion.button
              type="button"
              key={stage.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onStageClick?.(stage)}
              className="group w-full text-left cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3 hover:border-cyan-300/30">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/35 via-emerald-500/25 to-amber-400/20 transition-all group-hover:from-cyan-400/45"
                  style={{ width: `${width}%` }}
                />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{stage.stage}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stage.conversion}% conversion, {stage.dropOff}% drop-off</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage.bottleneck && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Bottleneck
                      </span>
                    )}
                    <span className="text-2xl font-semibold text-slate-900 dark:text-white">{stage.count}</span>
                  </div>
                </div>
              </div>
            </Motion.motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function RecruiterLeaderboard({ data = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recruiter Performance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Leaderboard ranked by productivity score.</p>
        </div>
        <Trophy className="h-5 w-5 text-amber-300" />
      </div>
      <div className="space-y-3">
        {data.slice(0, 5).map((item) => (
          <div key={item.recruiter} className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-bold text-slate-900 dark:text-white dark:text-slate-950">{item.avatar || "R"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">#{item.rank} {item.recruiter}</p>
                  <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-200">{item.productivityScore}/100</p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.hires} hires</span>
                  <span>{item.interviews} interviews</span>
                  <span>{item.conversionRate}% conversion</span>
                </div>
              </div>
            </div>
            <div className="mt-3 h-9">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(item.trend || []).map((value, index) => ({ index, value }))}>
                  <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceAnalyticsChart({ data = [] }) {
  const hasData = data.some((item) => Number(item.candidates) > 0);
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Source Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Contribution, quality, and hire success by acquisition channel.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="h-72">
          {!hasData ? <ChartNoData label="No source data available" /> : (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="candidates" nameKey="source" innerRadius={64} outerRadius={98} paddingAngle={3}>
                {data.map((entry, index) => <Cell key={entry.source} fill={analyticsColors[index % analyticsColors.length]} />)}
              </Pie>
              <ChartTooltip content={<PremiumTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
        <div className="h-72">
          {!hasData ? <ChartNoData label="No source performance available" /> : (
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="source" type="category" stroke="#94a3b8" width={96} />
              <ChartTooltip content={<PremiumTooltip />} />
              <Bar dataKey="quality" name="Quality" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="hireSuccessRate" name="Hire Success" stackId="a" fill="#34d399" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export function HiringVelocityChart({ data = [] }) {
  const hasData = data.length > 0;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiring Velocity Analytics</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Department comparison for hiring speed and turnaround.</p>
      <div className="h-80">
        {!hasData ? <ChartNoData label="No velocity data available" /> : (
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="department" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <ChartTooltip content={<PremiumTooltip />} />
            <Bar dataKey="timeToFill" name="Time to fill" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            <Bar dataKey="timeToHire" name="Time to hire" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            <Line type="monotone" dataKey="interviewTurnaround" name="Interview turnaround" stroke="#34d399" strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function RecruitmentHealthScore({ health }) {
  const score = Number(health?.score) || 0;
  const chartData = [{ name: "health", value: score, fill: score >= 80 ? "#34d399" : score >= 65 ? "#fbbf24" : "#fb7185" }];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recruitment Health</h2>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="relative h-56">
          <ResponsiveContainer>
            <RadialBarChart innerRadius="72%" outerRadius="96%" data={chartData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "rgba(255,255,255,0.08)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{score}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">out of 100</span>
          </div>
        </div>
        <div className="space-y-3">
          {(health?.factors || []).map((factor) => (
            <div key={factor.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{factor.label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{factor.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.min(100, Math.max(0, factor.value))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InsightsPanel({ insights = [] }) {
  const iconMap = { warning: AlertTriangle, opportunity: Sparkles, trend: Zap, success: Brain };
  const styleMap = {
    warning: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    opportunity: "border-cyan-400/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
    trend: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-5 flex items-center gap-2">
        <Brain className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recruitment Insights Engine</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight) => {
          const Icon = iconMap[insight.type] || Brain;
          return (
            <div key={insight.title} className={cn("rounded-lg border p-4", styleMap[insight.type] || styleMap.trend)}>
              <div className="mb-3 flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{insight.title}</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{insight.description}</p>
                </div>
              </div>
              <div className="rounded-md bg-slate-100 dark:bg-black/20 p-3 text-xs text-slate-800 dark:text-slate-200">
                <span className="font-semibold">Recommendation:</span> {insight.recommendation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendChart({ data = [] }) {
  const hasData = data.length > 0;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiring Trend Analytics</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Monthly applications, interviews, offers, hires, and rejections.</p>
      <div className="h-80">
        {!hasData ? <ChartNoData label="No hiring trend data available" /> : (
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="applications" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <ChartTooltip content={<PremiumTooltip />} />
            <Area type="monotone" dataKey="applications" stroke="#38bdf8" fill="url(#applications)" strokeWidth={2} />
            <Line type="monotone" dataKey="interviews" stroke="#a78bfa" strokeWidth={2} />
            <Line type="monotone" dataKey="offers" stroke="#fbbf24" strokeWidth={2} />
            <Line type="monotone" dataKey="hires" stroke="#34d399" strokeWidth={2} />
            <Line type="monotone" dataKey="rejections" stroke="#fb7185" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function DepartmentDemandChart({ data = [], onClick }) {
  const hasData = data.length > 0;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Department Hiring Demand</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Open positions, staffing demand, urgency, and conversion.</p>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-80">
          {!hasData ? <ChartNoData label="No department demand data available" /> : (
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="department" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <ChartTooltip content={<PremiumTooltip />} />
              <Bar dataKey="openPositions" name="Open Positions" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="demandScore" name="Demand Score" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.slice(0, 10).map((dept) => (
            <button key={dept.department} onClick={() => onClick?.(dept)} className="rounded-md border border-slate-200 dark:border-white/10 p-3 text-left hover:border-cyan-300/30 cursor-pointer" style={{ backgroundColor: `rgba(56, 189, 248, ${Math.max(0.08, dept.demandScore / 260)})` }}>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{dept.department}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{dept.demandScore}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">{dept.openPositions} open positions</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DrillDownPanel({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">Drill-down analytics</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{item.department || item.stage || item.label}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:bg-white/10">Close</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {Object.entries(item).filter(([, value]) => typeof value === "number").slice(0, 4).map(([key, value]) => (
          <div key={key} className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-3">
            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExportCenter({ onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => onExport("csv")} variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10">
        <Download className="mr-2 h-4 w-4" /> CSV
      </Button>
      <Button onClick={() => onExport("excel")} variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-white/10">
        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
      </Button>
      <Button onClick={() => onExport("pdf")} className="bg-cyan-600 dark:bg-cyan-300 text-slate-900 dark:text-white dark:text-slate-950 hover:bg-cyan-700 dark:hover:bg-cyan-200">
        <FileText className="mr-2 h-4 w-4" /> PDF
      </Button>
    </div>
  );
}

export function AnalyticsTable({ title, rows = [], columns = [] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: columns[0]?.key, dir: "asc" });
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const text = query.toLowerCase();
    return rows
      .filter((row) => Object.values(row).join(" ").toLowerCase().includes(text))
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
        return sort.dir === "asc" ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? ""));
      });
  }, [rows, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key) => {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "asc" ? "desc" : "asc" }));
    setPage(0);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950/70 shadow-lg shadow-black/5 backdrop-blur-md overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 p-5 bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-sm md:text-base">{title}</h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Filter table records..." className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 pl-9 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-[10px] md:text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-5 py-3.5 text-left font-bold group">
                  <button 
                    type="button" 
                    onClick={() => toggleSort(column.key)} 
                    className="flex items-center gap-1.5 font-bold cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    {column.label}
                    {sort.key === column.key ? (
                      sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> : <ChevronDown className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <span className="opacity-0 group-hover:opacity-40 transition-opacity text-slate-400">↕</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {visible.length > 0 ? (
              visible.map((row, index) => (
                <tr key={`${title}-${index}`} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] even:bg-slate-50/20 dark:even:bg-white/[0.005] transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-5 py-3.5 font-medium">
                      {row[column.key] !== undefined && row[column.key] !== null ? String(row[column.key]) : "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 p-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/20 dark:bg-white/[0.005]">
        <span>Showing {visible.length} of {filtered.length} rows</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Page {page + 1} of {pages}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10" disabled={page + 1 >= pages} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-[138px] rounded-lg border border-slate-200 dark:border-white/10 bg-card/70 p-4">
          <div className="dark-shimmer h-4 w-28 rounded" />
          <div className="dark-shimmer mt-4 h-8 w-16 rounded" />
          <div className="dark-shimmer mt-5 h-5 rounded" />
          <div className="dark-shimmer mt-4 h-3 w-36 rounded" />
        </div>
      ))}
    </div>
  );
}
