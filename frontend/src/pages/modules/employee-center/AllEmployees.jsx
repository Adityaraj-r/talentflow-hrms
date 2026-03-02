import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserCheck, ShieldAlert, Users, RefreshCw, ChevronRight } from "lucide-react"
import adminService from "@/services/adminService"
import { ROLES } from "@/constants/roles"
import { cn } from "@/lib/utils"

const AllEmployees = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ search: '', role: 'all' })

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminService.getAllEmployees(filters)
      const userData = response.data?.users || response.data || []
      const formatted = userData.map(u => ({
        id: u._id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
        email: u.email,
        role: u.role,
        department: u.department || 'N/A',
        phoneNumber: u.phoneNumber || '',
        gender: u.gender || 'N/A',
        status: u.isActive ? 'Active' : 'Inactive',
        avatar: (u.firstName?.[0] || u.name?.[0] || 'U').toUpperCase(),
        createdAt: u.createdAt,
      }))
      setEmployees(formatted)
    } catch (error) {
      console.error("Fetch Error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(u => u.status === 'Active').length,
    inactive: employees.filter(u => u.status === 'Inactive').length,
    roles: new Set(employees.map(e => e.role).filter(Boolean)).size,
  }), [employees])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Employees</h1>
          <p className="text-muted-foreground">View and browse all employee profiles in the system.</p>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Staff" value={stats.total} icon={<Users className="h-8 w-8" />} variant="blue" />
        <StatsCard title="Active" value={stats.active} icon={<UserCheck className="h-8 w-8" />} variant="green" />
        <StatsCard title="Inactive" value={stats.inactive} icon={<ShieldAlert className="h-8 w-8" />} variant="orange" />
        <StatsCard title="Roles Assigned" value={stats.roles} icon={<ShieldAlert className="h-8 w-8" />} variant="red" />
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or ID..."
                className="pl-10"
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              />
            </div>
            <Select onValueChange={v => setFilters(p => ({ ...p, role: v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Sync Data
          </Button>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold">Department</TableHead>
                <TableHead className="font-bold">Access Role</TableHead>
                <TableHead className="font-bold w-[120px]">Gender</TableHead>
                <TableHead className="font-bold">Account Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">Refreshing employee records...</TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">No matching records found.</TableCell></TableRow>
              ) : (
                employees.map(emp => (
                  <TableRow
                    key={emp.id}
                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/employee-center/employee/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                          {emp.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{emp.name}</span>
                          <span className="text-xs text-muted-foreground">{emp.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{emp.department}</span></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wider px-2 py-0.5">
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{emp.gender}</span></TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        emp.status === 'Active'
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : "bg-orange-500/10 text-orange-600 border-orange-200"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", emp.status === 'Active' ? "bg-green-600" : "bg-orange-600")} />
                        {emp.status}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 w-8">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Displaying {employees.length} employee records</span>
            <span>Read-only view · Manage in Administration → User Management</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsCard = ({ title, value, icon, variant }) => {
  const styles = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    green: {
      card: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    orange: {
      card: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
      icon: "text-orange-600 dark:text-orange-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    red: {
      card: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
      icon: "text-purple-600 dark:text-purple-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
  }
  const s = styles[variant]
  return (
    <div className={cn("rounded-xl border p-6 transition-all duration-200 hover:scale-105", s.card)}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8", s.icon)}>{icon}</div>
      </div>
    </div>
  )
}


export default AllEmployees
