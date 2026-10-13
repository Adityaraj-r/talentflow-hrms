import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Calendar, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"

const InitiateSeparationModal = ({ isOpen, onClose, preSelectedEmployee = null }) => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    employeeId: "",
    type: "Termination",
    proposedExitDate: "",
    reason: ""
  })

  useEffect(() => {
    if (preSelectedEmployee && isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        employeeId: preSelectedEmployee.employeeCode || preSelectedEmployee._id 
      }))
    }
  }, [preSelectedEmployee, isOpen])

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-list-offboarding'],
    queryFn: () => apiClient.get('/offboarding/eligible-employees'),
    enabled: isOpen && !preSelectedEmployee 
  })

  const employeesList = employeesResponse?.data?.data || employeesResponse?.data || []

  // Centralized Submit Mutation
  const initiateMutation = useMutation({
    mutationFn: (data) => apiClient.post("/offboarding/initiate", data),
    onSuccess: () => {
      toast.success("Separation pipeline initiated successfully.")
      setFormData({ employeeId: "", type: "Termination", proposedExitDate: "", reason: "" })
      queryClient.invalidateQueries(['offboarding'])
      onClose() 
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || "Failed to initiate separation.")
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.employeeId || !formData.proposedExitDate || !formData.reason.trim()) {
      return toast.error("Please fill all required fields.")
    }
    initiateMutation.mutate(formData)
  }

  const handleOpenChange = (open) => {
    if (!open) {
      if (!preSelectedEmployee) {
        setFormData({ employeeId: "", type: "Termination", proposedExitDate: "", reason: "" })
      }
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px] border-red-100 dark:border-red-900 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="h-5 w-5" /> Initiate Employee Offboarding
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-[11px] leading-tight">
            This will push an official offboarding request to HR and Executive leadership for review. System access will remain active until final approval.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 pt-1" style={{ margin: '0' }}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Select Employee <span className="text-red-500">*</span></label>
            {preSelectedEmployee ? (
              <Input 
                className="h-9 bg-muted text-muted-foreground" 
                value={`${preSelectedEmployee.firstName} ${preSelectedEmployee.lastName} (${preSelectedEmployee.employeeCode})`} 
                disabled 
              />
            ) : (
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.employeeId}
                onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                required
              >
                <option value="">-- Select Team Member --</option>
                {employeesList.map(emp => (
                  <option key={emp._id || emp.employeeCode} value={emp.employeeCode || emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.role ? emp.role.replace('_', ' ') : emp.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Separation Type <span className="text-red-500">*</span></label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.type}
              onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
              required
            >
              <option value="Termination">Termination (For Cause)</option>
              <option value="Layoff">Layoff / Redundancy</option>
              <option value="Retirement">Retirement</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Proposed Last Working Day <span className="text-red-500">*</span>
            </label>
            <Input 
              type="date" 
              value={formData.proposedExitDate} 
              onChange={e => setFormData(p => ({...p, proposedExitDate: e.target.value}))} 
              required
              className="h-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-80"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea 
              className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Provide context for the executive team..." 
              value={formData.reason} 
              onChange={e => setFormData(p => ({...p, reason: e.target.value}))} 
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleOpenChange}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={initiateMutation.isLoading}>
              {initiateMutation.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              Submit to Proceed
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InitiateSeparationModal