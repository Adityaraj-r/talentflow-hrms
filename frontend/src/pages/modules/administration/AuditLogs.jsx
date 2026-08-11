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
      Auth: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30 dark:text-blue-400",
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
          <StatsSummary
            title="Total Events"
            value={logs.length}
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            description="All logged system events"
            variant="blue"
            isActive={activeCard === "total"}
            onClick={() => handleCardClick("total")}
          />
          <StatsSummary
            title="Security Alerts"
            value={logs.filter(l => l.status === "Failed" || l.module === "Security").length}
            icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
            description="Critical failures detected"
            variant="red"
            isActive={activeCard === "security"}
            onClick={() => handleCardClick("security")}
          />
          <StatsSummary
            title="System Health"
            value={logs.filter(l => l.status === "Success").length}
            icon={<Info className="h-5 w-5 text-green-500" />}
            description="Successful operations"
            variant="green"
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-transparent">
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[180px]">Timestamp</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">User</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Action</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Module</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">IP Address</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="transition-opacity duration-200 ease-in-out" style={{ opacity: isSwitchingCard ? 0.4 : 1 }}>
              {isLoading || isSwitchingCard ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span>{isSwitchingCard ? "Filtering records..." : "Accessing security records..."}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">No matching audit logs found</span>
                        <span className="text-sm">Try changing your filters or search criteria</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow
                    key={log._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
                  >
                    <TableCell className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{log.userName}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                          {log.user === "system" ? "System Process" : "Staff Member"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{log.details}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tight", getModuleBadge(log.module))}>
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <span className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                          log.status === "Success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {log.status}
                        </span>
                        {getStatusIcon(log.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

const StatsSummary = ({ title, value, icon, description, variant, isActive, onClick }) => {
  const styles = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background"
    },
    red: {
      card: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background"
    },
    green: {
      card: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background"
    }
  }
  
  const s = styles[variant]
  return (
    <div 
      onClick={onClick}
      className={cn(
        "border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] p-6 transition-all duration-200 hover:scale-105 cursor-pointer", 
        s.card,
        isActive && s.activeRing,
        !isActive && "opacity-80 hover:opacity-100"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={cn("h-8 w-8 flex items-center justify-center", s.icon)}>{icon}</div>
      </div>
    </div>
  )
}

export default AuditLogs
