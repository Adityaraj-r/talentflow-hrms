"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Check, X, Search } from "lucide-react"
import { toast } from "sonner"

const DisciplinaryActions = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canRecordAction = hasRole(["HR Manager"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disciplinary Actions (HR Manager)</h1>
        <p className="text-muted-foreground">Manage employee disciplinary actions and records</p>
      </div>

      <Tabs defaultValue={canRecordAction ? "record" : "history"}>
        <TabsList>
          {canRecordAction && <TabsTrigger value="record">Record Action</TabsTrigger>}
          {canRecordAction && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">Action History</TabsTrigger>
        </TabsList>

        {canRecordAction && (
          <TabsContent value="record">
            <ActionForm />
          </TabsContent>
        )}

        {canRecordAction && (
          <TabsContent value="pending">
            <PendingActions />
          </TabsContent>
        )}

        <TabsContent value="history">
          <ActionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const ActionForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    actionType: "",
    incidentDate: "",
    description: "",
    actionDate: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (
      !formData.employeeId ||
      !formData.employeeName ||
      !formData.department ||
      !formData.actionType ||
      !formData.incidentDate ||
      !formData.description ||
      !formData.actionDate
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      toast.success("Disciplinary action recorded successfully")
      setIsSubmitting(false)

      setFormData({
        employeeId: "",
        employeeName: "",
        department: "",
        actionType: "",
        incidentDate: "",
        description: "",
        actionDate: "",
        notes: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Disciplinary Action</CardTitle>
        <CardDescription>Submit a new disciplinary action for an employee</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="Enter employee ID"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeName">
                Employee Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeName"
                name="employeeName"
                placeholder="Enter employee name"
                value={formData.employeeName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange("department", value)}
                required
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionType">
                Action Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) => handleSelectChange("actionType", value)}
                required
              >
                <SelectTrigger id="actionType">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal-warning">Verbal Warning</SelectItem>
                  <SelectItem value="written-warning">Written Warning</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="termination">Termination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDate">
                Incident Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="incidentDate"
                name="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionDate">
                Action Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actionDate"
                name="actionDate"
                type="date"
                value={formData.actionDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Incident Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the incident"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter any additional notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Record Action"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingActions = () => {
  const pendingActions = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      actionType: "Written Warning",
      incidentDate: "2025-04-01",
      submittedBy: "Jane Smith",
      submissionDate: "2025-04-15",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      department: "HR",
      actionType: "Suspension",
      incidentDate: "2025-03-20",
      submittedBy: "Bob Williams",
      submissionDate: "2025-04-10",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Disciplinary action #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Disciplinary action #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Disciplinary Actions</CardTitle>
        <CardDescription>Review and approve disciplinary actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Department</div>
            <div>Action Type</div>
            <div>Incident Date</div>
            <div>Submitted By</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingActions.map((action) => (
              <div key={action.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{action.employeeName}</div>
                <div>{action.employeeId}</div>
                <div>{action.department}</div>
                <div>{action.actionType}</div>
                <div>{action.incidentDate}</div>
                <div>{action.submittedBy}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(action.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(action.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ActionHistory = () => {
  const actionHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      actionType: "Written Warning",
      incidentDate: "2025-02-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-25",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      department: "HR",
      actionType: "Suspension",
      incidentDate: "2025-01-15",
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-10",
      reason: "Insufficient evidence",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Disciplinary Action History</CardTitle>
          <CardDescription>View history of all disciplinary actions</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search actions..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Department</div>
            <div>Action Type</div>
            <div>Incident Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {actionHistory.map((action) => (
              <div key={action.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{action.employeeName}</div>
                <div>{action.employeeId}</div>
                <div>{action.department}</div>
                <div>{action.actionType}</div>
                <div>{action.incidentDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      action.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : action.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {action.status}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="icon">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DisciplinaryActions