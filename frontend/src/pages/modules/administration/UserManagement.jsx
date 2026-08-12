import { useState, useEffect, useCallback, useMemo } from "react"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SearchableRoleSelect } from "@/components/ui/searchable-role-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search, Plus, Upload, Edit, Power, UserCheck, ShieldAlert,
  FileSpreadsheet, UploadCloud, Users, RefreshCw, Trash2
} from "lucide-react"
import { toast } from "sonner"
import adminService from "@/services/adminService"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { ROLES } from "@/constants/roles"
import { cn } from "@/lib/utils"
import { StatsCard } from "@/components/ui/stats-card"

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', password: '',
  role: '', department: '', phoneNumber: '', gender: '',
  salary: {
    basic: '',
    allowances: { hra: '', transport: '', medical: '', other: '' },
    deductions: { pf: '', tax: '', insurance: '' }
  }
}

const UserManagement = () => {
  const { user: currentUser } = useUser()
  const canWriteSettings = currentUser?.can?.("settings", "write")
  const canDeleteSettings = currentUser?.can?.("settings", "delete")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ search: '', role: 'all' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [activeCard, setActiveCard] = useState("total")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [onboardedList, setOnboardedList] = useState([])

  useEffect(() => {
    const fetchOnboarded = async () => {
      try {
        const data = await apiClient.get("/onboarding/list/all?unenrolled=true")
        setOnboardedList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch onboarded employees:", error)
      }
    }
    if (isCreateOpen && canWriteSettings) fetchOnboarded()
  }, [isCreateOpen, canWriteSettings])

  const handleSelectEmployee = (employeeCode) => {
    const selectedEmp = onboardedList.find(emp => emp.employeeCode === employeeCode)
    if (selectedEmp) {
      setFormData(prev => ({
        ...prev,
        firstName: selectedEmp.firstName || "",
        lastName: selectedEmp.lastName || "",
        department: selectedEmp.department && selectedEmp.department !== 'N/A' ? selectedEmp.department : "",
        phoneNumber: selectedEmp.phoneNumber || "",
        gender: selectedEmp.gender || "",
        employeeCode: selectedEmp.employeeCode,
      }))
      toast.success(`Auto-filled data for ${selectedEmp.employeeCode}`)
    }
  }

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
        employeeCode: u.employeeCode || 'N/A',
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

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSalaryChange = (field, subfield, value) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: subfield
          ? { ...prev.salary[field], [subfield]: value }
          : value
      }
    }))
  }

  const handleResetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: '', department: '', phoneNumber: '', gender: '', employeeCode: '' })
    setFormData(EMPTY_FORM)
    setIsCreateOpen(false)
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return "First name is required"
    if (!formData.email.includes("@")) return "Valid work email is required"
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    if (!formData.role) return "Please assign a user role"
    if (!formData.department) return "Please assign a department"
    if (!formData.gender) return "Please select a gender"
    if (!formData.salary.basic || Number(formData.salary.basic) <= 0)
      return "Basic annual salary is required"
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

  const openEditModal = (user) => {
    setFormData({
      ...EMPTY_FORM,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department !== 'N/A' ? user.department : '',
      phoneNumber: user.phoneNumber,
      gender: user.gender !== 'N/A' ? user.gender : '',
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
      const data = await apiClient.put(`/users/${editUserId}`, formData)
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

  const openDeleteModal = (user) => {
    setDeleteTarget({ id: user.id, name: user.name })
    setIsDeleteOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const data = await apiClient.delete(`/admin/users/${deleteTarget.id}`)
      if (data.success) {
        toast.success(`${deleteTarget.name} has been removed from the system`)
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setIsDeleteOpen(false)
        setDeleteTarget(null)
      } else {
        toast.error(data.message || "Delete failed")
      }
    } catch {
      toast.error("An error occurred while deleting")
    } finally {
      setIsDeleting(false)
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

  const filteredUsers = useMemo(() => {
    let res = users;
    if (activeCard === 'active') res = res.filter(u => u.status === 'Active');
    if (activeCard === 'inactive') res = res.filter(u => u.status === 'Inactive');
    return res;
  }, [users, activeCard]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const renderSalarySection = () => (
    <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Salary Structure (₹)
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Basic Annual Salary <span className="text-red-500">*</span></Label>
          <Input
            type="number" min="0" placeholder="e.g. 30000"
            value={formData.salary.basic}
            onChange={e => handleSalaryChange('basic', null, e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>HRA</Label>
          <Input
            type="number" min="0" placeholder="e.g. 12000"
            value={formData.salary.allowances.hra}
            onChange={e => handleSalaryChange('allowances', 'hra', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Transport</Label>
          <Input
            type="number" min="0" placeholder="1500"
            value={formData.salary.allowances.transport}
            onChange={e => handleSalaryChange('allowances', 'transport', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Medical</Label>
          <Input
            type="number" min="0" placeholder="1250"
            value={formData.salary.allowances.medical}
            onChange={e => handleSalaryChange('allowances', 'medical', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Other Allowance</Label>
          <Input
            type="number" min="0" placeholder="0"
            value={formData.salary.allowances.other}
            onChange={e => handleSalaryChange('allowances', 'other', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-red-500">PF Deduction</Label>
          <Input
            type="number" min="0" placeholder="1800"
            value={formData.salary.deductions.pf}
            onChange={e => handleSalaryChange('deductions', 'pf', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-red-500">Tax</Label>
          <Input
            type="number" min="0" placeholder="0"
            value={formData.salary.deductions.tax}
            onChange={e => handleSalaryChange('deductions', 'tax', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-red-500">Insurance</Label>
          <Input
            type="number" min="0" placeholder="500"
            value={formData.salary.deductions.insurance}
            onChange={e => handleSalaryChange('deductions', 'insurance', e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">User Management</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Administer employee accounts and system access levels.</p>
        </div>
        <div className="flex gap-2">

          {canWriteSettings && (
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
                <input type="file" id="bulk-file" className="hidden" accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])} />
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
          )}

          {canWriteSettings && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Individual Enrollment</DialogTitle>
                <DialogDescription>Create a single employee record in the system.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} autoComplete="off" className="space-y-4 py-4">
                <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
                  <Label className="text-blue-700 dark:text-blue-400 font-semibold mb-2 block">
                    Link Onboarded Candidate (Optional)
                  </Label>
                  <Select onValueChange={handleSelectEmployee}>
                    <SelectTrigger className="bg-white dark:bg-background border-blue-200 dark:border-blue-800">
                      <SelectValue placeholder="Select a newly onboarded employee to auto-fill..." />
                    </SelectTrigger>
                    <SelectContent>
                      {onboardedList.length === 0 ? (
                        <SelectItem value="none" disabled>No pending candidates</SelectItem>
                      ) : (
                        onboardedList.map((emp, index) => {
                          const safeValue = emp.employeeCode || emp._id || `fallback-${index}`;
                          const displayCode = emp.employeeCode || "No ID";

                          return (
                            <SelectItem key={safeValue} value={safeValue}>
                              {[displayCode, "-", emp.firstName, emp.lastName].filter(Boolean).join(" ")}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} autoComplete="new-password" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Role</Label>
                    <Select value={formData.role} onValueChange={(v) => handleSelectChange('role', v)}>
                      <SelectTrigger><SelectValue placeholder="Select permissions" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={formData.department} onValueChange={(v) => handleSelectChange('department', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {["IT", "HR", "Finance", "Sales", "Marketing", "Operations"].map(d =>
                          <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Contact Number</Label>
                    <Input
                      id="phoneNumber" maxLength={10} value={formData.phoneNumber}
                      onChange={(e) => handleInputChange({ target: { id: 'phoneNumber', value: e.target.value.replace(/\D/g, '') } })}
                      placeholder="10-digit mobile number"
                    />
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

                {/* Salary Section */}
                {renderSalarySection()}

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
          )}

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee Record</DialogTitle>
                <DialogDescription>
                  Update system access and personal details. Leave password blank to keep current.
                </DialogDescription>
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
                    <Input id="password" type="password" placeholder="Leave blank to keep unchanged"
                      value={formData.password} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Role <span className="text-red-500">*</span></Label>
                    <Select value={formData.role} onValueChange={(v) => handleSelectChange('role', v)}>
                      <SelectTrigger><SelectValue placeholder="Select permissions" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department <span className="text-red-500">*</span></Label>
                    <Select value={formData.department} onValueChange={(v) => handleSelectChange('department', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {["IT", "HR", "Finance", "Sales", "Marketing", "Operations"].map(d =>
                          <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="phoneNumber" maxLength={10} value={formData.phoneNumber}
                      onChange={(e) => handleInputChange({ target: { id: 'phoneNumber', value: e.target.value.replace(/\D/g, '') } })}
                    />
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

                {/* Salary Section in Edit too */}
                {renderSalarySection()}

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

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="space-y-3 px-2 max-w-[340px] mx-auto">
                  <DialogTitle className="text-xl font-bold text-red-600 sm:text-center">
                    Remove Employee
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed sm:text-center">
                    Are you sure you want to remove{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget?.name}</span>{" "}
                    from the system?
                  </DialogDescription>
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-md text-center mt-2 border border-slate-200 dark:border-slate-800">
                    This is a soft delete — the employee's payroll history, audit logs,
                    and documents are preserved. Their account will be deactivated and
                    their Employee status set to <strong className="text-slate-700 dark:text-slate-300">Terminated</strong>.
                  </div>
                </div>
              </div>
              <div className="flex justify-center w-full gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <Button variant="outline" className="min-w-[120px]" onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null) }} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 min-w-[120px]">
                  {isDeleting
                    ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Removing...</>
                    : <><Trash2 className="mr-2 h-4 w-4" /> Yes, Remove</>
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard 
          title="Total Staff" 
          value={stats.total} 
          icon={<Users className="h-8 w-8" />} 
          variant="blue" 
          isActive={activeCard === 'total'}
          onClick={() => setActiveCard(activeCard === 'total' ? 'total' : 'total')}
        />
        <StatsCard 
          title="Active" 
          value={stats.active} 
          icon={<UserCheck className="h-8 w-8" />} 
          variant="green" 
          isActive={activeCard === 'active'}
          onClick={() => setActiveCard(activeCard === 'active' ? 'total' : 'active')}
        />
        <StatsCard 
          title="Inactive" 
          value={stats.inactive} 
          icon={<ShieldAlert className="h-8 w-8" />} 
          variant="orange" 
          isActive={activeCard === 'inactive'}
          onClick={() => setActiveCard(activeCard === 'inactive' ? 'total' : 'inactive')}
        />
        <StatsCard 
          title="Security Flags" 
          value="0" 
          icon={<ShieldAlert className="h-8 w-8" />} 
          variant="red" 
        />
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, ID, Dept, Email..."
                className="pl-10"
                onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
              />
            </div>
            <SearchableRoleSelect 
              value={filters.role}
              onChange={(v) => setFilters(p => ({ ...p, role: v }))}
              options={[{value: 'all', label: 'All Roles'}, ...Object.entries(ROLES).map(([k, v]) => ({value: k, label: v}))]}
              placeholder="All Roles"
              className="w-32"
            />
          </div>
          <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={exportToCSV} disabled={users.length === 0 || isExporting} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExporting ? "Exporting..." : "Export CSV"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sync Data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Employee ID</TableHead>
                <TableHead className="font-bold">Department</TableHead>
                <TableHead className="font-bold">Access Role</TableHead>
                <TableHead className="font-bold w-[120px]">Gender</TableHead>
                <TableHead className="font-bold">Account Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                    Refreshing employee records...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                    No matching records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                          {user.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.name}</span>
                          <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">{user.employeeCode}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                      {user.employeeCode}
                    </TableCell>
                      <TableCell>{user.department || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-xs tracking-wide">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{user.gender || '—'}</TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        user.status === 'Active'
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : "bg-orange-500/10 text-orange-600 border-orange-200"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full",
                          user.status === 'Active' ? "bg-green-600" : "bg-orange-600")} />
                        {user.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canWriteSettings && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"
                            onClick={() => openEditModal(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canWriteSettings && (
                          <Button
                            variant="ghost" size="icon"
                            className={cn("h-8 w-8", user.status === 'Active' ? "hover:text-orange-500" : "hover:text-green-500")}
                            onClick={() => handleToggleStatus(user.id, user.status)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteSettings && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={() => openDeleteModal(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filteredUsers.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserManagement
