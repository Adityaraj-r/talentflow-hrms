import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Check, X, Search, ArrowLeftRight, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import EmployeePromotion from "./EmployeePromotion"
import OffboardingRequests from "./OffboardingRequests"

const EmployeeTransfer = () => {
  const { user } = useAuth()
  const userRole = user?.role?.toUpperCase() || ""

  const canViewPromotions = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "HR_OFFICER"].includes(userRole)
  const canViewOffboarding = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "HR_OFFICER"].includes(userRole)
  const canViewAdminTransfers = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "HR_OFFICER", "OPERATIONS_MANAGER"].includes(userRole)

  if (userRole === "EMPLOYEE" || !canViewAdminTransfers) {
    return <EmployeeTransferView user={user} />
  }

  const visibleTabsCount = 1 + (canViewPromotions ? 1 : 0) + (canViewOffboarding ? 1 : 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lifecycle Approvals</h1>
        <p className="text-muted-foreground">Manage employee mobility, promotions, and separation requests.</p>
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
  
  const canAction = ["ADMIN", "CEO", "COUNTRY_MANAGER", "HR_MANAGER", "DEPARTMENT_MANAGER"].includes(userRole)
  const isCEO = userRole === "CEO"
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("pending")
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

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

  const handleUpdateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats.total} icon={<ArrowLeftRight className="text-blue-500" />} />
        <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 className="text-green-500" />} color="text-green-600" />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-orange-500" />} color="text-orange-600" />
        <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="text-red-500" />} color="text-red-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="history">Transfer History</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={() => toast.success("Compiling Approved Transfers for Export...")}>
            <FileText className="h-4 w-4 mr-2" /> Export Pipeline
          </Button>
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
          />
        </TabsContent>
      </Tabs>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfer Request</h1>
          <p className="text-muted-foreground">Submit and track your department transfer requests</p>
        </div>
        {!formOpen && (
          <Button onClick={() => setFormOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> New Request
          </Button>
        )}
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>New Transfer Request</CardTitle>
            <CardDescription>Submit a request to transfer to another department. Your request will be reviewed by Admin.</CardDescription>
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

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg">My Transfer Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left font-medium">
                  <th className="p-4">To Department</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">Loading your requests...</td></tr>
                ) : myTransfers.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">No transfer requests found. Click New Request to submit one.</td></tr>
                ) : (
                  myTransfers.map(t => (
                    <tr key={t._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{t.requestedDepartment || t.newDepartment}</td>
                      <td className="p-4">{t.reason}</td>
                      <td className="p-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            t.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            t.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          )}>
                            {t.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={pagination.page === pagination.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const StatCard = ({ title, value, icon, color = "text-foreground" }) => (
  <Card className="shadow-md border-none transition-all hover:shadow-lg">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className={cn("text-2xl font-bold mt-1", color)}>{value}</h3>
      </div>
      <div className="p-3 bg-muted rounded-full">{icon}</div>
    </CardContent>
  </Card>
)

const TransferTable = ({ data, onAction, isHistory, loading, canAction, searchTerm, onSearchChange, pagination, onPageChange }) => {
  return (
    <Card className="shadow-sm border">
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
        <div className="rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left font-medium">
                <th className="p-4">Employee</th>
                <th className="p-4">ID</th>
                <th className="p-4">{isHistory ? "From" : "Current"} Dept</th>
                <th className="p-4">{isHistory ? "To" : "New"} Dept</th>
                <th className="p-4">Type</th>
                <th className="p-4">Effective Date</th>
                <th className="p-4 text-center">{!canAction ? "Status" : (isHistory ? "Status & Override" : "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No records found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{item.employeeName}</td>
                    <td className="p-4">{item.employeeId}</td>
                    <td className="p-4">{item.currentDepartment}</td>
                    <td className="p-4">{item.newDepartment}</td>
                    <td className="p-4">{item.transferType}</td>
                    <td className="p-4">{new Date(item.effectiveDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {!canAction ? (
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
                      ) : (
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
                          
                          {item.status !== "Approved" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                              onClick={() => onAction(item._id, 'Approved')}
                              title={isHistory ? "Override to Approved" : "Approve"}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          {item.status !== "Rejected" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => onAction(item._id, 'Rejected')}
                              title={isHistory ? "Override to Rejected" : "Reject"}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {!isHistory && (
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EmployeeTransfer