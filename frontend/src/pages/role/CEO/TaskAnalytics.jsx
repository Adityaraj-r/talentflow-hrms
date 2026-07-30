import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"
import taskService from "@/services/taskService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart2, CheckCircle2, Clock, AlertTriangle,
  ListTodo, TrendingUp, Eye, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ROLES } from "@/constants/roles"
import { StatsCard } from "@/components/ui/stats-card"

const PriorityBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />
          <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span className="text-slate-500 dark:text-slate-400 text-xs">{count} task{count !== 1 ? "s" : ""}</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}


const TaskAnalytics = () => {
  const { user } = useUser()
  const rawRole  = typeof user?.role === "string" ? user.role : user?.role?.name
  const userRole = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isCountryManager = userRole === ROLES.COUNTRY_MANAGER

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res  = await taskService.getTaskAnalytics()
      const data = res?.data ?? res
      setAnalytics(data)
    } catch (err) {
      console.error("TaskAnalytics fetch error:", err)
      setError("Could not load task analytics. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const completionRate = analytics?.total > 0
    ? Math.round((analytics.completed / analytics.total) * 100)
    : 0

  const getPriorityCount = (level) => {
    if (!analytics?.byPriority) return 0
    const found = analytics.byPriority.find(
      p => p.priority?.toUpperCase() === level
    )
    return found?.count ?? 0
  }

  const highCount   = getPriorityCount("HIGH")
  const mediumCount = getPriorityCount("MEDIUM")
  const lowCount    = getPriorityCount("LOW")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading task analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <AlertTriangle className="w-10 h-10 text-destructive opacity-70" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground font-medium">
              {isCountryManager ? "Region-scoped view" : "Organisation-wide view"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Task Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only strategic overview of task progress and workload distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Read Only
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={analytics?.total ?? 0}
          icon={<ListTodo className="h-8 w-8" />}
          variant="blue"
        />
        <StatsCard
          title="In Progress"
          value={analytics?.inProgress ?? 0}
          icon={<Clock className="h-8 w-8" />}
          variant="amber"
        />
        <StatsCard
          title="Completed"
          value={analytics?.completed ?? 0}
          icon={<CheckCircle2 className="h-8 w-8" />}
          variant="green"
        />
        <StatsCard
          title="Overdue"
          value={analytics?.overdue ?? 0}
          icon={<AlertTriangle className="h-8 w-8" />}
          variant={analytics?.overdue > 0 ? "red" : "orange"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Completion Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">

            <div className="flex items-end gap-3">
              <p className="text-5xl font-bold text-slate-900 dark:text-white tabular-nums">
                {completionRate}%
              </p>
              <p className="text-sm text-muted-foreground mb-2 leading-tight">
                of all tasks<br />completed
              </p>
            </div>

            <div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: "To Do",       value: analytics?.toDo      ?? 0, dot: "bg-slate-400",   text: "text-slate-600 dark:text-slate-400" },
                { label: "In Progress", value: analytics?.inProgress ?? 0, dot: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400" },
                { label: "Done",        value: analytics?.completed  ?? 0, dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                  <p className={cn("text-xl font-bold tabular-nums", s.text)}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">

            {analytics?.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart2 className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No tasks to analyse yet.</p>
              </div>
            ) : (
              <>
                <PriorityBar
                  label="High Priority"
                  count={highCount}
                  total={analytics?.total ?? 0}
                  color="bg-red-500"
                />
                <PriorityBar
                  label="Medium Priority"
                  count={mediumCount}
                  total={analytics?.total ?? 0}
                  color="bg-amber-500"
                />
                <PriorityBar
                  label="Low Priority"
                  count={lowCount}
                  total={analytics?.total ?? 0}
                  color="bg-blue-400"
                />

                {analytics?.overdue > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        {analytics.overdue} task{analytics.overdue !== 1 ? "s" : ""} overdue
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                        These tasks are past their due date and not yet completed.
                        Escalate to the relevant Project Manager or HR Manager.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Workforce Task Health
            {isCountryManager && (
              <Badge variant="outline" className="ml-2 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                Region Scoped
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className={cn(
              "rounded-xl p-4 border",
              completionRate >= 70
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                : completionRate >= 40
                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            )}>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide mb-1",
                completionRate >= 70 ? "text-emerald-700 dark:text-emerald-400"
                : completionRate >= 40 ? "text-amber-700 dark:text-amber-400"
                : "text-red-700 dark:text-red-400"
              )}>Completion Health</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {completionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {completionRate >= 70 ? "On track — good execution rate"
                 : completionRate >= 40 ? "Moderate — monitor closely"
                 : "Below target — review workload"}
              </p>
            </div>

            <div className={cn(
              "rounded-xl p-4 border",
              analytics?.overdue === 0
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                : analytics?.overdue <= 2
                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            )}>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide mb-1",
                analytics?.overdue === 0 ? "text-emerald-700 dark:text-emerald-400"
                : analytics?.overdue <= 2 ? "text-amber-700 dark:text-amber-400"
                : "text-red-700 dark:text-red-400"
              )}>Overdue Status</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {analytics?.overdue ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.overdue === 0 ? "No overdue tasks — excellent"
                 : analytics?.overdue <= 2 ? "Minor delays — action recommended"
                 : "Critical delays — immediate escalation needed"}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-blue-700 dark:text-blue-400">
                Active Workload
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {analytics?.inProgress ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks currently being worked on across the{" "}
                {isCountryManager ? "region" : "organisation"}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

    </div>
  )
}

export default TaskAnalytics