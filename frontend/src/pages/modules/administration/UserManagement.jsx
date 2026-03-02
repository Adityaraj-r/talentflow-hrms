import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search, Plus, Upload, Edit, Power, UserCheck, ShieldAlert,
  FileSpreadsheet, UploadCloud, Users, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import adminService from "@/services/adminService"
import { ROLES } from "@/constants/roles"
import { cn } from "@/lib/utils"

const UserManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ search: '', role: 'all' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editUserId, setEditUserId] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: '', department: '', phoneNumber: '', gender: ''
  })

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminService.getUsers(filters)
      const userData = response.data || []
      const formatted = userData.map(u => ({
        id: u._id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        name: `${u.firstName || ''} ${u.lastName || ''}`,
        email: u.email,
        role: u.role,
        department: u.department || 'N/A',
        phoneNumber: u.phoneNumber || '',
        gender: u.gender || 'N/A',
        status: u.isActive ? 'Active' : 'Inactive',
        avatar: (u.firstName?.[0] || 'U').toUpperCase()
      }))
      setUsers(formatted)
    } catch (error) {
      console.error("Fetch Error:", error)
      toast.error("Failed to synchronize employee database")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openEditModal = (user) => {
    setFormData({
      firstName: user.firstName, lastName: user.lastName, email: user.email,
      password: '', role: user.role,
      department: user.department !== 'N/A' ? user.department : '',
      phoneNumber: user.phoneNumber,
      gender: user.gender !== 'N/A' ? user.gender : ''
    })
    setEditUserId(user.id)
    setIsEditOpen(true)
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    if (!formData.role || !formData.department || !formData.phoneNumber)
      return toast.error("Role, Department, and Phone Number are compulsory fields.")
    setIsActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5001/api/users/${editUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("User updated successfully")
        setIsEditOpen(false)
        fetchUsers()
      } else {
        toast.error(data.message || "Update failed")
      }
    } catch {
      toast.error("An error occurred while updating")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleResetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: '', department: '', phoneNumber: '', gender: '' })
    setIsCreateOpen(false)
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return "First name is required"
    if (!formData.lastName.trim()) return "Last name is required"
    if (!formData.email.includes("@")) return "Valid work email is required"
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    if (!formData.role) return "Please assign a user role"
    if (!formData.department) return "Please assign a department"
    if (!formData.gender) return "Please select a gender"
    return null
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const error = validateForm()
    if (error) return toast.error(error)
    setIsActionLoading(true)
    try {
      const response = await adminService.enrollUser(formData)
      if (response.success) {
        toast.success("Employee enrolled successfully")
        handleResetForm()
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.message || "Enrollment failed")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await adminService.toggleUserStatus(userId)
      if (response.success) {
        toast.success(`User ${currentStatus === 'Active' ? 'deactivated' : 'activated'} successfully`)
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
        ))
      }
    } catch {
      toast.error("Failed to update account status")
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) return toast.error("Please select a valid CSV file")
    setIsActionLoading(true)
    try {
      await adminService.bulkUploadUsers(selectedFile)
      toast.success("Bulk data processed successfully")
      setIsBulkOpen(false)
      setSelectedFile(null)
      fetchUsers()
    } catch {
      toast.error("File processing failed")
    } finally {
      setIsActionLoading(false)
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length
  }), [users])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Administer employee accounts and system access levels.</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Upload Dialog */}
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Bulk Enrollment</DialogTitle>
                <DialogDescription>Upload employee data via CSV format.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <input type="file" id="bulk-file" className="hidden" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} />
                <div
                  className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-all"
                  onClick={() => document.getElementById('bulk-file').click()}
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-semibold">{selectedFile ? selectedFile.name : "Select CSV File"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
                </div>
                <Button variant="secondary" className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Format Template
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                <Button onClick={handleBulkUpload} disabled={isActionLoading}>
                  {isActionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Process Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create User Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Individual Enrollment</DialogTitle>
                <DialogDescription>Create a single employee record in the system.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Ex: Aditya" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Ex: Chakre" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="aditya@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Role</Label>
                    <Select onValueChange={(v) => handleSelectChange('role', v)}>
                      <SelectTrigger><SelectValue placeholder="Select permissions" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(v) => handleSelectChange('department', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {["IT", "HR", "Finance", "Sales", "Marketing", "Operations"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Contact Number</Label>
                    <Input id="phoneNumber" maxLength={10} value={formData.phoneNumber} onChange={(e) => handleInputChange({ target: { id: 'phoneNumber', value: e.target.value.replace(/\D/g, '') } })} placeholder="10-digit mobile number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button type="button" variant="ghost" onClick={handleResetForm}>Cancel</Button>
                  <Button type="submit" disabled={isActionLoading}>
                    {isActionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Enrollment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Edit Employee Record</DialogTitle>
                <DialogDescription>Update system access and personal details. Leave password blank to keep current password.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Work Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input id="password" type="password" placeholder="Leave blank to keep unchanged" value={formData.password} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Role *</Label>
                    <Select value={formData.role} onValueChange={(v) => handleSelectChange('role', v)}>
                      <SelectTrigger><SelectValue placeholder="Select permissions" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select value={formData.department} onValueChange={(v) => handleSelectChange('department', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {["IT", "HR", "Finance", "Sales", "Marketing", "Operations"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Number *</Label>
                    <Input id="phoneNumber" maxLength={10} value={formData.phoneNumber} onChange={(e) => handleInputChange({ target: { id: 'phoneNumber', value: e.target.value.replace(/\D/g, '') } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isActionLoading}>
                    {isActionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Staff" value={stats.total} icon={<Users className="h-8 w-8" />} variant="blue" />
        <StatsCard title="Active" value={stats.active} icon={<UserCheck className="h-8 w-8" />} variant="green" />
        <StatsCard title="Inactive" value={stats.inactive} icon={<ShieldAlert className="h-8 w-8" />} variant="orange" />
        <StatsCard title="Security Flags" value="0" icon={<ShieldAlert className="h-8 w-8" />} variant="red" />
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or ID..."
                className="pl-10"
                onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
              />
            </div>
            <Select onValueChange={(v) => setFilters(p => ({ ...p, role: v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
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
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">Refreshing employee records...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground">No matching records found.</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                          {user.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{user.department}</span></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wider px-2 py-0.5">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{user.gender}</span></TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        user.status === 'Active'
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : "bg-orange-500/10 text-orange-600 border-orange-200"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", user.status === 'Active' ? "bg-green-600" : "bg-orange-600")} />
                        {user.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => openEditModal(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-8 w-8", user.status === 'Active' ? "hover:text-red-500" : "hover:text-green-500")}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Displaying {users.length} active records from MongoDB</span>
            <span>System Status: Stable</span>
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


export default UserManagement
