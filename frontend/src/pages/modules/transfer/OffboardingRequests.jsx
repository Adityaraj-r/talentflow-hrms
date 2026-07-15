import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Check, X, Loader2, Search, UserMinus, Eye, FileText, CheckCircle2, Clock, Undo2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import InitiateSeparationModal from "@/components/modals/InitiateSeparationModal" 

const OffboardingRequests = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Modals State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [initiateModalOpen, setInitiateModalOpen] = useState(false)

  const userRole = user?.role?.toUpperCase() || ""
  const canInitiatePathB = ["HR_MANAGER", "DIRECT_MANAGER"].includes(userRole)

  const { data: response, isLoading } = useQuery({
    queryKey: ['offboarding', page, searchTerm],
    queryFn: () => apiClient.get(`/offboarding/all?page=${page}&limit=100&search=${searchTerm}`),
    keepPreviousData: true
  })

  let requests = response?.data || []
  if (statusFilter !== 'ALL') {
      requests = requests.filter(req => req.status === statusFilter)
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/offboarding/update/${id}`, { status }),
    onSuccess: (res, variables) => {
      toast.success(`Request moved to: ${variables.status}`)
      queryClient.invalidateQueries(['offboarding'])
      if (selectedRequest) setDetailsModalOpen(false)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to update status.")
    }
  })

  const withdrawMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/offboarding/withdraw/${id}`),
    onSuccess: () => {
      toast.success("Request withdrawn successfully.")
      queryClient.invalidateQueries(['offboarding'])
      setDetailsModalOpen(false)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to withdraw request.")
    }
  })

  const clearanceMutation = useMutation({
    mutationFn: ({ id, payload }) => apiClient.patch(`/offboarding/clearance/${id}`, payload),
    onSuccess: () => {
      toast.success("Clearance updated successfully.")
      queryClient.invalidateQueries(['offboarding'])
    }
  })

  const handleAction = (id, status) => updateMutation.mutate({ id, status })
  const handleWithdraw = (id) => withdrawMutation.mutate(id)

  const getNextStatus = (currentStatus, role) => {
    if (role === 'DIRECT_MANAGER' && currentStatus === 'Pending Manager Approval') return 'Pending HR Approval';
    if (role === 'HR_MANAGER' && currentStatus === 'Pending HR Approval') return 'Pending Country Manager Approval';
    if (role === 'COUNTRY_MANAGER' && currentStatus === 'Pending Country Manager Approval') return 'Pending CEO Approval';
    if (role === 'CEO' && currentStatus === 'Pending CEO Approval') return 'Approved';
    return null; 
  }

  const getProgressPercentage = (req) => {
      const exitDate = req.noticePeriod?.approvedExitDate || req.exitDate;
      const totalDays = req.noticePeriod?.totalDaysRequired;
      if (!exitDate || !totalDays) return 0;
      const start = new Date(req.createdAt).getTime();
      const end = new Date(exitDate).getTime();
      const now = new Date().getTime();
      
      if (now >= end) return 100;
      if (now <= start) return 0;
      
      const totalDuration = end - start;
      const passedDuration = now - start;
      return Math.min(Math.round((passedDuration / totalDuration) * 100), 100);
  }

  const openDetailsModal = (req) => {
    setSelectedRequest(req)
    setDetailsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              Separation Pipeline
            </CardTitle>
            <CardDescription>Track and action employee offboarding requests.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="Pending Manager Approval">Pending Manager</SelectItem>
                <SelectItem value="Pending HR Approval">Pending HR</SelectItem>
                <SelectItem value="Pending CEO Approval">Pending CEO</SelectItem>
                <SelectItem value="On Notice Period">On Notice Period</SelectItem>
                <SelectItem value="Exit Clearance">Exit Clearance</SelectItem>
                <SelectItem value="Exited">Exited</SelectItem>
                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canInitiatePathB && (
              <Button variant="destructive" onClick={() => setInitiateModalOpen(true)}>
                 Initiate Separation
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">LWD (Proposed)</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading pipeline...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Pipeline is empty. No active separations matching criteria.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const nextStatus = getNextStatus(req.status, userRole);
                    const currentUserId = user?.id || user?._id;
                    const canWithdraw = req.initiatedBy === currentUserId && req.status?.includes('Pending');

                    return (
                      <tr key={req._id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm">{req.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{req.employeeId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{req.department}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{req.designation}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] font-medium border">
                            {req.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-sm">
                          {new Date(req.noticePeriod?.proposedExitDate || req.proposedExitDate || req.exitDate || req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap inline-flex items-center gap-1",
                            req.status === "Exited" ? "bg-green-50 text-green-700 border-green-200" :
                            req.status === "Withdrawn" ? "bg-gray-50 text-gray-700 border-gray-200" :
                            req.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                            req.status?.startsWith("Pending") ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-yellow-50 text-yellow-700 border-yellow-200"
                          )}>
                            {req.status === 'Exit Clearance' ? <Clock className="w-3 h-3"/> : null}
                            {req.status.replace(' Approval', '')}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[11px]"
                              onClick={() => openDetailsModal(req)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                            </Button>
                            
                            {canWithdraw && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleWithdraw(req._id)}
                                  disabled={withdrawMutation.isLoading}
                                >
                                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Withdraw
                                </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Separation Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-2 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/40 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-medium text-sm">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-sm">{selectedRequest.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Proposed LWD</p>
                  <p className="font-medium text-sm">{new Date(selectedRequest.noticePeriod?.proposedExitDate || selectedRequest.proposedExitDate || selectedRequest.exitDate || selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium text-sm text-primary">{selectedRequest.status}</p>
                </div>
              </div>

              {/* Progress Bar (Visible if Approved) */}
              {['On Notice Period', 'Exit Clearance'].includes(selectedRequest.status) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Notice Period Progress</span>
                    <span>{getProgressPercentage(selectedRequest)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(selectedRequest)} className="h-2" />
                </div>
              )}

              {/* Tabs for detailed sections */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview & Flow</TabsTrigger>
                  <TabsTrigger value="clearance">Clearance & KT</TabsTrigger>
                  <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 pt-4">
                    <div>
                        <p className="text-sm font-semibold mb-2">Justification / Reason</p>
                        <div className="p-3 bg-muted/30 rounded-md text-sm border">
                            {selectedRequest.reason}
                        </div>
                    </div>
                    
                    {/* Action Buttons for Managers */}
                    {getNextStatus(selectedRequest.status, userRole) && (
                         <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAction(selectedRequest._id, getNextStatus(selectedRequest.status, userRole))}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Request
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleAction(selectedRequest._id, 'Rejected')}
                            >
                                <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="clearance" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="shadow-none">
                            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                <CardTitle className="text-sm">Department Clearances</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {['it', 'finance', 'admin', 'manager'].map(dept => (
                                    <div key={dept} className="flex justify-between items-center text-sm">
                                        <span className="capitalize">{dept} Dept</span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium border",
                                            selectedRequest.clearance?.[dept]?.status === 'Cleared' ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                        )}>
                                            {selectedRequest.clearance?.[dept]?.status || 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Card className="shadow-none">
                            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                <CardTitle className="text-sm">Knowledge Transfer</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span>KT Status</span>
                                    <span className="font-medium text-primary">
                                        {selectedRequest.knowledgeTransfer?.status || 'Pending'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {['HR_MANAGER', 'ADMIN', 'DIRECT_MANAGER'].includes(userRole) && selectedRequest.status === 'Exit Clearance' && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'it', status: 'Cleared' }})}>Clear IT</Button>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'finance', status: 'Cleared' }})}>Clear Finance</Button>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'admin', status: 'Cleared' }})}>Clear Admin</Button>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'manager', status: 'Cleared' }})}>Clear Manager</Button>
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { ktUpdates: { status: 'Completed', managerSignOff: true } }})}>Mark KT Done</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="audit" className="pt-4">
                    <div className="space-y-4">
                        {selectedRequest.auditLog?.slice().reverse().map((log, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                <div>
                                    <p className="font-medium">{log.action}</p>
                                    <p className="text-muted-foreground text-xs">{log.remarks}</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InitiateSeparationModal 
        isOpen={initiateModalOpen} 
        onClose={() => setInitiateModalOpen(false)} 
      />
    </div>
  )
}

export default OffboardingRequests