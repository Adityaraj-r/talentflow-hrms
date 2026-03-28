import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Loader2, Search, UserMinus } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/apiClient"
import { cn } from "@/lib/utils"

const OffboardingRequests = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const userRole = user?.role?.toUpperCase() || ""
  const canAction = ["CEO", "COUNTRY_MANAGER", "ADMIN"].includes(userRole)

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
      toast.success(`Offboarding request ${variables.status.toLowerCase()} successfully.`)
      queryClient.invalidateQueries(['offboarding'])
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to update request status.")
    }
  })

  const handleAction = (id, status) => {
    updateMutation.mutate({ id, status })
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-red-500" />
            Employee Offboarding
          </CardTitle>
        </div>
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
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-y">
              <tr>
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">LWD (Proposed)</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium text-center">Status</th>
                {canAction && <th className="p-4 font-medium text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={canAction ? 7 : 6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={canAction ? 7 : 6} className="p-8 text-center text-muted-foreground">
                    No offboarding requests found in the pipeline.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold">{req.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{req.employeeId}</p>
                    </td>
                    <td className="p-4">{req.department}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-medium">
                        {req.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      {new Date(req.proposedExitDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider",
                        req.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        req.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      )}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    
                    {canAction && (
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {req.status !== "Approved" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50 border-green-200"
                              onClick={() => handleAction(req._id, 'Approved')}
                              disabled={updateMutation.isLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {req.status !== "Rejected" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => handleAction(req._id, 'Rejected')}
                              disabled={updateMutation.isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.totalPages}
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

export default OffboardingRequests