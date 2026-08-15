import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { StatsCard } from "@/components/ui/stats-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Building2, Search, ArrowLeftRight, Clock, Plus, Loader2, Calendar, FileText, Check, X, ShieldCheck, UserCog, Briefcase, UserMinus, Pencil, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table"
import { ActionIcon } from "@/components/ui/action-icon"
import EmployeePromotion from "./EmployeePromotion"
import OffboardingRequests from "./OffboardingRequests"

import TransferRequestForm from "./TransferRequestForm"

const EmployeeTransfer = () => {
  const { user } = useAuth()
  const userRole = user?.role?.toUpperCase() || ""

  const canViewPromotions = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "HR_OFFICER"].includes(userRole)
  const canViewOffboarding = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "DIRECT_MANAGER"].includes(userRole)
  const canViewAdminTransfers = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "HR_OFFICER", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(userRole)

  if (userRole === "EMPLOYEE" || !canViewAdminTransfers) {
    return <EmployeeTransferView user={user} />
  }

  const visibleTabsCount = 1 + (canViewPromotions ? 1 : 0) + (canViewOffboarding ? 1 : 0)

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Lifecycle Approvals</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Manage employee mobility, promotions, and separation requests.</p>
      </div>

      <Tabs defaultValue="transfers" className="w-full">
        <TabsList className={cn("grid w-full max-w-3xl", `grid-cols-${visibleTabsCount}`)}>
          <TabsTrigger value="transfers">Employee Transfers</TabsTrigger>
          {canViewPromotions && <TabsTrigger value="promotions">Promotions</TabsTrigger>}
          {canViewOffboarding && <TabsTrigger value="offboarding">Offboarding Requests</TabsTrigger>}
        </TabsList>

        <TabsContent value="transfers" className="mt-4">
          <AdminTransferView user={user} />
        </TabsContent>

        {canViewPromotions && (
          <TabsContent value="promotions" className="mt-4">
            <EmployeePromotion />
          </TabsContent>
        )}

        {canViewOffboarding && (
          <TabsContent value="offboarding" className="mt-4">
            <OffboardingRequests />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const AdminTransferView = ({ user }) => {
  const userRole = user?.role?.toUpperCase() || ""
  const canAction = ["CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(userRole)
  const isCEO = userRole === "CEO"
  
  const canApproveReject = ["HR_MANAGER", "CEO", "COUNTRY_MANAGER"].includes(userRole)
  const canRecommend = ["DEPARTMENT_MANAGER", "DIRECT_MANAGER", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(userRole)

  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("pending")
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [recommendModalOpen, setRecommendModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [initiateModalOpen, setInitiateModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [recommendText, setRecommendText] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [activeTab, debouncedSearch])

  const { data: response, isLoading } = useQuery({
    queryKey: ['transfers', activeTab, page, debouncedSearch],
    queryFn: () => apiClient.get(`/transfers/all?tab=${activeTab}&page=${page}&limit=10&search=${debouncedSearch}`),
    keepPreviousData: true
  })

  const transfers = response?.data || []
  const stats = response?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 }
  const pagination = response?.pagination || { total: 0, page: 1, totalPages: 1 }

  const updateMutation = useMutation({
    mutationFn: ({ id, newStatus }) => apiClient.patch(`/transfers/update/${id}`, {
      status: newStatus,
      adminRemarks: `Action taken on ${new Date().toLocaleDateString()}`,
    }),
    onSuccess: (res, variables) => {
      toast.success(`Request ${variables.newStatus} successfully`)
      queryClient.invalidateQueries(['transfers'])
    },
    onError: (error) => {
      toast.error(error.message || error.error || "Error updating transfer status")
    }
  })

  const recommendMutation = useMutation({
    mutationFn: ({ id, recommendation }) => apiClient.patch(`/transfers/recommend/${id}`, { recommendation }),
    onSuccess: () => {
      toast.success("Recommendation submitted successfully")
      setRecommendModalOpen(false)
      setRecommendText("")
      setSelectedTransfer(null)
      queryClient.invalidateQueries(['transfers'])
    },
    onError: (error) => {
      toast.error(error.message || error.error || "Error submitting recommendation")
    }
  })

  const handleUpdateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, newStatus })
  }

  const handleRecommendSubmit = () => {
    if (!recommendText.trim()) return toast.error("Please enter a recommendation")
    recommendMutation.mutate({ id: selectedTransfer._id, recommendation: recommendText })
  }

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer)
    setDetailsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Requests" value={stats.total} icon={<ArrowLeftRight />} variant="blue" />
        <StatsCard title="Approved" value={stats.approved} icon={<CheckCircle2 />} variant="emerald" />
        <StatsCard title="Pending" value={stats.pending} icon={<Clock />} variant="amber" />
        <StatsCard title="Rejected" value={stats.rejected} icon={<XCircle />} variant="rose" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="history">Transfer History</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {["HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER_ADMIN", "CEO", "COUNTRY_MANAGER", "DEPARTMENT_MANAGER"].includes(userRole) && (
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={() => setInitiateModalOpen(true)} className="h-9 w-9 shrink-0">
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Initiate Transfer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => toast.success("Compiling Approved Transfers for Export...")} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export Pipeline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <TabsContent value="pending" className="mt-4">
          <TransferTable
            data={transfers}
            onAction={handleUpdateStatus}
            isHistory={false}
            loading={isLoading || updateMutation.isLoading}
            canAction={canAction}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            pagination={pagination}
            onPageChange={setPage}
            canApproveReject={canApproveReject}
            canRecommend={canRecommend}
            onRecommend={(item) => { setSelectedTransfer(item); setRecommendModalOpen(true); }}
            onViewDetails={handleViewDetails}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <TransferTable
            data={transfers}
            onAction={handleUpdateStatus} 
            isHistory={true}
            loading={isLoading || updateMutation.isLoading}
            canAction={isCEO} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            pagination={pagination}
            onPageChange={setPage}
            canApproveReject={isCEO}
            onViewDetails={handleViewDetails}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={initiateModalOpen} onOpenChange={setInitiateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Initiate Employee Transfer</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TransferRequestForm
              onSuccess={() => {
                setInitiateModalOpen(false);
                queryClient.invalidateQueries(['transfers']);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={recommendModalOpen} onOpenChange={setRecommendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recommendation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Add a written recommendation or context for <strong>{selectedTransfer?.employeeName}'s</strong> transfer. This will be visible to the HR Manager and CEO during the final approval process.
            </p>
            <Textarea
              placeholder="Enter your recommendation or remarks here..."
              value={recommendText}
              onChange={(e) => setRecommendText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecommendModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecommendSubmit} disabled={recommendMutation.isLoading}>
              {recommendMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Recommendation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-md border">
              <div><span className="text-muted-foreground block text-xs">Employee Name</span> <span className="font-medium">{selectedTransfer?.employeeName} ({selectedTransfer?.employeeId})</span></div>
              <div><span className="text-muted-foreground block text-xs">Transfer Type</span> <span className="font-medium">{selectedTransfer?.transferType}</span></div>
              <div><span className="text-muted-foreground block text-xs">Current Department</span> <span className="font-medium">{selectedTransfer?.currentDepartment}</span></div>
              <div><span className="text-muted-foreground block text-xs">Requested Department</span> <span className="font-medium">{selectedTransfer?.newDepartment}</span></div>
              <div><span className="text-muted-foreground block text-xs">Effective Date</span> <span className="font-medium">{selectedTransfer ? new Date(selectedTransfer.effectiveDate).toLocaleDateString() : ''}</span></div>
              <div><span className="text-muted-foreground block text-xs">Current Status</span> <span className="font-medium">{selectedTransfer?.status}</span></div>
            </div>
            
            <div>
              <span className="text-sm font-semibold text-foreground block mb-1">Employee's Reason for Transfer:</span>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-muted">
                {selectedTransfer?.reason || "No reason provided by employee."}
              </div>
            </div>

            {selectedTransfer?.managerRecommendation && (
              <div>
                <span className="text-sm font-semibold text-primary block mb-1">Management Recommendations:</span>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm whitespace-pre-wrap text-primary-800">
                  {selectedTransfer.managerRecommendation}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const EmployeeTransferView = ({ user }) => {
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState({ requestedDepartment: "", reason: "" })
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: response, isLoading } = useQuery({
    queryKey: ['myTransfers', page],
    queryFn: () => apiClient.get(`/transfers/my-requests?page=${page}&limit=10`),
    keepPreviousData: true
  })

  const myTransfers = response?.data || []
  const pagination = response?.pagination || { total: 0, page: 1, totalPages: 1 }

  const submitMutation = useMutation({
    mutationFn: (data) => apiClient.post("/transfers/request", data),
    onSuccess: () => {
      toast.success("Transfer request submitted successfully")
      setFormOpen(false)
      setFormData({ requestedDepartment: "", reason: "" })
      queryClient.invalidateQueries(['myTransfers'])
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to submit transfer request")
    }
  })

  const handleSubmit = () => {
    if (!formData.requestedDepartment.trim() || !formData.reason.trim()) {
      toast.error("Please fill all required fields")
      return
    }
    submitMutation.mutate({
      requestedDepartment: formData.requestedDepartment,
      reason: formData.reason,
    })
  }

  const columns = [
    {
      accessorKey: "department",
      header: "To Department",
      cell: ({ row }) => <span className="font-medium">{row.original.requestedDepartment || row.original.newDepartment}</span>
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span>{row.original.reason}</span>
    },
    {
      accessorKey: "submitted",
      header: "Submitted",
      cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold",
            row.original.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            row.original.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          )}>
            {row.original.status}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Transfer Request</h1>
          <p className="text-muted-foreground">Submit and track your department transfer requests</p>
        </div>
        {!formOpen && (
          <Button onClick={() => setFormOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> New Request
          </Button>
        )}
      </div>

      {formOpen && (
        <Card className="border shadow-md bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle>New Transfer Request</CardTitle>
            <CardDescription>Submit a request to transfer to another department. Your request will be reviewed by HR.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requested Department *</label>
              <Input
                placeholder="e.g. Finance, IT, Human Resources"
                value={formData.requestedDepartment}
                onChange={e => setFormData(p => ({ ...p, requestedDepartment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Transfer *</label>
              <Input
                placeholder="Briefly describe your reason for transfer"
                value={formData.reason}
                onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setFormOpen(false); setFormData({ requestedDepartment: "", reason: "" }) }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitMutation.isLoading}>
                {submitMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md border overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">My Transfer Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading your requests...</div>
            ) : myTransfers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No transfer requests found. Click New Request to submit one.</div>
            ) : (
              <DataTable columns={columns} data={myTransfers} searchable={false} />
            )}
          </div>
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center bg-muted/20">
              <Pagination 
                currentPage={pagination.page} 
                totalPages={pagination.totalPages} 
                totalItems={pagination.total} 
                itemsPerPage={10}
                onPageChange={(p) => setPage(p)} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const StatCard = ({ title, value, icon, color = "text-foreground", gradient = "from-background to-transparent" }) => (
  <Card className={cn(
    "relative overflow-hidden shadow-sm transition-all duration-300 ease-out border border-slate-200 dark:border-slate-800 rounded-[16px]",
    "hover:shadow-lg hover:-translate-y-1 hover:brightness-95 dark:hover:brightness-110 group",
    `bg-gradient-to-br ${gradient}`
  )}>
    <CardContent className="p-4 flex items-center justify-between relative z-10">
      <div>
        <p className="text-xs font-semibold text-muted-foreground/80 group-hover:text-foreground/90 transition-colors duration-300">{title}</p>
        <h3 className={cn("text-2xl font-bold mt-1 tracking-tight", color)}>{value}</h3>
      </div>
      <div className="p-2.5 bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-xl shadow-sm border border-black/5 dark:border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        {icon}
      </div>
    </CardContent>
  </Card>
)

const TransferTable = ({ data, onAction, isHistory, loading, canAction, searchTerm, onSearchChange, pagination, onPageChange, canApproveReject = true, canRecommend = false, onRecommend, onViewDetails, userRole }) => {
  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => <span className="font-medium">{row.original.employeeName}</span>
    },
    {
      accessorKey: "employeeId",
      header: "ID",
      cell: ({ row }) => <span>{row.original.employeeId}</span>
    },
    {
      accessorKey: "currentDept",
      header: isHistory ? "From Dept" : "Current Dept",
      cell: ({ row }) => <span>{row.original.currentDepartment}</span>
    },
    {
      accessorKey: "newDept",
      header: isHistory ? "To Dept" : "New Dept",
      cell: ({ row }) => <span>{row.original.newDepartment}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <span>{row.original.transferType}</span>
    },
    {
      accessorKey: "timeline",
      header: "Timeline",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1 text-xs whitespace-nowrap">
            <div className="text-muted-foreground text-purple-600 dark:text-purple-400 font-medium">
              Req: {new Date(item.requestDate || item.createdAt).toLocaleDateString()}
            </div>
            {item.status !== 'Pending' && item.actionedAt && (
              <div className={item.status === 'Approved' ? 'text-green-600 dark:text-green-500 font-medium' : 'text-red-600 dark:text-red-500 font-medium'}>
                {item.status === 'Approved' ? 'Appr' : 'Rej'}: {new Date(item.actionedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-center">{!canAction ? "Status" : (isHistory ? "Status & Override" : "Actions")}</div>,
      cell: ({ row }) => {
        const item = row.original;
        const formattedUserRole = userRole ? userRole.replace('_', ' ') : '';
        const hasRecommended = item.managerRecommendation && item.managerRecommendation.includes(`[${formattedUserRole}]`);
        
        if (!canAction) {
          return (
            <div className="flex justify-center">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                item.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                item.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              )}>
                {item.status}
              </span>
            </div>
          )
        }
        
        return (
          <div className="flex items-center justify-center gap-2">
            {isHistory && (
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-semibold mr-2",
                item.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {item.status}
              </span>
            )}
            
            {(isHistory || canApproveReject) && item.status !== "Approved" && (
              <ActionIcon icon={CheckCircle2} tooltip={isHistory ? "Override to Approved" : "Approve"} onClick={() => onAction(item._id, 'Approved')} className="text-green-600 hover:bg-green-50" />
            )}

            {(isHistory || canApproveReject) && item.status !== "Rejected" && (
              <ActionIcon icon={XCircle} tooltip={isHistory ? "Override to Rejected" : "Reject"} onClick={() => onAction(item._id, 'Rejected')} className="text-red-600 hover:bg-red-50" />
            )}

            {!isHistory && canRecommend && !hasRecommended && (
              <ActionIcon icon={Pencil} tooltip="Recommend" onClick={() => onRecommend(item)} className="text-purple-600 hover:bg-purple-50" />
            )}

            {!isHistory && canRecommend && hasRecommended && (
              <span className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-md text-xs font-semibold">
                Recommended
              </span>
            )}
            
            <ActionIcon 
              icon={FileText} 
              tooltip="View Details & Recommendations" 
              onClick={() => onViewDetails(item)}
              className={item.managerRecommendation ? "border-primary text-primary hover:bg-primary/10" : ""}
            />
          </div>
        )
      }
    }
  ];

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
      {isHistory && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Transfer Logs</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transfers..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("p-0", isHistory ? "pt-2" : "pt-0")}>
        <div className="rounded-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading data...</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No records found</div>
          ) : (
            <DataTable columns={columns} data={data} searchable={false} />
          )}
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-muted/20">
            <Pagination 
              currentPage={pagination.page} 
              totalPages={pagination.totalPages} 
              totalItems={pagination.total} 
              itemsPerPage={10}
              onPageChange={(p) => onPageChange(p)} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EmployeeTransfer