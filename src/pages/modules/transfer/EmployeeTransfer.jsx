"use client"

import { useState } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { useRole } from "../../../contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Check, X, Search } from "lucide-react"
import { toast } from "sonner"

const EmployeeTransfer = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canInitiateTransfer = hasRole(["HR Manager", "Department Manager", "Project Manager", "Operations Manager"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Transfer</h1>
        <p className="text-muted-foreground">Manage employee transfers between departments or locations</p>
      </div>

      <Tabs defaultValue={canInitiateTransfer ? "create" : "pending"}>
        <TabsList>
          {canInitiateTransfer && <TabsTrigger value="create">Request Transfer</TabsTrigger>}
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        {canInitiateTransfer && (
          <TabsContent value="create">
            <TransferForm />
          </TabsContent>
        )}

        <TabsContent value="pending">
          <PendingTransfers />
        </TabsContent>

        <TabsContent value="history">
          <TransferHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TransferForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    currentDepartment: "",
    newDepartment: "",
    currentLocation: "",
    newLocation: "",
    transferReason: "",
    transferType: "",
    effectiveDate: "",
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

    // Validation
    if (
      !formData.employeeId ||
      !formData.employeeName ||
      !formData.newDepartment ||
      !formData.transferType ||
      !formData.effectiveDate
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Transfer request submitted successfully")
      setIsSubmitting(false)

      // Reset form
      setFormData({
        employeeId: "",
        employeeName: "",
        currentDepartment: "",
        newDepartment: "",
        currentLocation: "",
        newLocation: "",
        transferReason: "",
        transferType: "",
        effectiveDate: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Employee Transfer</CardTitle>
        <CardDescription>Submit a new employee transfer request for approval</CardDescription>
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
              <Label htmlFor="currentDepartment">Current Department</Label>
              <Select
                value={formData.currentDepartment}
                onValueChange={(value) => handleSelectChange("currentDepartment", value)}
              >
                <SelectTrigger id="currentDepartment">
                  <SelectValue placeholder="Select current department" />
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
              <Label htmlFor="newDepartment">
                New Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.newDepartment}
                onValueChange={(value) => handleSelectChange("newDepartment", value)}
                required
              >
                <SelectTrigger id="newDepartment">
                  <SelectValue placeholder="Select new department" />
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
              <Label htmlFor="currentLocation">Current Location</Label>
              <Input
                id="currentLocation"
                name="currentLocation"
                placeholder="Enter current location"
                value={formData.currentLocation}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLocation">New Location</Label>
              <Input
                id="newLocation"
                name="newLocation"
                placeholder="Enter new location"
                value={formData.newLocation}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferType">
                Transfer Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.transferType}
                onValueChange={(value) => handleSelectChange("transferType", value)}
                required
              >
                <SelectTrigger id="transferType">
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departmental">Departmental Transfer</SelectItem>
                  <SelectItem value="location">Location Transfer</SelectItem>
                  <SelectItem value="project">Project-Based Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">
                Effective Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveDate"
                name="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferReason">Reason for Transfer</Label>
            <Textarea
              id="transferReason"
              name="transferReason"
              placeholder="Enter reason for transfer"
              value={formData.transferReason}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Transfer Request"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingTransfers = () => {
  const pendingTransfers = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      currentDepartment: "IT",
      newDepartment: "Operations",
      transferType: "Departmental Transfer",
      effectiveDate: "2025-05-01",
      requestedBy: "Alice Johnson",
      requestDate: "2025-04-15",
    },
    {
      id: 2,
      employeeName: "Jane Smith",
      employeeId: "EMP002",
      currentDepartment: "HR",
      newDepartment: "Finance",
      transferType: "Departmental Transfer",
      effectiveDate: "2025-04-20",
      requestedBy: "Bob Williams",
      requestDate: "2025-04-10",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Transfer request #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Transfer request #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Transfer Approvals</CardTitle>
        <CardDescription>Review and approve employee transfer requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Current Department</div>
            <div>New Department</div>
            <div>Transfer Type</div>
            <div>Effective Date</div>
            <div>Requested By</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingTransfers.map((transfer) => (
              <div key={transfer.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{transfer.employeeName}</div>
                <div>{transfer.employeeId}</div>
                <div>{transfer.currentDepartment}</div>
                <div>{transfer.newDepartment}</div>
                <div>{transfer.transferType}</div>
                <div>{transfer.effectiveDate}</div>
                <div>{transfer.requestedBy}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(transfer.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(transfer.id)}
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

const TransferHistory = () => {
  const transferHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      currentDepartment: "IT",
      newDepartment: "Operations",
      transferType: "Departmental Transfer",
      effectiveDate: "2025-03-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-25",
    },
    {
      id: 2,
      employeeName: "Jane Smith",
      employeeId: "EMP002",
      currentDepartment: "HR",
      newDepartment: "Finance",
      transferType: "Departmental Transfer",
      effectiveDate: "2025-02-15",
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-10",
      reason: "Operational requirements",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>View history of all employee transfer requests</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search transfers..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>From Department</div>
            <div>To Department</div>
            <div>Transfer Type</div>
            <div>Effective Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {transferHistory.map((transfer) => (
              <div key={transfer.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{transfer.employeeName}</div>
                <div>{transfer.employeeId}</div>
                <div>{transfer.currentDepartment}</div>
                <div>{transfer.newDepartment}</div>
                <div>{transfer.transferType}</div>
                <div>{transfer.effectiveDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      transfer.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : transfer.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {transfer.status}
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

export default EmployeeTransfer