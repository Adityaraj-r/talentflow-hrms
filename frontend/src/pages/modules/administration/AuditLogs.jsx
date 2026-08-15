import { useState, useEffect, useCallback } from "react"
import { 
  Search, RefreshCw, FileJson, FileSpreadsheet, ShieldCheck, ShieldAlert, Info, Clock
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import adminService from "@/services/adminService"
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"

const PAGE_SIZE = 20

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwitchingCard, setIsSwitchingCard] = useState(false)
  const [page, setPage] = useState(1)
  const [activeCard, setActiveCard] = useState("total")
  const [filters, setFilters] = useState({
    search: "",
    module: "all",
    status: "all",
    dateRange: "all"
  })

  const fetchLogs = useCallback(async (showToast = false) => {
    setIsRefreshing(true)
    try {
      const response = await adminService.getAuditLogs({
        page: 1,
        limit: 500,
        ...(filters.search && { search: filters.search }),
        ...(filters.module !== "all" && { module: filters.module }),
        ...(filters.status !== "all" && { status: filters.status }),
      })
      if (response.success) {
        setLogs(response.data || [])
        if (showToast) toast.success("Logs synchronized with server")
      }
    } catch (error) {
      toast.error("Failed to fetch system audit logs")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filters.search, filters.module, filters.status])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const updateFilter = (key, value) => {
    setFilters(p => ({ ...p, [key]: value }))
    setPage(1)
  }

  const handleExportCsv = async () => {
    try {
      const text = await adminService.exportAuditLogsCsv({
        page: 1,
        limit: 5000,
        ...(filters.search && { search: filters.search }),
        ...(filters.module !== "all" && { module: filters.module }),
        ...(filters.status !== "all" && { status: filters.status }),
      })
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV export ready")
    } catch {
      toast.error("CSV export failed")
    }
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Audit logs exported successfully")
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.action?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.details?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesModule = filters.module === "all" || log.module === filters.module
    const matchesStatus = filters.status === "all" || log.status === filters.status

    const matchesDate = (() => {
      if (filters.dateRange === "all") return true
      const logDate = new Date(log.createdAt)
      const now = new Date()
      if (filters.dateRange === "today") return logDate.toDateString() === now.toDateString()
      if (filters.dateRange === "week") return (now - logDate) <= 7 * 24 * 60 * 60 * 1000
      if (filters.dateRange === "month") return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
      return true
    })()

    let matchesCard = true
    if (activeCard === "security") {
      const actionText = log.action?.toLowerCase() || ""
      const detailText = log.details?.toLowerCase() || ""
      matchesCard = log.status === "Failed" || 
                    log.module === "Security" || 
                    actionText.includes("fail") || 
                    actionText.includes("unauthorized") || 
                    actionText.includes("violation") ||
                    detailText.includes("fail")
    } else if (activeCard === "health") {
      matchesCard = log.status === "Success"
    }

    return matchesSearch && matchesModule && matchesStatus && matchesDate && matchesCard
  })

  const handleCardClick = (cardType) => {
    const newCardType = activeCard === cardType && cardType !== "total" ? "total" : cardType;
    if (activeCard === newCardType) return;
    
    setIsSwitchingCard(true);
    setActiveCard(newCardType);
    setPage(1);

    if (newCardType === "total") {
      setFilters({ search: "", module: "all", status: "all", dateRange: "all" });
    }

    setTimeout(() => {
      setIsSwitchingCard(false);
    }, 400);
  }

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getStatusIcon = (status) =>
    status === "Success"
      ? <ShieldCheck className="h-4 w-4 text-green-500" />
      : <ShieldAlert className="h-4 w-4 text-red-500" />

  const getModuleBadge = (module) => {
    const styles = {
      Auth: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30 dark:text-purple-400",
      "User Management": "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30 dark:text-purple-400",
      Security: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/30 dark:text-red-400",
      Default: "bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-500/30 dark:text-gray-400"
    }
    return styles[module] || styles.Default
  }

  return (
    <div className="space-y-6 max-w-full pb-10 px-6 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">System Audit Logs</h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
              Traceability and security monitoring for all administrative actions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={isRefreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh Logs
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="mr-2 h-4 w-4" /> Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Events"
            value={logs.length}
            icon={<Clock className="h-5 w-5" />}
            variant="blue"
            isActive={activeCard === "total"}
            onClick={() => handleCardClick("total")}
          />
          <StatsCard
            title="Security Alerts"
            value={logs.filter(l => l.status === "Failed" || l.module === "Security").length}
            icon={<ShieldAlert className="h-5 w-5" />}
            variant="rose"
            isActive={activeCard === "security"}
            onClick={() => handleCardClick("security")}
          />
          <StatsCard
            title="System Health"
            value={logs.filter(l => l.status === "Success").length}
            icon={<Info className="h-5 w-5" />}
            variant="emerald"
            isActive={activeCard === "health"}
            onClick={() => handleCardClick("health")}
          />
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden">

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter by user, action, or details..."
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filters.module} onValueChange={(v) => updateFilter("module", v)}>
                  <SelectTrigger className="w-[160px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="Auth">Auth</SelectItem>
                    <SelectItem value="User Management">User Management</SelectItem>
                    <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                  <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.dateRange} onValueChange={(v) => updateFilter("dateRange", v)}>
                  <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="transition-opacity duration-200 ease-in-out" style={{ opacity: isSwitchingCard ? 0.4 : 1 }}>
            <DataTable 
              columns={[
                {
                  accessorKey: "createdAt",
                  header: "Timestamp",
                  cell: ({ row }) => (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm:ss")}
                    </span>
                  )
                },
                {
                  accessorKey: "userName",
                  header: "User",
                  cell: ({ row }) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.original.userName}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                        {row.original.user === "system" ? "System Process" : "Staff Member"}
                      </span>
                    </div>
                  )
                },
                {
                  accessorKey: "action",
                  header: "Action",
                  cell: ({ row }) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{row.original.action}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{row.original.details}</span>
                    </div>
                  )
                },
                {
                  accessorKey: "module",
                  header: "Module",
                  cell: ({ row }) => (
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tight", getModuleBadge(row.original.module))}>
                      {row.original.module}
                    </Badge>
                  )
                },
                {
                  accessorKey: "ipAddress",
                  header: "IP Address",
                  cell: ({ row }) => (
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {row.original.ipAddress}
                    </span>
                  )
                },
                {
                  accessorKey: "status",
                  header: () => <div className="text-right">Status</div>,
                  cell: ({ row }) => (
                    <div className="flex justify-end items-center gap-1.5">
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-wider",
                        row.original.status === "Success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {row.original.status}
                      </span>
                      {getStatusIcon(row.original.status)}
                    </div>
                  )
                }
              ]}
              data={filteredLogs}
              searchable={false}
              defaultPageSize={PAGE_SIZE}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default AuditLogs
