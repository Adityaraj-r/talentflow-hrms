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
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, X, Loader2, Search, UserMinus, Eye, FileText, CheckCircle2, Clock, Undo2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import InitiateSeparationModal from "@/components/modals/InitiateSeparationModal" 
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table"
import { ActionIcon } from "@/components/ui/action-icon"

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
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState("")

  const userRole = user?.role?.toUpperCase() || ""
  const canInitiatePathB = ["HR_MANAGER", "DIRECT_MANAGER"].includes(userRole)

  const { data: response, isLoading } = useQuery({
    queryKey: ['offboarding', page, searchTerm],
    queryFn: () => apiClient.get(`/offboarding/all?page=${page}&limit=10&search=${searchTerm}`),
    keepPreviousData: true
  })

  let requests = response?.data || []
  const paginationInfo = response?.pagination || { total: 0, page: 1, totalPages: 1 }

  if (statusFilter !== 'ALL') {
      requests = requests.filter(req => req.status === statusFilter)
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminRemarks }) => apiClient.patch(`/offboarding/update/${id}`, { status, adminRemarks }),
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

  const handleAction = (id, status, reason = "") => {
    updateMutation.mutate({ id, status, adminRemarks: reason });
  }
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
    setRejectMode(false)
    setRejectReason("")
    setRejectError("")
    setDetailsModalOpen(true)
  }

  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.employeeName}</p>
          <p className="text-xs text-muted-foreground">{row.original.employeeId}</p>
        </div>
      )
    },
    {
      accessorKey: "department",
      header: () => <div className="text-center">Department</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <p className="text-sm font-medium mx-auto">{row.original.department}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[150px] mx-auto">{row.original.designation}</p>
        </div>
      )
    },
    {
      accessorKey: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="text-center">
            <span className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm whitespace-nowrap",
              req.type?.toLowerCase().includes("resignation") ? "bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
              req.type?.toLowerCase().includes("termination") ? "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
              req.type?.toLowerCase().includes("absconding") ? "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" :
              "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
            )}>
              {req.type}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: "lwd",
      header: "LWD (Proposed)",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <span className="font-medium whitespace-nowrap text-sm">
            {new Date(req.noticePeriod?.proposedExitDate || req.proposedExitDate || req.exitDate || req.createdAt).toLocaleDateString('en-GB')}
          </span>
        )
      }
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="text-center">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap inline-flex items-center gap-1",
              req.status === 'Withdrawal Pending' ? "bg-orange-500/10 text-orange-600 border-orange-200" :
              req.status === "Exited" ? "bg-green-500/10 text-green-600 border-green-200" :
              req.status.includes("High Priority") ? "bg-red-500/10 text-red-600 border-red-200" :
              req.status.includes("Withdrawn") ? "bg-slate-500/10 text-slate-600 border-slate-200" :
              req.status.includes("Rejected") ? "bg-red-500/10 text-red-600 border-red-200" :
              req.status?.includes("Pending") ? "bg-purple-500/10 text-purple-600 border-purple-200" :
              req.status?.includes("Exit Clearance") ? "bg-purple-500/10 text-purple-600 border-purple-200" :
              "bg-yellow-500/10 text-yellow-600 border-yellow-200"
            )}>
              {req.status === 'Withdrawal Pending' ? 'Withdrawal Pending' : (
                <>
                  {req.status?.includes('Exit Clearance') ? <Clock className="w-3 h-3"/> : null}
                  {req.status.replace(' Approval', '')}
                </>
              )}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const req = row.original;
        const currentUserId = user?.id || user?._id;
        const canWithdraw = req.initiatedBy === currentUserId && req.status?.includes('Pending');
        return (
          <div className="flex items-center justify-center gap-2">
            <ActionIcon icon={Eye} tooltip="View Details" onClick={() => openDetailsModal(req)} />
            
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
        )
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
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
                <SelectItem value="Exit Clearance Started">Exit Clearance Started</SelectItem>
                <SelectItem value="High Priority Exit Blocked">High Priority Exit Blocked</SelectItem>
                <SelectItem value="Exited">Exited</SelectItem>
                <SelectItem value="Resignation Withdrawn">Resignation Withdrawn</SelectItem>
                <SelectItem value="Withdrawal Pending">Withdrawal Pending</SelectItem>
                <SelectItem value="Withdrawal Rejected">Withdrawal Rejected</SelectItem>
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
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setInitiateModalOpen(true)} className="h-9 w-9 shrink-0 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Initiate Separation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="rounded-md overflow-hidden">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                <p className="text-sm font-medium">Loading pipeline...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <UserMinus className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">Pipeline is empty. No active separations matching criteria.</p>
              </div>
            ) : (
              <DataTable columns={columns} data={requests} searchable={false} />
            )}
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
                         <div className="mt-4 pt-4 border-t transition-all duration-300 ease-in-out">
                            {!rejectMode ? (
                              <div className="flex gap-2">
                                  <Button
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleAction(selectedRequest._id, getNextStatus(selectedRequest.status, userRole))}
                                  >
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Request
                                  </Button>
                                  <Button
                                      variant="destructive"
                                      onClick={() => {
                                        setRejectMode(true)
                                        setRejectReason("")
                                        setRejectError("")
                                      }}> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="text-sm font-semibold flex items-center gap-2 mb-1 text-red-600">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                  </label>
                                  <Textarea 
                                    placeholder="Enter the reason for rejecting this request..." 
                                    className={cn("min-h-[100px] resize-none", rejectError ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    value={rejectReason} 
                                    onChange={e => {
                                      setRejectReason(e.target.value)
                                      if (e.target.value.trim().length >= 10) setRejectError("")
                                    }} 
                                  />
                                  {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                      variant="destructive"
                                      onClick={() => {
                                        if (rejectReason.trim().length < 10) {
                                          setRejectError("Reason must be at least 10 characters.")
                                          return;
                                        }
                                        if (rejectReason.trim().length > 500) {
                                          setRejectError("Reason must not exceed 500 characters.")
                                          return;
                                        }
                                        handleAction(selectedRequest._id, 'Rejected', rejectReason)
                                      }}
                                  >
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Rejection
                                  </Button>
                                  <Button
                                      variant="outline"
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                                      onClick={() => setRejectMode(false)}
                                  >
                                      Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                        </div>
                    )}
                    
                    {/* Action Buttons for HR Withdrawal Approval */}
                    {userRole === 'HR_MANAGER' && selectedRequest.status === 'Withdrawal Pending' && (
                         <div className="mt-4 pt-4 border-t transition-all duration-300 ease-in-out">
                            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                                <h4 className="text-sm font-semibold text-orange-800 mb-2">Withdrawal Request Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-orange-900">Reason:</span>
                                        <p className="text-orange-800 mt-1 italic">{selectedRequest.withdrawalReason}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-orange-900">Requested On:</span>
                                        <p className="text-orange-800">{new Date(selectedRequest.withdrawalRequestedAt).toLocaleString('en-GB')}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {!rejectMode ? (
                              <div className="flex gap-2">
                                  <Button
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleAction(selectedRequest._id, 'Resignation Withdrawn')}
                                  >
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Withdrawal
                                  </Button>
                                  <Button
                                      variant="destructive"
                                      onClick={() => {
                                        setRejectMode(true)
                                        setRejectReason("")
                                        setRejectError("")
                                      }}
                                  >
                                      <X className="w-4 h-4 mr-2" /> Reject Withdrawal
                                  </Button>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="text-sm font-semibold flex items-center gap-2 mb-1 text-red-600">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                  </label>
                                  <Textarea 
                                    placeholder="Enter the reason for rejecting this withdrawal request..." 
                                    className={cn("min-h-[100px] resize-none", rejectError ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    value={rejectReason} 
                                    onChange={e => {
                                      setRejectReason(e.target.value)
                                      if (e.target.value.trim().length >= 10) setRejectError("")
                                    }} 
                                  />
                                  {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                      variant="destructive"
                                      onClick={() => {
                                        if (rejectReason.trim().length < 10) {
                                          setRejectError("Reason must be at least 10 characters.")
                                          return;
                                        }
                                        if (rejectReason.trim().length > 500) {
                                          setRejectError("Reason must not exceed 500 characters.")
                                          return;
                                        }
                                        handleAction(selectedRequest._id, 'Withdrawal Rejected', rejectReason)
                                      }}
                                  >
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Rejection
                                  </Button>
                                  <Button
                                      variant="outline"
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                                      onClick={() => setRejectMode(false)}
                                  >
                                      Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
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
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'it', status: 'Cleared' }})}>Clear IT</Button>
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'finance', status: 'Cleared' }})}>Clear Finance</Button>
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'admin', status: 'Cleared' }})}>Clear Admin</Button>
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { clearanceType: 'manager', status: 'Cleared' }})}>Clear Manager</Button>
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => clearanceMutation.mutate({ id: selectedRequest._id, payload: { ktUpdates: { status: 'Completed', managerSignOff: true } }})}>Mark KT Done</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="audit" className="pt-4">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-slate-800 border-b pb-2">Resignation Timeline</h3>
                            <div className="space-y-4">
                                {selectedRequest.auditLog?.slice().reverse().map((log, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm pb-4 border-b last:border-0 border-muted/50">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900 dark:text-white">{log.action}</p>
                                            {log.remarks && (
                                                <p className="text-muted-foreground text-xs">{log.remarks}</p>
                                            )}
                                            <p className="text-muted-foreground text-xs opacity-70">
                                                {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedRequest.withdrawalAuditLog && selectedRequest.withdrawalAuditLog.length > 0 && userRole === 'HR_MANAGER' && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-slate-800 border-b pb-2">Withdrawal Timeline (Confidential)</h3>
                                <div className="space-y-4">
                                    {selectedRequest.withdrawalAuditLog.slice().reverse().map((log, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm pb-4 border-b last:border-0 border-muted/50">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-900 dark:text-white">{log.action}</p>
                                                {log.remarks && (
                                                    <p className="text-muted-foreground text-xs">{log.remarks}</p>
                                                )}
                                                <p className="text-muted-foreground text-xs opacity-70">
                                                    {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
