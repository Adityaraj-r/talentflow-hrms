import { useState, useEffect, useCallback, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, AlertCircle, RefreshCw, Search, Filter,
  ChevronDown, Calendar, User, Clock, CheckCircle2,
  BarChart2, X, MessageSquare, Activity, Send, AlertTriangle,
  MoreHorizontal, Eye, Trash2, ArrowRight,
} from "lucide-react"
import CreateTaskModal from "@/components/ui/CreateTaskModal"
import { StatsCard } from "@/components/ui/stats-card"
import taskService from "@/services/taskService"
import { toast } from "sonner"
import { format, isPast, isToday, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"


export const TASK_STATUS = {
  TO_DO:       "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE:        "DONE",
}

const COLUMNS = [
  {
    id:        TASK_STATUS.TO_DO,
    title:     "To Do",
    accent:    "border-t-slate-400 dark:border-t-slate-500",
    headerBg:  "bg-slate-50 dark:bg-slate-900/40",
    countBg:   "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
    dropBg:    "bg-slate-100/60 dark:bg-slate-800/40",
  },
  {
    id:        TASK_STATUS.IN_PROGRESS,
    title:     "In Progress",
    accent:    "border-t-blue-500",
    headerBg:  "bg-blue-50/60 dark:bg-blue-900/20",
    countBg:   "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    dropBg:    "bg-blue-50/40 dark:bg-blue-900/30",
  },
  {
    id:        TASK_STATUS.DONE,
    title:     "Done",
    accent:    "border-t-emerald-500",
    headerBg:  "bg-emerald-50/60 dark:bg-emerald-900/20",
    countBg:   "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    dropBg:    "bg-emerald-50/40 dark:bg-emerald-900/30",
  },
]

const PRIORITY_CONFIG = {
  HIGH:   { label: "High",   cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",           dot: "bg-red-500" },
  MEDIUM: { label: "Medium", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", dot: "bg-amber-500" },
  LOW:    { label: "Low",    cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",       dot: "bg-blue-500" },
}

const STATUS_CONFIG = {
  TO_DO:       { label: "To Do",       cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  DONE:        { label: "Done",        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
}


const getInitials = (user) =>
  `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?"

const getFullName = (user) => {
  if (!user) return "Unassigned"
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unknown"
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
]
const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const getDueInfo = (dateStr, status) => {
  if (status === TASK_STATUS.DONE || !dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  if (isToday(d)) return { label: "Due today",  cls: "text-amber-600 dark:text-amber-400", warn: true }
  if (isPast(d))  return { label: `${Math.abs(differenceInDays(d, new Date()))}d overdue`, cls: "text-red-600 dark:text-red-400", overdue: true }
  const diff = differenceInDays(d, new Date())
  if (diff <= 3)  return { label: `${diff}d left`, cls: "text-orange-600 dark:text-orange-400", soon: true }
  return { label: format(d, "dd MMM yyyy"), cls: "text-muted-foreground" }
}


const Avatar = ({ user, size = "sm" }) => {
  const name = getFullName(user)
  const sz   = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0 ${avatarColor(name)}`}>
      {getInitials(user)}
    </div>
  )
}


const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority?.toUpperCase()] ?? PRIORITY_CONFIG.MEDIUM
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}



const TaskCardItem = ({ task, onView, onDelete }) => {
  const dueInfo  = getDueInfo(task.dueDate, task.status)
  const assignee = task.assignedTo
  const shortId  = task._id?.slice(-5).toUpperCase()

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 cursor-grab active:cursor-grabbing select-none">

      <div className="flex items-center justify-between mb-2">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-muted-foreground/50">#{shortId}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-40">
              <DropdownMenuItem onClick={() => onView(task)}>
                <Eye className="w-3.5 h-3.5 mr-2" /> View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400 focus:text-red-600"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2">
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {dueInfo && (
        <div className={`flex items-center gap-1 text-[11px] font-medium mb-2 ${dueInfo.cls}`}>
          {dueInfo.overdue || dueInfo.warn
            ? <AlertTriangle className="w-3 h-3" />
            : <Calendar className="w-3 h-3" />}
          {dueInfo.label}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar user={assignee} />
          <span className="text-xs text-muted-foreground truncate max-w-[110px]">
            {getFullName(assignee)}
          </span>
        </div>
        {task.comments?.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <MessageSquare className="w-3 h-3" />
            {task.comments.length}
          </span>
        )}
      </div>
    </div>
  )
}


const TaskDetailDrawer = ({ task, onClose, onStatusChange, onDelete }) => {
  const [comment, setComment]   = useState("")
  const [comments, setComments] = useState(task?.comments ?? [])

  if (!task) return null

  const statusCfg  = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TO_DO
  const dueInfo    = getDueInfo(task.dueDate, task.status)

  const handleComment = () => {
    if (!comment.trim()) return
    setComments(prev => [...prev, {
      _id: Date.now().toString(),
      text: comment.trim(),
      createdAt: new Date().toISOString(),
      author: { firstName: "You", lastName: "" },
    }])
    setComment("")
    toast.success("Comment added")
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 w-full max-w-[480px] h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">

        <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground mb-0.5">
              TASK #{task._id?.slice(-6).toUpperCase()}
            </p>
            <h2 className="text-sm font-semibold text-foreground leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
              <PriorityBadge priority={task.priority} />
              {dueInfo?.overdue && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Overdue
                </span>
              )}
            </div>
            {task.description && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  title: "Assigned To", content: (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar user={task.assignedTo} size="md" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{getFullName(task.assignedTo)}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {task.assignedTo?.role?.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  title: "Created By", content: (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar user={task.assignedBy} size="md" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{getFullName(task.assignedBy)}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {task.assignedBy?.role?.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  title: "Due Date", content: (
                    <p className={`text-xs font-semibold mt-1 ${dueInfo?.overdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                      {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "No deadline"}
                    </p>
                  )
                },
                {
                  title: "Created", content: (
                    <p className="text-xs font-semibold text-foreground mt-1">
                      {task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy") : "—"}
                    </p>
                  )
                },
              ].map(({ title, content }) => (
                <div key={title} className="bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
                  {content}
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Move to</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const ALLOWED = {
                    TO_DO:       [TASK_STATUS.IN_PROGRESS],
                    IN_PROGRESS: [TASK_STATUS.DONE],
                    DONE:        [TASK_STATUS.IN_PROGRESS], 
                  }
                  const allowed = ALLOWED[task.status] ?? []
                  return allowed.map(k => (
                    <button
                      key={k}
                      onClick={() => onStatusChange(task._id, k)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                      {STATUS_CONFIG[k].label}
                      {task.status === TASK_STATUS.DONE && (
                        <span className="text-[9px] text-muted-foreground ml-0.5">(reopen)</span>
                      )}
                    </button>
                  ))
                })()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Activity · {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-2.5 mb-3 max-h-44 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    No comments yet.
                  </p>
                ) : (
                  comments.map(c => (
                    <div key={c._id} className="flex gap-2">
                      <Avatar user={c.author} />
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          <span className="font-semibold">{getFullName(c.author)}</span>
                          {c.createdAt && <span className="ml-1">· {format(new Date(c.createdAt), "dd MMM, HH:mm")}</span>}
                        </p>
                        <p className="text-xs text-foreground">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
                  className="text-xs h-8"
                />
                <Button size="sm" className="h-8 px-2.5 shrink-0" onClick={handleComment} disabled={!comment.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="border border-red-200 dark:border-red-900/60 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                Danger Zone
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => { onClose(); onDelete(task) }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete this task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


const DeleteDialog = ({ task, onConfirm, onCancel }) => (
  <Dialog open={!!task} onOpenChange={onCancel}>
    <DialogContent className="sm:max-w-[360px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="w-4 h-4" /> Delete Task
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Delete <span className="font-semibold text-foreground">"{task?.title}"</span>?
        This action cannot be undone.
      </p>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" size="sm" onClick={() => onConfirm(task)}>Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)


const EmptyColumn = ({ status }) => {
  const msg = {
    TO_DO:       { emoji: "📋", title: "Nothing queued",      sub: "Create a task to get started" },
    IN_PROGRESS: { emoji: "⚡", title: "No active work",       sub: "Drag a task here to start it" },
    DONE:        { emoji: "✅", title: "Nothing completed yet", sub: "Finished tasks appear here" },
  }[status] ?? { emoji: "📋", title: "No tasks", sub: "" }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
      <span className="text-2xl mb-2">{msg.emoji}</span>
      <p className="text-sm font-medium text-muted-foreground">{msg.title}</p>
      {msg.sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{msg.sub}</p>}
    </div>
  )
}


const TaskBoard = () => {
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [dragging, setDragging]     = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [search, setSearch]                   = useState("")
  const [filterPriority, setFilterPriority]   = useState("ALL")
  const [filterAssignee, setFilterAssignee]   = useState("ALL")
  const [activeCard, setActiveCard]           = useState("total")

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res  = await taskService.getAllTasks()
      const data = res?.data ?? res
      setTasks(Array.isArray(data) ? data : data?.tasks ?? [])
    } catch (err) {
      console.error("TaskBoard:", err)
      setError("Could not load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])


  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const total   = tasks.length
    const done    = tasks.filter(t => t.status === TASK_STATUS.DONE).length
    const active  = tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length
    const overdue = tasks.filter(t => t.status !== TASK_STATUS.DONE && t.dueDate && new Date(t.dueDate) < today).length
    const rate    = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, active, overdue, rate }
  }, [tasks])


  const assigneeOptions = useMemo(() => {
    const map = new Map()
    tasks.forEach(t => { if (t.assignedTo?._id) map.set(t.assignedTo._id, t.assignedTo) })
    return Array.from(map.values())
  }, [tasks])


  const filtered = useMemo(() => {
    let r = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        getFullName(t.assignedTo).toLowerCase().includes(q)
      )
    }
    if (filterPriority !== "ALL") r = r.filter(t => t.priority?.toUpperCase() === filterPriority)
    if (filterAssignee !== "ALL") r = r.filter(t => t.assignedTo?._id === filterAssignee)
    
    if (activeCard === "active") r = r.filter(t => t.status === TASK_STATUS.IN_PROGRESS)
    if (activeCard === "done") r = r.filter(t => t.status === TASK_STATUS.DONE)
    if (activeCard === "overdue") {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      r = r.filter(t => t.status !== TASK_STATUS.DONE && t.dueDate && new Date(t.dueDate) < today)
    }

    return r
  }, [tasks, search, filterPriority, filterAssignee, activeCard])

  const hasFilters = search || filterPriority !== "ALL" || filterAssignee !== "ALL" || activeCard !== "total"


  const handleDragEnd = async (result) => {
    setDragging(false)
    if (!result.destination) return
    const { draggableId, source, destination } = result
    if (source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId
    const prev = tasks
    setTasks(t => t.map(x => x._id === draggableId ? { ...x, status: newStatus } : x))
    setSelectedTask(s => s?._id === draggableId ? { ...s, status: newStatus } : s)

    try {
      await taskService.updateTaskStatus(draggableId, newStatus)
      toast.success(`Moved to "${STATUS_CONFIG[newStatus]?.label}"`)
    } catch {
      setTasks(prev)
      toast.error("Status update failed")
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    const prev = tasks
    setTasks(t => t.map(x => x._id === taskId ? { ...x, status: newStatus } : x))
    setSelectedTask(s => s?._id === taskId ? { ...s, status: newStatus } : s)
    try {
      await taskService.updateTaskStatus(taskId, newStatus)
      toast.success(`Moved to "${STATUS_CONFIG[newStatus]?.label}"`)
    } catch {
      setTasks(prev)
      toast.error("Status update failed")
    }
  }

  const handleCreate = async (payload) => {
    try {
      const res     = await taskService.createTask(payload)
      const created = res?.data ?? res
      setTasks(prev => [created, ...prev])
      setIsCreateOpen(false)
      toast.success("Task created and assigned")
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create task. Please try again."
      toast.error(msg)
    }
  }

  const handleDeleteConfirm = async (task) => {
    try {
      await taskService.deleteTask(task._id)
      setTasks(prev => prev.filter(t => t._id !== task._id))
      setTaskToDelete(null)
      setSelectedTask(s => s?._id === task._id ? null : s)
      toast.success("Task deleted")
    } catch {
      toast.error("Could not delete task")
    }
  }


  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading task board...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTasks}>
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry
        </Button>
      </div>
    </div>
  )


  return (
    <div className="space-y-5 pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground font-medium">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} across your team
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Task Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tasks using Kanban board</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          icon={<BarChart2 className="h-8 w-8" />}
          variant="blue"
          isActive={activeCard === "total"}
          onClick={() => setActiveCard(activeCard === "total" ? "total" : "total")}
        />
        <StatsCard
          title="In Progress"
          value={stats.active}
          icon={<Clock className="h-8 w-8" />}
          variant="amber"
          isActive={activeCard === "active"}
          onClick={() => setActiveCard(activeCard === "active" ? "total" : "active")}
        />
        <StatsCard
          title="Completed"
          value={stats.done}
          icon={<CheckCircle2 className="h-8 w-8" />}
          variant="green"
          isActive={activeCard === "done"}
          onClick={() => setActiveCard(activeCard === "done" ? "total" : "done")}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={<AlertTriangle className="h-8 w-8" />}
          variant="orange"
          isActive={activeCard === "overdue"}
          onClick={() => setActiveCard(activeCard === "overdue" ? "total" : "overdue")}
        />
      </div>

      {stats.total > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Overall Progress</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{stats.rate}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <div className="flex gap-5 mt-3">
            {[
              { label: "To Do",       value: tasks.filter(t => t.status === TASK_STATUS.TO_DO).length,       dot: "bg-slate-400" },
              { label: "In Progress", value: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length, dot: "bg-blue-500" },
              { label: "Done",        value: stats.done,                                                       dot: "bg-emerald-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {s.label}: <span className="font-semibold text-slate-800 dark:text-slate-200">{s.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks or assignees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm">
              <Filter className="w-3.5 h-3.5" />
              {filterPriority === "ALL" ? "Priority" : PRIORITY_CONFIG[filterPriority]?.label}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterPriority("ALL")}>All priorities</DropdownMenuItem>
            <DropdownMenuSeparator />
            {["HIGH", "MEDIUM", "LOW"].map(p => (
              <DropdownMenuItem key={p} onClick={() => setFilterPriority(p)}>
                <span className={`w-2 h-2 rounded-full mr-2 ${PRIORITY_CONFIG[p].dot}`} />
                {PRIORITY_CONFIG[p].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {assigneeOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm">
                <User className="w-3.5 h-3.5" />
                {filterAssignee === "ALL"
                  ? "Assignee"
                  : getFullName(assigneeOptions.find(u => u._id === filterAssignee))}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-52 overflow-y-auto">
              <DropdownMenuItem onClick={() => setFilterAssignee("ALL")}>All assignees</DropdownMenuItem>
              <DropdownMenuSeparator />
              {assigneeOptions.map(u => (
                <DropdownMenuItem key={u._id} onClick={() => setFilterAssignee(u._id)}>
                  <div className="flex items-center gap-2">
                    <Avatar user={u} />
                    <span className="text-xs">{getFullName(u)}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {hasFilters && (
          <>
            <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground"
              onClick={() => { setSearch(""); setFilterPriority("ALL"); setFilterAssignee("ALL") }}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {tasks.length} shown
            </span>
          </>
        )}
      </div>

      <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="flex flex-col">

                <div className={`${col.headerBg} border border-slate-200 dark:border-slate-800 border-t-[3px] ${col.accent} rounded-xl px-4 py-3 mb-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{col.title}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
                      {colTasks.length}
                    </span>
                  </div>
                  {col.id === TASK_STATUS.DONE && stats.total > 0 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${stats.rate}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{stats.rate}% of all tasks done</p>
                    </div>
                  )}
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 min-h-[440px] rounded-xl p-2 transition-colors duration-150 ${
                        snapshot.isDraggingOver
                          ? `${col.dropBg} ring-2 ring-inset ring-slate-300 dark:ring-slate-600`
                          : "bg-slate-50/40 dark:bg-slate-900/10"
                      }`}
                    >
                      {colTasks.map((task, idx) => (
                        <Draggable key={task._id} draggableId={task._id} index={idx}>
                          {(provided, snap) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform duration-100 ${snap.isDragging ? "rotate-1 scale-[1.02] z-50" : ""}`}
                            >
                              <TaskCardItem
                                task={task}
                                onView={t => setSelectedTask(t)}
                                onDelete={t => setTaskToDelete(t)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <EmptyColumn status={col.id} />
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onDelete={t => { setSelectedTask(null); setTaskToDelete(t) }}
        />
      )}

      <DeleteDialog
        task={taskToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  )
}

export default TaskBoard