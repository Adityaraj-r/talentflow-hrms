import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Calendar, FileText, ArrowRight, CheckCircle2, Undo2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

const EmployeeResignation = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState("")
  
  const [formData, setFormData] = useState({
    proposedExitDate: "",
    reason: ""
  })

  const { data: response, isLoading: isChecking } = useQuery({
    queryKey: ['myOffboarding'],
    queryFn: () => apiClient.get('/offboarding/all'),
  })

  const existingRequest = response?.data?.find(req => 
    !['Resignation Withdrawn', 'Withdrawn', 'Rejected'].includes(req.status)
  )

  const lastWithdrawnRequest = response?.data?.find(req => 
    ['Resignation Withdrawn', 'Withdrawn', 'Rejected'].includes(req.status)
  )

  const getExitDate = (req) => {
    if (!req) return null;
    return req.noticePeriod?.approvedExitDate || req.noticePeriod?.proposedExitDate || req.proposedExitDate;
  }

  const getDaysUntilLWD = () => {
    const exitDate = getExitDate(existingRequest);
    if (!exitDate) return 0;
    const diffTime = new Date(exitDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const daysUntilLWD = getDaysUntilLWD();
  
  const allowedWithdrawalStatuses = ['On Notice Period'];
  const canRequestWithdrawal = allowedWithdrawalStatuses.includes(existingRequest?.status) && daysUntilLWD > 7 && !existingRequest?.withdrawalRequestedAt;
  const isWithdrawalClosed = allowedWithdrawalStatuses.includes(existingRequest?.status) && daysUntilLWD <= 7;

  const submitMutation = useMutation({
    mutationFn: (payload) => apiClient.post("/offboarding/initiate", payload),
    onSuccess: () => {
      toast.success("Separation request submitted successfully.")
      queryClient.invalidateQueries(['myOffboarding'])
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || "Failed to submit request.")
    }
  })

  const getDisplayStatus = (status) => {
    if (['Pending HR Approval', 'Pending Country Manager Approval', 'Pending CEO Approval'].includes(status)) {
        return "Approvals In Progress";
    }
    return status;
  }

  const requestWithdrawalMutation = useMutation({
    mutationFn: () => apiClient.patch(`/offboarding/request-withdrawal/${existingRequest?._id}`, { reason: withdrawalReason }),
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully.")
      setShowWithdrawModal(false)
      queryClient.invalidateQueries(['myOffboarding'])
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || "Failed to request withdrawal.")
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.proposedExitDate || !formData.reason.trim()) {
      return toast.error("Please fill out all required fields.")
    }

    const exitDate = new Date(formData.proposedExitDate)
    const today = new Date()
    
    if (exitDate <= today) {
      return toast.error("Proposed Last Working Day must be in the future.")
    }
    submitMutation.mutate({
      proposedExitDate: formData.proposedExitDate,
      reason: formData.reason,
      department: user?.department || "N/A", 
      designation: user?.designation || "N/A", 
      employeeName: `${user?.firstName} ${user?.lastName}`
    })
  }

  if (isChecking) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Initiate Separation</h1>
        <p className="text-muted-foreground">Submit and track your formal resignation request.</p>
      </div>

      {existingRequest ? (
        <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-900/10 dark:border-purple-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <CheckCircle2 className="h-5 w-5" /> Separation Request Active
            </CardTitle>
            <CardDescription>You have already submitted a resignation request. You cannot submit another one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-md border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Working Day</p>
                <p className="font-medium">{getExitDate(existingRequest) ? new Date(getExitDate(existingRequest)).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border",
                  existingRequest.status === "Approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                  existingRequest.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {getDisplayStatus(existingRequest.status)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Submitted Reason</p>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-muted">
                {existingRequest.reason}
              </div>
            </div>
            {existingRequest.status === 'Withdrawal Pending' && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-md text-sm mt-4">
                 <strong>Withdrawal Request Submitted</strong>
                 <p className="mt-1">Your resignation withdrawal request has been submitted successfully and is awaiting HR approval.</p>
              </div>
            )}
            
            {existingRequest.status === 'On Notice Period' && existingRequest.withdrawalRequestedAt && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm mt-4">
                 <strong>Withdrawal Request Rejected</strong>
                 <p className="mt-1">Your resignation withdrawal request has been rejected by HR. Your resignation will continue as per the approved notice period.</p>
                 <div className="mt-3 pt-3 border-t border-red-200 space-y-1">
                    <p className="font-medium">HR Rejection Reason:</p>
                    <p className="mb-2 opacity-90 italic">
                      {existingRequest.rejectionReason || 'HR did not provide a rejection reason.'}
                    </p>
                    <p className="text-xs opacity-80">
                      <strong>Rejected By:</strong> {existingRequest.rejectedByName || existingRequest.actionedByName || 'HR Manager'}
                    </p>
                    {(existingRequest.rejectedAt || existingRequest.actionedAt) && (
                      <p className="text-xs opacity-80">
                        <strong>Rejected On:</strong> {new Date(existingRequest.rejectedAt || existingRequest.actionedAt).toLocaleString()}
                      </p>
                    )}
                 </div>
              </div>
            )}
            
            {canRequestWithdrawal && (
              <div className="flex flex-col items-end pt-4 border-t mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">You have {daysUntilLWD} days remaining to request a withdrawal.</p>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowWithdrawModal(true)}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Withdraw Resignation
                </Button>
              </div>
            )}

            {isWithdrawalClosed && (
              <div className="flex justify-end pt-4 border-t mt-4">
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm border font-medium flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Withdrawal Closed (Exit Clearance in progress)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-100 shadow-sm">
          <CardHeader className="border-b bg-red-50/50 dark:bg-red-900/10 pb-6">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertTriangle className="h-5 w-5" /> Formal Resignation Notice
            </CardTitle>
            <CardDescription className="text-red-900/70 dark:text-red-200/70 pt-2">
              Submitting this form initiates an official offboarding process. This request will be sent to your Direct Manager for acknowledgement, followed by HR clearance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!existingRequest && lastWithdrawnRequest && (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 p-4 rounded-md text-sm flex items-start gap-3 mb-6">
                  <Undo2 className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {lastWithdrawnRequest.status === 'Resignation Withdrawn' ? 'Withdrawal Approved' : `Previous Request Status: ${lastWithdrawnRequest.status}`}
                      </p>
                      <p className="mt-1">
                        {lastWithdrawnRequest.status === 'Resignation Withdrawn' 
                          ? 'Your resignation withdrawal request has been approved by HR. Your resignation has been cancelled and your employment continues.' 
                          : 'Your previous resignation request was finalized or rejected. You may submit a new formal resignation notice below if needed.'}
                      </p>
                  </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> Proposed Last Working Day (LWD) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">Please ensure this date complies with the notice period stated in your employment contract.</p>
                <Input 
                  type="date" 
                  value={formData.proposedExitDate} 
                  onChange={e => setFormData(p => ({...p, proposedExitDate: e.target.value}))} 
                  className="max-w-[250px] [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Reason for Resignation <span className="text-red-500">*</span>
                </label>
                <Textarea 
                  placeholder="Please provide context for your departure..." 
                  className="min-h-[120px]" 
                  value={formData.reason} 
                  onChange={e => setFormData(p => ({...p, reason: e.target.value}))} 
                  required
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  variant="destructive" 
                  disabled={submitMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Submit Formal Resignation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Request Resignation Withdrawal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to request a withdrawal? This will be sent to HR for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                Reason for Withdrawal <span className="text-red-500">*</span>
              </label>
              <Textarea 
                placeholder="Please state why you are withdrawing your resignation (min 5 characters)..." 
                className="min-h-[100px] resize-none" 
                value={withdrawalReason} 
                onChange={e => setWithdrawalReason(e.target.value)} 
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} disabled={requestWithdrawalMutation.isLoading}>
              Cancel
            </Button>
            <Button 
                variant="destructive" 
                onClick={() => {
                  if (withdrawalReason.trim().length < 5) {
                    toast.error("Please provide a valid reason (min 5 characters).");
                    return;
                  }
                  requestWithdrawalMutation.mutate();
                }} 
                disabled={requestWithdrawalMutation.isLoading || withdrawalReason.trim().length < 5}
            >
              {requestWithdrawalMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmployeeResignation