import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Check, X, Search, Clock, Loader2, TrendingUp, ShieldCheck, Edit, RefreshCw, CheckCircle, Eye } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Pagination } from "@/components/ui/pagination"

const EmployeePromotion = () => {
  const { user } = useAuth()
  const userRole = user?.role?.toUpperCase() || ""
  const canNominate = userRole === "DIRECT_MANAGER"
  const canViewBoard = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER" , "HR_OFFICER", "DIRECT_MANAGER"].includes(userRole)

  if (!canViewBoard && !canNominate) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view promotions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={canViewBoard ? "board" : "nominate"} className="w-full">
        <TabsList>
          {canViewBoard && <TabsTrigger value="board">Approval Board</TabsTrigger>}
          {canNominate && <TabsTrigger value="nominate">Nominate Employee</TabsTrigger>}
        </TabsList>

        {canViewBoard && (
          <TabsContent value="board" className="mt-4">
            <ApprovalBoard userRole={userRole} />
          </TabsContent>
        )}

        {canNominate && (
          <TabsContent value="nominate" className="mt-4">
            <NominationForm user={user} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const ApprovalBoard = ({ userRole }) => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [verifyData, setVerifyData] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState(null)

  const handleViewDetails = (item) => {
    setSelectedPromotion(item)
    setDetailsModalOpen(true)
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ['promotions', page, searchTerm],
    queryFn: () => apiClient.get(`/promotions/all?page=${page}&limit=10&search=${searchTerm}`),
    keepPreviousData: true
  })

  const promotions = response?.data || []
  const paginationInfo = response?.pagination || { total: 0, page: 1, totalPages: 1 }

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiClient.patch(`/promotions/update/${id}`, payload),
    onSuccess: (res) => {
      toast.success("Promotion status updated successfully!")
      setVerifyData(null)
      queryClient.invalidateQueries(['promotions'])
    },
    onError: (error) => toast.error(error.message || "Error updating promotion status")
  })

  const handleAction = (id, status, extraPayload = {}) => {
    updateMutation.mutate({ id, payload: { status, ...extraPayload } })
  }

  const handleVerifySubmit = (e) => {
    e.preventDefault()
    handleAction(verifyData._id, 'Pending CEO', {
      newDesignation: verifyData.newDesignation,
      newRole: verifyData.newRole,
      newSalary: Number(verifyData.newSalary)
    })
  }

  return (
    <div className="space-y-4">
      {/* COUNTRY MANAGER EDIT MODAL*/}
      {verifyData && (
        <Card className="border border-blue-200 dark:border-blue-900/30 shadow-sm rounded-[16px] bg-blue-50/50 dark:bg-blue-900/10 mb-6 animate-in slide-in-from-top-4 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Edit className="h-5 w-5" /> Verify & Adjust Promotion for {verifyData.employeeName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full space-y-1">
                <label className="text-xs font-semibold">Verify Designation</label>
                <Input value={verifyData.newDesignation} onChange={e => setVerifyData({...verifyData, newDesignation: e.target.value})} required />
              </div>
              <div className="w-full space-y-1">
                <label className="text-xs font-semibold">Verify Role</label>
                <Select value={verifyData.newRole} onValueChange={v => setVerifyData({...verifyData, newRole: v})}>
                  <SelectTrigger className="bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                    <SelectItem value="HR_OFFICER">HR_OFFICER</SelectItem>
                    <SelectItem value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</SelectItem>
                    <SelectItem value="DIRECT_MANAGER">DIRECT_MANAGER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-1">
                <label className="text-xs font-semibold">Verify Basic Annual Salary (₹)</label>
                <Input type="number" value={verifyData.newSalary} onChange={e => setVerifyData({...verifyData, newSalary: e.target.value})} required />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setVerifyData(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isLoading}>Forward to CEO</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Promotion Requests</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employee..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left font-medium">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Current Role & Salary</th>
                  <th className="p-4">Proposed Role & Salary</th>
                  <th className="p-4">Timeline</th>
                  <th className="p-4 min-w-[150px] text-center">Business Case</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">Loading pipeline...</td></tr>
                ) : promotions.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No active promotion requests.</td></tr>
                ) : (
                  promotions.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">
                        {item.employeeName}
                        <span className="block text-xs text-muted-foreground font-normal">{item.employeeId}</span>
                      </td>
                      
                      <td className="p-4">
                        <span className="block text-muted-foreground">{item.currentDesignation}</span>
                        <span className="text-xs font-medium text-slate-500">₹ {item.currentSalary?.toLocaleString('en-IN') || 0}</span>
                      </td>
                      
                      <td className="p-4">
                        <span className="block font-semibold text-primary">{item.newDesignation}</span>
                        <span className="text-xs font-bold text-green-600">₹ {item.newSalary?.toLocaleString('en-IN') || 0}</span>
                      </td>
                      
                      <td className="p-4 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground" title="Requested Date">
                            Req: {new Date(item.createdAt).toLocaleDateString('en-GB')}
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400" title="Target Effective Date">
                            Starts: {new Date(item.effectiveDate).toLocaleDateString('en-GB')}
                          </span>
                          
                          {(item.status === "Approved" || item.status === "Rejected") && item.actionedAt && (
                            <span className={cn(
                              "font-bold", 
                              item.status === "Approved" ? "text-green-600" : "text-red-600"
                            )}>
                              {item.status === "Approved" ? "Appr:" : "Rej:"} {new Date(item.actionedAt).toLocaleDateString('en-GB')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div 
                          className="max-w-[180px] truncate text-xs text-muted-foreground cursor-help mx-auto text-center"
                          title={item.justification}
                        >
                          {item.justification}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border whitespace-nowrap", // ADDED whitespace-nowrap
                          item.status === "Approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                          item.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                          item.status === "Pending HR Review" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                          item.status === "Pending Country Manager" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" :
                          item.status === "Pending CEO" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" :
                          item.status === "Re-verify" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
                          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900 transition-colors" onClick={() => handleViewDetails(item)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {userRole === "HR_MANAGER" && item.status === "Pending HR Review" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50 dark:hover:text-blue-300 transition-colors" 
                              onClick={() => handleAction(item._id, 'Pending Country Manager')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Verify Compliance
                            </Button>
                          )}

                          {userRole === "COUNTRY_MANAGER" && (item.status === "Pending Country Manager" || item.status === "Re-verify") && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors" 
                              onClick={() => setVerifyData(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit & Verify
                            </Button>
                          )}
                        
                          {userRole === "CEO" && item.status === "Pending CEO" && (
                            <>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-100 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50 transition-colors" onClick={() => handleAction(item._id, 'Approved')} title="Approve">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-100 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/50 transition-colors" onClick={() => handleAction(item._id, 'Re-verify')} title="Send back to Country Manager">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 transition-colors" onClick={() => handleAction(item._id, 'Rejected')} title="Reject">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/30">
              <Pagination 
                currentPage={paginationInfo.page} 
                totalPages={paginationInfo.totalPages} 
                totalItems={paginationInfo.total} 
                itemsPerPage={10}
                onPageChange={(p) => setPage(p)} 
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promotion Business Case Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-md border">
              <div><span className="text-muted-foreground block text-xs">Employee Name</span> <span className="font-medium">{selectedPromotion?.employeeName}</span></div>
              <div><span className="text-muted-foreground block text-xs">Employee ID</span> <span className="font-medium">{selectedPromotion?.employeeId}</span></div>
              <div><span className="text-muted-foreground block text-xs">Current Role</span> <span className="font-medium">{selectedPromotion?.currentDesignation}</span></div>
              <div><span className="text-muted-foreground block text-xs">Proposed Role</span> <span className="font-medium">{selectedPromotion?.newDesignation}</span></div>
            </div>
            
            <div>
              <span className="text-sm font-semibold text-foreground block mb-1">Business Justification:</span>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-muted">
                {selectedPromotion?.justification || "No justification provided."}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// EMPLOYEE PROMOTION NOMINATION FORM
const NominationForm = ({ user }) => {
  const queryClient = useQueryClient()
  const [employees, setEmployees] = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [isFetchingDetails, setIsFetchingDetails] = useState(false)
  
  const [formData, setFormData] = useState({
    newDesignation: "", newRole: "", newSalary: "", effectiveDate: "", justification: ""
  })

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await apiClient.get('/admin/users')
        const data = res.data?.users || res.data?.data || res.data || []
        setEmployees(data)
      } catch (error) { console.error(error) }
    }
    fetchTeam()
  }, [])

  const handleEmployeeSelect = async (empId) => {
    const baseUser = employees.find(e => e._id === empId || e.employeeCode === empId)
    setSelectedEmp(baseUser)
    setFormData(prev => ({ ...prev, newRole: baseUser?.role || "" }))

    if (baseUser) {
      setIsFetchingDetails(true)
      try {
        const relationKey = baseUser.employeeCode || baseUser.employeeId || baseUser._id; 
        
        if (relationKey) {
          const res = await apiClient.get(`/employees/${relationKey}`)
          
          let deepEmpData = res?.data?.data || res?.data?.employee || res?.data || res;
          
          if (Array.isArray(deepEmpData) && deepEmpData.length > 0) {
              deepEmpData = deepEmpData[0];
          }

          if (deepEmpData && typeof deepEmpData === 'object') {
            setSelectedEmp(prev => ({
              ...prev,
              ...deepEmpData,
              designation: deepEmpData.designation || prev?.designation || "N/A",
              salary: deepEmpData.salary || prev?.salary || { basic: 0 }
            }))
          }
        }
      } catch (err) { 
        console.error("Failed to fetch deep employee details:", err) 
      } finally { 
        setIsFetchingDetails(false) 
      }
    }
  }
 const submitMutation = useMutation({
    mutationFn: (data) => apiClient.post("/promotions/nominate", data),
    onSuccess: () => {
      toast.success("Nomination submitted for HR Compliance Review!")
      setSelectedEmp(null)
      setFormData({ newDesignation: "", newRole: "", newSalary: "", effectiveDate: "", justification: "" })
      queryClient.invalidateQueries(['promotions'])
    },
    onError: (err) => {
      const errorMsg = err?.error || err?.response?.data?.error || err?.message || "Database rejected the payload.";
      toast.error(`Error: ${errorMsg}`);
      console.error("RAW BACKEND ERROR:", err);
    }
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedEmp || !formData.newDesignation || !formData.newSalary || !formData.effectiveDate) {
      return toast.error("Please fill all required fields")
    }

    submitMutation.mutate({
      employeeId: selectedEmp.employeeCode || selectedEmp._id,
      employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
      employeeEmail: selectedEmp.email || selectedEmp.workEmail || "N/A",

      department: selectedEmp.department || "N/A",
      currentDepartment: selectedEmp.department || "N/A",
      
      currentDesignation: selectedEmp.designation || "Employee",
      currentRole: selectedEmp.role,
      currentSalary: selectedEmp.salary?.basic || 0,
      reportingManager: selectedEmp.reportingManager || user.firstName,
      newDesignation: formData.newDesignation,
      newRole: formData.newRole,
      newSalary: Number(formData.newSalary),
      effectiveDate: formData.effectiveDate,
      justification: formData.justification
    })
  }
  return (
    <Card className="max-w-4xl mx-auto border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="bg-muted/20 border-b">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" /> Create Promotion Business Case
        </CardTitle>
        <CardDescription>Initiate a promotion request for your team member. It will be sent to HR for compliance verification.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Employee <span className="text-red-500">*</span></label>
            <Select onValueChange={handleEmployeeSelect}>
              <SelectTrigger><SelectValue placeholder="Search team member..." /></SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp._id} value={emp.employeeCode || emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-dashed relative">
                {isFetchingDetails && (
                  <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Current Status
                </h3>
                <div>
                  <label className="text-xs text-muted-foreground">Designation</label>
                  <Input disabled value={selectedEmp.designation || "N/A"} className="bg-transparent font-medium" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">System Role</label>
                  <Input disabled value={selectedEmp.role || "N/A"} className="bg-transparent font-medium" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Current Basic Annual Salary</label>
                  <Input disabled value={`₹ ${selectedEmp.salary?.basic || "0"}`} className="bg-transparent font-medium text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Proposed Status
                </h3>
                <div>
                  <label className="text-xs font-semibold">New Designation <span className="text-red-500">*</span></label>
                  <Input placeholder="e.g. Senior Software Engineer" value={formData.newDesignation} onChange={e => setFormData(p => ({...p, newDesignation: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Upgrade System Role?</label>
                  <Select value={formData.newRole} onValueChange={v => setFormData(p => ({...p, newRole: v}))}>
                    <SelectTrigger className="bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                      <SelectItem value="HR_OFFICER">HR_OFFICER</SelectItem>
                      <SelectItem value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</SelectItem>
                      <SelectItem value="DIRECT_MANAGER">DIRECT_MANAGER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold">New Basic Annual Salary <span className="text-red-500">*</span></label>
                  <Input type="number" placeholder="e.g. 75000" value={formData.newSalary} onChange={e => setFormData(p => ({...p, newSalary: e.target.value}))} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Effective Date <span className="text-red-500">*</span></label>
              <Input type="date" value={formData.effectiveDate} onChange={e => setFormData(p => ({...p, effectiveDate: e.target.value}))} className="[&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Justification <span className="text-red-500">*</span></label>
            <Textarea placeholder="Provide a detailed reason..." className="min-h-[100px]" value={formData.justification} onChange={e => setFormData(p => ({...p, justification: e.target.value}))} />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={submitMutation.isLoading || !selectedEmp}>
              {submitMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Nomination
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default EmployeePromotion
