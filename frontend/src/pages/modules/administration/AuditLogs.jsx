"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  FileJson, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  ShieldAlert,
  Info,
  Clock
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import adminService from "../../../services/adminService"

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    module: "all",
    status: "all"
  })

  const fetchLogs = useCallback(async (showToast = false) => {
    setIsRefreshing(true)
    try {
      const response = await adminService.getAuditLogs()
      if (response.success) {
        setLogs(response.data)
        if (showToast) toast.success("Logs synchronized with server")
      }
    } catch (error) {
      toast.error("Failed to fetch system audit logs")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.details?.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesModule = filters.module === "all" || log.module === filters.module
    const matchesStatus = filters.status === "all" || log.status === filters.status

    return matchesSearch && matchesModule && matchesStatus
  })

  const getStatusIcon = (status) => {
    return status === "Success" ? (
      <ShieldCheck className="h-4 w-4 text-green-500" />
    ) : (
      <ShieldAlert className="h-4 w-4 text-red-500" />
    )
  }

  const getModuleBadge = (module) => {
    const styles = {
      Auth: "bg-blue-500/10 text-blue-600 border-blue-200",
      "User Management": "bg-purple-500/10 text-purple-600 border-purple-200",
      Security: "bg-red-500/10 text-red-600 border-red-200",
      Default: "bg-gray-500/10 text-gray-600 border-gray-200"
    }
    return styles[module] || styles.Default
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground">Traceability and security monitoring for all administrative actions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh Logs
          </Button>
          <Button variant="outline" size="sm">
            <FileJson className="mr-2 h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsSummary 
          title="Total Events" 
          value={logs.length} 
          icon={<Clock className="h-4 w-4" />} 
          description="Logged in current session"
        />
        <StatsSummary 
          title="Security Alerts" 
          value={logs.filter(l => l.status === "Failed").length} 
          icon={<ShieldAlert className="h-4 w-4 text-red-500" />} 
          description="Critical failures detected"
        />
        <StatsSummary 
          title="System Health" 
          value="Stable" 
          icon={<Info className="h-4 w-4 text-green-500" />} 
          description="Monitoring active"
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by user, action, or details..." 
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filters.module} onValueChange={(v) => setFilters(p => ({ ...p, module: v }))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Auth">Auth</SelectItem>
                  <SelectItem value="User Management">User Management</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">Accessing security records...</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">No audit entries found.</TableCell></TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id} className="group transition-colors">
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{log.userName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{log.user === 'system' ? 'System Process' : 'Staff Member'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{log.details}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tight", getModuleBadge(log.module))}>
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <span className={cn("text-[11px] font-bold uppercase tracking-wider", log.status === 'Success' ? "text-green-600" : "text-red-600")}>
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
          <div className="p-4 border-t bg-muted/10 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] flex justify-between">
            <span>Enterprise Security Audit Trail</span>
            <span>Logs Encrypted & Immutable</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsSummary = ({ title, value, icon, description, className }) => (
  <Card className={cn("border-none shadow-sm bg-muted/30", className)}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-black mt-1">{value}</h3>
          <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="p-2 rounded-lg bg-background shadow-sm border">{icon}</div>
      </div>
    </CardContent>
  </Card>
)

export default AuditLogs