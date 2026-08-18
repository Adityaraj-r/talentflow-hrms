import { PriorityDot } from "@/components/ui/PriorityDot";
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
  Eye,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Video,
  MapPin,
  ClipboardList,
  CircleDashed,
  LayoutGrid,
  CheckCircle,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import CreateTaskModal from "@/components/ui/CreateTaskModal"
import InterviewTaskModal from "@/components/ui/InterviewTaskModal"

import { StatsCard } from "@/components/ui/stats-card"
import { Pagination } from "@/components/ui/pagination"
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
  
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const [statusDialog, setStatusDialog] = useState({ open: false, task: null, newStatus: null })
  const [detailsDialog, setDetailsDialog] = useState({ open: false, task: null, intData: null })
  const [interviewModal, setInterviewModal] = useState({ open: false, task: null, intData: null })


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
      result = result.filter(t => String(t.priority || "").toUpperCase() === filterPriority)
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
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterPriority, sortBy])
  
  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage)
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

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
      case TASK_STATUS.IN_PROGRESS: return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50"
      case TASK_STATUS.TO_DO:       return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:                       return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":   return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50"
      case "MEDIUM": return "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800/50"
      case "LOW":    return "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800/50"
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
      
      const officeName = extract("Office Name");
      const fullAddress = extract("Full Address");
      const buildingFloor = extract("Building/Floor");
      const roomNumber = extract("Room Number");
      const city = extract("City");
      const state = extract("State");
      const pinCode = extract("PIN Code");

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
          officeName,
          fullAddress,
          buildingFloor,
          roomNumber,
          city,
          state,
          pinCode,
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
          <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  const hasActiveFilters = filterStatus !== "ALL" || filterPriority !== "ALL" || searchQuery.trim()

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm: text-2xl">
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your assigned work and deadlines.
          </p>
        </div>

        {canCreateTask && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">To do</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <CircleDashed className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pending}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Acknowledged</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">In progress</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Done</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completed}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-2 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-4 top-1.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks, assignees, projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-7 text-sm bg-transparent border-none focus-visible:ring-0 shadow-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-full bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                {filterStatus === "ALL" ? "All status" : STATUS_LABELS[filterStatus]}
                <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus("ALL")}>All statuses</DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <DropdownMenuItem key={val} onClick={() => setFilterStatus(val)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-9 px-4 rounded-full bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 hidden sm:flex whitespace-nowrap">
             <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" /> All projects <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
          </Button>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-100 dark:border-slate-700 h-9">
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
              <ListTodo className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-full bg-slate-50 dark:bg-slate-800 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">
             All projects <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">

        <div className="p-0">
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
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[30%]">TITLE</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[18%]">ASSIGNEES</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[12%]">PRIORITY</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[15%]">STATUS</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[12%]">ASSIGNED</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[13%]">DUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTasks.map((task) => {
                    const intData = getInterviewData(task)

                    return (
                      <tr
                        key={task._id}
                        className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => {
                          if (intData?.candidateName) {
                            setInterviewModal({ open: true, task, intData });
                          } else {
                            setDetailsDialog({ open: true, task, intData });
                          }
                        }}
                      >
                        <td className="px-5 py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              {intData?.candidateName 
                                ? `Interview with ${intData.candidateName}`
                                : task.title}
                            </span>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              {intData ? "Recruitment" : (task.project || "V-ONE - HRMS")}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                            {intData?.interviewerName || getAssignerName(task.assignedBy) || "Unknown"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-3 py-1 rounded-full",
                            String(task.priority || "Low").toUpperCase() === "HIGH" ? "bg-red-50 text-red-500 dark:bg-red-900/20" :
                            String(task.priority || "Low").toUpperCase() === "MEDIUM" ? "bg-amber-50 text-amber-500 dark:bg-amber-900/20" :
                            "bg-purple-50 text-purple-500 dark:bg-purple-900/20"
                          )}>
                            {task.priority ? String(task.priority).charAt(0).toUpperCase() + String(task.priority).slice(1).toLowerCase() : "Low"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors",
                                  task.status === TASK_STATUS.DONE ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  task.status === TASK_STATUS.IN_PROGRESS ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                  "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                )}
                              >
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  task.status === TASK_STATUS.DONE ? "bg-green-500" :
                                  task.status === TASK_STATUS.IN_PROGRESS ? "bg-amber-500" :
                                  "bg-slate-400"
                                )} />
                                {STATUS_LABELS[task.status] ?? task.status}
                                <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <DropdownMenuItem 
                                  key={val} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (val !== task.status) {
                                      openStatusDialog(task, val);
                                    }
                                  }}
                                >
                                  {label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                        <td className="px-5 py-4 align-middle whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {task.createdAt ? formatDate(task.createdAt) : "06-08-2026"}
                        </td>

                        <td className="px-5 py-4 align-middle whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {intData?.interviewDate ? formatDate(intData.interviewDate) : formatDate(task.dueDate)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>  {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                totalItems={filteredTasks.length} 
                itemsPerPage={rowsPerPage}
                onPageChange={(page) => setCurrentPage(page)} 
              />
            </div>
          )}
        </div>

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
                  <a href={detailsDialog.intData.meetingLink} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline truncate block">
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

      {interviewModal.open && (
        <InterviewTaskModal 
          open={interviewModal.open} 
          onOpenChange={(open) => !open && setInterviewModal({ open: false, task: null, intData: null })}
          task={interviewModal.task}
          intData={interviewModal.intData}
        />
      )}

    </div>
  )
}

export default MyTasks