import { useState, useEffect, useCallback } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SearchableRoleSelect } from "@/components/ui/searchable-role-select"
import { Search, UserCheck, ShieldAlert, Users, RefreshCw, ChevronRight, Download, Loader2, UserMinus } from "lucide-react"
import adminService from "@/services/adminService"
import { ROLES } from "@/constants/roles"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { StatsCard } from "@/components/ui/stats-card"

const AllEmployees = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 })
  const [stats, setStats] = useState({ total: 0, active: 0, onNotice: 0, inactive: 0, roles: 0 })
  const [activeCard, setActiveCard] = useState('total')
  const [filters, setFilters] = useState({ search: '', role: 'all', page: 1, limit: 10, statusFilter: 'total' })

  // Sync activeCard with filters
  useEffect(() => {
    setFilters(p => ({ ...p, statusFilter: activeCard, page: 1 }))
  }, [activeCard])

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminService.getAllEmployees(filters)

      const userData = response.data || response.users || []
      const pagData = response.pagination || { currentPage: 1, totalPages: 1, totalItems: userData.length }
      
      const dataArray = Array.isArray(userData) ? userData : []

      const formatted = dataArray.map(u => ({
        id: u._id || u.employeeCode,
        employeeCode: u.employeeCode || 'Not Assigned',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
        email: u.email,
        role: u.role,
        department: u.department || 'N/A',
        phoneNumber: u.phoneNumber || '',
        gender: u.gender || 'N/A',
        status: u.status || (u.isActive ? 'Active' : 'Inactive'),
        avatar: (u.firstName?.[0] || u.name?.[0] || 'U').toUpperCase(),
        profilePicture: u.profilePicture || u.avatarUrl || u.photo || null,
        createdAt: u.createdAt,
        exitDate: u.exitDate,
      }))
      
      setEmployees(formatted)
      setPagination(pagData)
      
      if (response.stats) {
        setStats({
          total: response.stats.total,
          active: response.stats.active,
          onNotice: response.stats.onNotice || 0,
          inactive: response.stats.inactive || 0, // This is now 'Exited'
          roles: response.stats.rolesAssigned
        })
      }
    } catch (error) {
      console.error("Fetch Error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const exportToCSV = async () => {
    setIsExporting(true)
    try {
      const exportParams = { ...filters, page: 1, limit: 10000 }
      const response = await adminService.getAllEmployees(exportParams)
      
      const allUsers = response.data || response.users || []
      const dataArray = Array.isArray(allUsers) ? allUsers : []

      const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Role', 'Gender', 'Status', 'Joined Date']
      
      const csvRows = dataArray.map(u => {
        const empCode = u.employeeCode || 'Not Assigned'
        const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'
        const status = u.status || (u.isActive ? 'Active' : 'Inactive')
        const joinedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
        
        return [
          empCode,
          name, 
          u.email || '', 
          u.department || 'N/A', 
          u.role || '', 
          u.gender || 'N/A', 
          status, 
          joinedDate
        ].map(v => `"${v}"`).join(',')
      })
      
      const csvContent = [headers.map(h => `"${h}"`).join(','), ...csvRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Directory_Export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Export Error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  if (user?.role === "EMPLOYEE") {
    const selfId = user?.employeeId || user?._id
    return <Navigate to={`/employee-center/employee/${selfId}`} replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.role === 'DEPARTMENT_MANAGER' ? 'Department Directory' : 'All Employees'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'DEPARTMENT_MANAGER' 
              ? 'View and browse employee profiles within your department.' 
              : 'View and browse all employee profiles in the system.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatsCard 
          title="Total Staff" 
          value={stats.total} 
          icon={<Users className="h-8 w-8" />} 
          variant="blue" 
          isActive={activeCard === 'total'}
          onClick={() => setActiveCard('total')}
        />
        <StatsCard 
          title="Active Employees" 
          value={stats.active} 
          icon={<UserCheck className="h-8 w-8" />} 
          variant="green" 
          isActive={activeCard === 'active'}
          onClick={() => setActiveCard(activeCard === 'active' ? 'total' : 'active')}
        />
        <StatsCard 
          title="On Notice Period" 
          value={stats.onNotice} 
          icon={<ShieldAlert className="h-8 w-8" />} 
          variant="yellow" 
          isActive={activeCard === 'onNotice'}
          onClick={() => setActiveCard(activeCard === 'onNotice' ? 'total' : 'onNotice')}
        />
        <StatsCard 
          title="Exited Employees" 
          value={stats.inactive} 
          icon={<UserMinus className="h-8 w-8" />} 
          variant="red" 
          isActive={activeCard === 'exited'}
          onClick={() => setActiveCard(activeCard === 'exited' ? 'total' : 'exited')}
        />
        <StatsCard 
          title="Roles Assigned" 
          value={stats.roles} 
          icon={<ShieldAlert className="h-8 w-8" />} 
          variant="purple" 
          isActive={activeCard === 'rolesAssigned'}
          onClick={() => setActiveCard(activeCard === 'rolesAssigned' ? 'total' : 'rolesAssigned')}
        />
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or ID..."
                className="pl-10"
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
              />
            </div>
            <SearchableRoleSelect 
              value={filters.role}
              onChange={v => setFilters(p => ({ ...p, role: v, page: 1 }))}
              options={[{value: 'all', label: 'All Roles'}, ...Object.entries(ROLES).map(([k, v]) => ({value: k, label: v}))]}
              placeholder="All Roles"
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={employees.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Sync Data
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold w-[25%]">Employee</TableHead>
                <TableHead className="font-bold w-[15%]">Employee ID</TableHead>
                <TableHead className="font-bold w-[15%]">Department</TableHead>
                <TableHead className="font-bold w-[15%]">Access Role</TableHead>
                <TableHead className="font-bold w-[10%]">Gender</TableHead>
                <TableHead className="font-bold w-[20%]">Account Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-muted animate-pulse" /><div className="space-y-2"><div className="h-4 w-32 bg-muted animate-pulse rounded" /><div className="h-3 w-24 bg-muted animate-pulse rounded" /></div></div></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Users className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No employees found in this category.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map(emp => (
                  <TableRow
                    key={emp.id}
                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/employee-center/employee/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {emp.profilePicture ? (
                          <img src={emp.profilePicture} alt={emp.name} className="h-8 w-8 rounded-full object-cover border border-muted" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center text-xs font-bold text-muted-foreground border border-muted/50">
                            {emp.avatar}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-[13px] text-foreground">{emp.name}</span>
                          <span className="text-[11px] text-muted-foreground font-medium">{emp.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {emp.employeeCode === 'Not Assigned' ? (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200 text-[10px] px-2 py-0.5">Not Assigned</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted/30 text-muted-foreground font-mono text-[11px] px-2 py-0.5">{emp.employeeCode}</Badge>
                      )}
                    </TableCell>
                    <TableCell><span className="text-sm">{emp.department}</span></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wider px-2 py-0.5">
                        {emp.role || 'EMPLOYEE'}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{emp.gender}</span></TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        emp.status === 'Active'
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : emp.status?.startsWith('Pending')
                          ? "bg-blue-500/10 text-blue-600 border-blue-200"
                          : emp.status === 'On Notice Period'
                          ? "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                          : "bg-red-500/10 text-red-600 border-red-200"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full", 
                          emp.status === 'Active' ? "bg-green-600" : emp.status?.startsWith('Pending') ? "bg-blue-600" : emp.status === 'On Notice Period' ? "bg-yellow-600" : "bg-red-600"
                        )} />
                        {emp.status}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
            <span>
              Displaying {employees.length > 0 ? ((pagination.currentPage - 1) * filters.limit) + 1 : 0} - {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of {pagination.totalItems} records
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                disabled={pagination.currentPage <= 1 || isLoading} 
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </Button>
              <span className="px-2">Page {pagination.currentPage} of {pagination.totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                disabled={pagination.currentPage >= pagination.totalPages || isLoading} 
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AllEmployees