import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import taskService from "@/services/taskService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  X,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import CreateTaskModal from "@/components/ui/CreateTaskModal"
import { StatsCard } from "@/components/ui/stats-card"
const TASK_STATUS = {
  TO_DO:       "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE:        "DONE",
}

const STATUS_TRANSITIONS = {
  [TASK_STATUS.TO_DO]:       [TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.DONE],
  [TASK_STATUS.DONE]:        [],
}

const STATUS_LABELS = {
  [TASK_STATUS.TO_DO]:       "To Do",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.DONE]:        "Done",
}

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }


const MyTasks = () => {
  const { user } = useAuth()

  const CREATOR_ROLES = ["HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "ADMIN", "SUPER_ADMIN"]
  const canCreateTask = CREATOR_ROLES.includes(user?.role?.toUpperCase())

  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [searchQuery, setSearchQuery]   = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterPriority, setFilterPriority] = useState("ALL")
  const [sortBy, setSortBy]             = useState("dueDate")
  const [activeCard, setActiveCard]     = useState("total")

  const [statusDialog, setStatusDialog] = useState({ open: false, task: null, newStatus: null })
  const [detailsDialog, setDetailsDialog] = useState({ open: false, task: null, intData: null })

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await taskService.getMyTasks()
      const data = res?.data ?? res
      setTasks(Array.isArray(data) ? data : data?.tasks ?? [])
    } catch (err) {
      console.error("Failed to fetch tasks:", err)
      toast.error("Could not load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return {
      total:     tasks.length,
      completed: tasks.filter(t => t.status === TASK_STATUS.DONE).length,
      pending:   tasks.filter(t => t.status === TASK_STATUS.TO_DO).length,
      inProgress:tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
      overdue:   tasks.filter(t =>
        t.status !== TASK_STATUS.DONE &&
        t.dueDate &&
        new Date(t.dueDate) < today
      ).length,
    }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== "ALL") {
      result = result.filter(t => t.status === filterStatus)
    }
    if (filterPriority !== "ALL") {
      result = result.filter(t => t.priority?.toUpperCase() === filterPriority)
    }

    if (activeCard === "completed") {
      result = result.filter(t => t.status === TASK_STATUS.DONE)
    }
    if (activeCard === "inProgress") {
      result = result.filter(t => t.status === TASK_STATUS.IN_PROGRESS)
    }
    if (activeCard === "overdue") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      result = result.filter(t => t.status !== TASK_STATUS.DONE && t.dueDate && new Date(t.dueDate) < today)
    }

    result.sort((a, b) => {
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      if (sortBy === "priority") {
        return (PRIORITY_ORDER[a.priority?.toUpperCase()] ?? 99) -
               (PRIORITY_ORDER[b.priority?.toUpperCase()] ?? 99)
      }
      return 0
    })

    return result
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy, activeCard])

  const handleStatusUpdate = async () => {
    const { task, newStatus } = statusDialog
    if (!task || !newStatus) return

    setUpdating(task._id)
    setStatusDialog({ open: false, task: null, newStatus: null })

    const previousTasks = tasks
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t))

    try {
      await taskService.updateTaskStatus(task._id, newStatus)
      toast.success(`Task moved to "${STATUS_LABELS[newStatus]}"`)
    } catch (err) {
      setTasks(previousTasks) 
      toast.error(err?.response?.data?.error || "Failed to update task status")
    } finally {
      setUpdating(null)
    }
  }

  const openStatusDialog = (task, newStatus) => {
    setStatusDialog({ open: true, task, newStatus })
  }

  const handleCreateTask = async (payload) => {
    try {
      const res     = await taskService.createTask(payload)
      const created = res?.data ?? res
      setTasks(prev => [created, ...prev])
      setIsCreateOpen(false)
      toast.success("Task created and assigned")
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to create task")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return "Invalid date"
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  }

  const isOverdue = (task) => {
    if (task.status === TASK_STATUS.DONE || !task.dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(task.dueDate) < today
  }

  const getAssignerName = (assignedBy) => {
    if (!assignedBy) return "Unknown"
    if (assignedBy.firstName) return `${assignedBy.firstName} ${assignedBy.lastName || ""}`.trim()
    return "Manager"
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case TASK_STATUS.DONE:        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
      case TASK_STATUS.IN_PROGRESS: return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
      case TASK_STATUS.TO_DO:       return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:                       return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":   return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50"
      case "MEDIUM": return "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800/50"
      case "LOW":    return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50"
      default:        return "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/30 dark:border-slate-800/50"
    }
  }

  const getInterviewData = (task) => {
    if (task.interviewDetails?.candidateName) {
      return task.interviewDetails;
    }
    
    if (task.title?.startsWith("Interview:") || task.description?.includes("Candidate Name:")) {
      const desc = task.description || "";
      const extract = (label) => {
        const regex = new RegExp(`${label}:\\s*(.*)`);
        const match = desc.match(regex);
        return match ? match[1].trim() : null;
      };
      
      const candidateName = extract("Candidate Name") || task.title.replace("Interview: ", "").trim();
      const interviewDate = extract("Interview Date");
      const startTime = extract("Start Time");
      const endTime = extract("End Time");
      const mode = extract("Interview Mode");
      const meetingLink = extract("Meeting Link");
      const rawInst = extract("Interview Instructions");
      const instructions = rawInst && rawInst !== "None" ? rawInst.split(',').map(s => s.trim()) : [];
      const interviewStatus = extract("Interview Status") || "Upcoming";
      
      if (interviewDate && startTime) {
        return {
          candidateName,
          interviewDate,
          startTime,
          endTime,
          mode,
          meetingLink,
          instructions,
          interviewStatus,
          interviewerName: null, 
        };
      }
    }
    
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  const hasActiveFilters = filterStatus !== "ALL" || filterPriority !== "ALL" || searchQuery.trim() || activeCard !== "total"

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground font-medium">
              {stats.total} task{stats.total !== 1 ? "s" : ""} assigned to you
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreateTask
              ? "Create and manage tasks for your team."
              : "Manage your assigned work and deadlines."}
          </p>
        </div>

        {canCreateTask && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          icon={<ListTodo className="h-8 w-8" />}
          variant="blue"
          isActive={activeCard === "total"}
          onClick={() => setActiveCard(activeCard === "total" ? "total" : "total")}
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-8 w-8" />}
          variant="green"
          isActive={activeCard === "completed"}
          onClick={() => setActiveCard(activeCard === "completed" ? "total" : "completed")}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Clock className="h-8 w-8" />}
          variant="amber"
          isActive={activeCard === "inProgress"}
          onClick={() => setActiveCard(activeCard === "inProgress" ? "total" : "inProgress")}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={<AlertCircle className="h-8 w-8" />}
          variant="orange"
          isActive={activeCard === "overdue"}
          onClick={() => setActiveCard(activeCard === "overdue" ? "total" : "overdue")}
        />
      </div>

      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4 text-blue-500" />
              Assigned Task List
            </CardTitle>

            <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    {filterStatus === "ALL" ? "Status" : STATUS_LABELS[filterStatus]}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus("ALL")}>All statuses</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <DropdownMenuItem key={val} onClick={() => setFilterStatus(val)}>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    {filterPriority === "ALL" ? "Priority" : filterPriority}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterPriority("ALL")}>All priorities</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {["HIGH","MEDIUM","LOW"].map(p => (
                    <DropdownMenuItem key={p} onClick={() => setFilterPriority(p)}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    {sortBy === "dueDate" ? "Sort: Due Date" : "Sort: Priority"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("dueDate")}>
                    Due Date {sortBy === "dueDate" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("priority")}>
                    Priority {sortBy === "priority" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => { setSearchQuery(""); setFilterStatus("ALL"); setFilterPriority("ALL") }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ListTodo className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {hasActiveFilters
                  ? "No tasks match your current filters."
                  : "No tasks assigned to you yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Task</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Priority</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Assigner / Interviewer</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Due Date</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Int. Date</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Int. Time</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Int. Mode</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Status</th>
                    <th className="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredTasks.map((task) => {
                    const overdue = isOverdue(task)
                    const availableTransitions = STATUS_TRANSITIONS[task.status] ?? []
                    const intData = getInterviewData(task)

                    return (
                      <tr
                        key={task._id}
                        className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-2 py-3.5 align-top">
                          <div className="flex flex-col gap-0.5 max-w-[200px]">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight whitespace-normal break-words">
                              {intData?.candidateName 
                                ? `Interview with ${intData.candidateName}`
                                : task.title}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {task.description}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 bg-slate-100 dark:bg-slate-800 w-fit px-1.5 py-0.5 rounded font-mono">
                              {task._id?.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </td>

                        <td className="px-2 py-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", {
                              "bg-red-500":    task.priority?.toUpperCase() === "HIGH",
                              "bg-yellow-500": task.priority?.toUpperCase() === "MEDIUM",
                              "bg-blue-400":   task.priority?.toUpperCase() === "LOW",
                            })} />
                            <Badge variant="outline" className={getPriorityStyle(task.priority)}>
                              {task.priority
                                ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase()
                                : "—"}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 align-top">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                              {(intData?.interviewerName 
                                ? intData.interviewerName 
                                : getAssignerName(task.assignedBy)).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {intData?.interviewerName 
                                ? intData.interviewerName 
                                : getAssignerName(task.assignedBy)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 align-top">
                          <div className={cn("flex items-center gap-1.5 text-sm", overdue ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400")}>
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span className="tabular-nums font-medium">{formatDate(task.dueDate)}</span>
                            {overdue && (
                              <span className="text-[10px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 align-top">
                          {intData?.candidateName ? (
                            <span className="text-sm font-medium">{formatDate(intData.interviewDate)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          {intData?.candidateName ? (
                            <span className="text-sm">{intData.startTime} - {intData.endTime}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          {intData?.candidateName ? (
                            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {intData.mode}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-2 py-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", {
                              "bg-emerald-500": task.status === TASK_STATUS.DONE,
                              "bg-blue-500":    task.status === TASK_STATUS.IN_PROGRESS,
                              "bg-slate-400":   task.status === TASK_STATUS.TO_DO,
                            })} />
                            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 border font-normal", getStatusStyle(task.status))}>
                              {STATUS_LABELS[task.status] ?? task.status}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-2 py-3.5 whitespace-nowrap text-right">
                          {updating === task._id ? (
                            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {intData?.candidateName && (
                                  <>
                                    <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, task, intData })}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {availableTransitions.length > 0 ? (
                                  <>
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                                      Move to
                                    </div>
                                    {availableTransitions.map(s => (
                                      <DropdownMenuItem
                                        key={s}
                                        onClick={() => openStatusDialog(task, s)}
                                      >
                                        {STATUS_LABELS[s]}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                ) : (
                                  <DropdownMenuItem disabled className="text-muted-foreground">
                                    Task completed
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {canCreateTask && (
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateTask}
        />
      )}

      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => !open && setStatusDialog({ open: false, task: null, newStatus: null })}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Move <span className="font-semibold text-foreground">&quot;{statusDialog.task?.title}&quot;</span> to{" "}
            <span className="font-semibold text-foreground">
              {STATUS_LABELS[statusDialog.newStatus]}
            </span>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialog({ open: false, task: null, newStatus: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) => !open && setDetailsDialog({ open: false, task: null, intData: null })}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.intData?.candidateName ? (
            <div className="space-y-4 text-sm">
              <div>
                <strong className="block text-muted-foreground mb-1">Meeting Link</strong>
                {detailsDialog.intData.mode === 'Online' && detailsDialog.intData.meetingLink !== 'N/A' ? (
                  <a href={detailsDialog.intData.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block">
                    {detailsDialog.intData.meetingLink}
                  </a>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <div>
                <strong className="block text-muted-foreground mb-1">Instructions</strong>
                {detailsDialog.intData.instructions?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {detailsDialog.intData.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
              <div>
                <strong className="block text-muted-foreground mb-1">Interview Status</strong>
                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {detailsDialog.intData.interviewStatus || "Upcoming"}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <p>{detailsDialog.task?.description || "No additional details."}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog({ open: false, task: null, intData: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default MyTasks