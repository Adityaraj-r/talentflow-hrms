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

const Indemnity = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canProcessIndemnity = hasRole(["HR Manager", "HR Officer", "Payroll Officer"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indemnity Management</h1>
        <p className="text-muted-foreground">Manage employee indemnity calculations and payments</p>
      </div>

      <Tabs defaultValue={canProcessIndemnity ? "process" : "history"}>
        <TabsList>
          {canProcessIndemnity && <TabsTrigger value="process">Process Indemnity</TabsTrigger>}
          {canProcessIndemnity && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">Indemnity History</TabsTrigger>
        </TabsList>

        {canProcessIndemnity && (
          <TabsContent value="process">
            <IndemnityForm />
          </TabsContent>
        )}

        {canProcessIndemnity && (
          <TabsContent value="pending">
            <PendingIndemnities />
          </TabsContent>
        )}

        <TabsContent value="history">
          <IndemnityHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const IndemnityForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    yearsOfService: "",
    lastSalary: "",
    indemnityAmount: "",
    reason: "",
    paymentDate: "",
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

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (
      !formData.employeeId ||
      !formData.employeeName ||
      !formData.yearsOfService ||
      !formData.lastSalary ||
      !formData.indemnityAmount ||
      !formData.reason ||
      !formData.paymentDate
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Indemnity request submitted successfully")
      setIsSubmitting(false)

      // Reset form
      setFormData({
        employeeId: "",
        employeeName: "",
        yearsOfService: "",
        lastSalary: "",
        indemnityAmount: "",
        reason: "",
        paymentDate: "",
        notes: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Indemnity</CardTitle>
        <CardDescription>Submit an indemnity calculation and payment request</CardDescription>
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
              <Label htmlFor="yearsOfService">
                Years of Service <span className="text-red-500">*</span>
              </Label>
              <Input
                id="yearsOfService"
                name="yearsOfService"
                type="number"
                placeholder="Enter years of service"
                value={formData.yearsOfService}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastSalary">
                Last Salary <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastSalary"
                name="lastSalary"
                type="number"
                placeholder="Enter last salary"
                value={formData.lastSalary}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indemnityAmount">
                Indemnity Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="indemnityAmount"
                name="indemnityAmount"
                type="number"
                placeholder="Enter indemnity amount"
                value={formData.indemnityAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Indemnity <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
                required
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="resignation">Resignation</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="end-of-contract">End of Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
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
          {isSubmitting ? "Submitting..." : "Submit Indemnity Request"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingIndemnities = () => {
  const pendingIndemnities = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      yearsOfService: 5,
      indemnityAmount: 15000,
      reason: "Resignation",
      paymentDate: "2025-05-01",
      requestedBy: "Jane Smith",
      requestDate: "2025-04-15",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      yearsOfService: 3,
      indemnityAmount: 9000,
      reason: "End of Contract",
      paymentDate: "2025-04-20",
      requestedBy: "Bob Williams",
      requestDate: "2025-04-10",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Indemnity request #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Indemnity request #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Indemnity Approvals</CardTitle>
        <CardDescription>Review and approve indemnity payment requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Years of Service</div>
            <div>Amount</div>
            <div>Reason</div>
            <div>Payment Date</div>
            <div>Requested By</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingIndemnities.map((indemnity) => (
              <div key={indemnity.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{indemnity.employeeName}</div>
                <div>{indemnity.employeeId}</div>
                <div>{indemnity.yearsOfService}</div>
                <div>${indemnity.indemnityAmount.toLocaleString()}</div>
                <div>{indemnity.reason}</div>
                <div>{indemnity.paymentDate}</div>
                <div>{indemnity.requestedBy}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(indemnity.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(indemnity.id)}
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

const IndemnityHistory = () => {
  const indemnityHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      yearsOfService: 5,
      indemnityAmount: 15000,
      reason: "Resignation",
      paymentDate: "2025-03-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-25",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      yearsOfService: 3,
      indemnityAmount: 9000,
      reason: "End of Contract",
      paymentDate: "2025-02-15",
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-10",
      rejectReason: "Insufficient documentation",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Indemnity History</CardTitle>
          <CardDescription>View history of all indemnity payment requests</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search indemnities..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Years of Service</div>
            <div>Amount</div>
            <div>Reason</div>
            <div>Payment Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {indemnityHistory.map((indemnity) => (
              <div key={indemnity.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{indemnity.employeeName}</div>
                <div>{indemnity.employeeId}</div>
                <div>{indemnity.yearsOfService}</div>
                <div>${indemnity.indemnityAmount.toLocaleString()}</div>
                <div>{indemnity.reason}</div>
                <div>{indemnity.paymentDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      indemnity.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : indemnity.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {indemnity.status}
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

export default Indemnity