import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2, Calendar, FileText, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

const EmployeeResignation = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    proposedExitDate: "",
    reason: ""
  })

  const { data: response, isLoading: isChecking } = useQuery({
    queryKey: ['myOffboarding'],
    queryFn: () => apiClient.get('/offboarding/all'),
  })

  const existingRequest = response?.data?.[0]
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Initiate Separation</h1>
        <p className="text-muted-foreground">Submit and track your formal resignation request.</p>
      </div>

      {existingRequest ? (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="h-5 w-5" /> Separation Request Active
            </CardTitle>
            <CardDescription>You have already submitted a resignation request. You cannot submit another one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-md border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Proposed Last Working Day</p>
                <p className="font-medium">{new Date(existingRequest.proposedExitDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border",
                  existingRequest.status === "Approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                  existingRequest.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {existingRequest.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Submitted Reason</p>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-muted">
                {existingRequest.reason}
              </div>
            </div>
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
    </div>
  )
}

export default EmployeeResignation