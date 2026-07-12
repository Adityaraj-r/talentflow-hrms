import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X, Loader2, Search, UserMinus, Eye } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"
import InitiateSeparationModal from "@/components/modals/InitiateSeparationModal" 

const OffboardingRequests = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modals State
  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [initiateModalOpen, setInitiateModalOpen] = useState(false)

  const userRole = user?.role?.toUpperCase() || ""
  const canInitiatePathB = ["HR_MANAGER", "DIRECT_MANAGER"].includes(userRole)
  const { data: response, isLoading } = useQuery({
    queryKey: ['offboarding', page, searchTerm],
    queryFn: () => apiClient.get(`/offboarding/all?page=${page}&limit=10&search=${searchTerm}`),
    keepPreviousData: true
  })

  const requests = response?.data || []
  const pagination = response?.pagination || { total: 0, page: 1, totalPages: 1 }

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/offboarding/update/${id}`, { status }),
    onSuccess: (res, variables) => {
      toast.success(`Request moved to: ${variables.status}`)
      queryClient.invalidateQueries(['offboarding'])
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to update status.")
    }
  })

  const handleAction = (id, status) => {
    updateMutation.mutate({ id, status })
  }

  const getNextStatus = (currentStatus, role) => {
    if (role === 'DIRECT_MANAGER' && currentStatus === 'Pending Manager Approval') return 'Pending HR Approval';
    if (role === 'HR_MANAGER' && currentStatus === 'Pending HR Approval') return 'Pending Country Manager Approval';
    if (role === 'COUNTRY_MANAGER' && currentStatus === 'Pending Country Manager Approval') return 'Pending CEO Approval';
    if (role === 'CEO' && currentStatus === 'Pending CEO Approval') return 'Approved';
    return null; 
  }

  const getDisplayStatus = (status) => {
    if (status === "Pending Manager Approval") return "Pending Manager";
    if (status === "Pending Country Manager Approval") return "Pending Country Mgr";
    if (status === "Pending HR Approval") return "Pending HR";
    if (status === "Pending CEO Approval") return "Pending CEO";
    return status;
  }

  const openReasonModal = (req) => {
    setSelectedRequest(req)
    setReasonModalOpen(true)
  }

  return (
    <>
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              Separation Pipeline
            </CardTitle>
            <CardDescription>Track and action employee offboarding requests.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
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
              <thead className="bg-muted/50 border-y">
                <tr className="whitespace-nowrap">
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Department & Role</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">LWD (Proposed)</th>
                  <th className="px-3 py-3 font-medium text-center">Reason</th> 
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                  <th className="px-3 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading pipeline...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Pipeline is empty. No active separations.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const nextStatus = getNextStatus(req.status, userRole);
                    const canReject = nextStatus !== null && userRole !== 'DIRECT_MANAGER';

                    return (
                      <tr key={req._id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-semibold">{req.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{req.employeeId}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p>{req.department}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{req.designation}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] font-medium">
                            {req.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium whitespace-nowrap">
                          {new Date(req.proposedExitDate).toLocaleDateString('en-GB')}
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => openReasonModal(req)}
                            title="Read Justification"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap",
                            req.status === "Approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                            req.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :
                            req.status?.startsWith("Pending") ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                          )}>
                            {getDisplayStatus(req.status)}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {nextStatus ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-green-600 hover:bg-green-50 border-green-200 text-[11px] px-2"
                                  onClick={() => handleAction(req._id, nextStatus)}
                                  disabled={updateMutation.isLoading}
                                >
                                  {userRole === 'DIRECT_MANAGER' ? "Acknowledge" : "Verify & Fwd"}
                                </Button>
                                {canReject && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={() => handleAction(req._id, 'Rejected')}
                                    disabled={updateMutation.isLoading}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                  {req.status === 'Approved' || req.status === 'Rejected' ? 'Completed' : 'View Only'}
                              </span>
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

      <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reason for Separation</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Employee:</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.employeeName} ({selectedRequest?.employeeId})</p>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Justification provided:</p>
            <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-muted max-h-[300px] overflow-y-auto">
              {selectedRequest?.reason || "No reason provided."}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setReasonModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <InitiateSeparationModal 
        isOpen={initiateModalOpen} 
        onClose={() => setInitiateModalOpen(false)} 
      />
    </>
  )
}

export default OffboardingRequests