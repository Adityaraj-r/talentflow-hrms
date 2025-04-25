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
import { FileText, Check, X, Search } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

const Payroll = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canProcessPayroll = hasRole(["HR Manager", "HR Officer", "Payroll Officer"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
        <p className="text-muted-foreground">Process and manage employee payroll</p>
      </div>

      <Tabs defaultValue={canProcessPayroll ? "process" : "history"}>
        <TabsList>
          {canProcessPayroll && <TabsTrigger value="process">Process Payroll</TabsTrigger>}
          {canProcessPayroll && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">Payroll History</TabsTrigger>
        </TabsList>

        {canProcessPayroll && (
          <TabsContent value="process">
            <PayrollForm />
          </TabsContent>
        )}

        {canProcessPayroll && (
          <TabsContent value="pending">
            <PendingPayrolls />
          </TabsContent>
        )}

        <TabsContent value="history">
          <PayrollHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const PayrollForm = () => {
  const [formData, setFormData] = useState({
    payrollPeriod: "",
    department: "",
    totalAmount: "",
    employeeCount: "",
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

    // Validation
    if (!formData.payrollPeriod || !formData.totalAmount || !formData.employeeCount) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Payroll processed successfully")
      setIsSubmitting(false)

      // Reset form
      setFormData({
        payrollPeriod: "",
        department: "",
        totalAmount: "",
        employeeCount: "",
        notes: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Payroll</CardTitle>
        <CardDescription>Initiate a new payroll run for employees</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payrollPeriod">
                Payroll Period <span className="text-red-500">*</span>
              </Label>
              <Input
                id="payrollPeriod"
                name="payrollPeriod"
                type="month"
                value={formData.payrollPeriod}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange("department", value)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">
                Total Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                placeholder="Enter total payroll amount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeCount">
                Employee Count <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeCount"
                name="employeeCount"
                type="number"
                placeholder="Enter number of employees"
                value={formData.employeeCount}
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
          {isSubmitting ? "Processing..." : "Process Payroll"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingPayrolls = () => {
  const pendingPayrolls = [
    {
      id: 1,
      payrollPeriod: "2025-04",
      department: "All Departments",
      totalAmount: 150000,
      employeeCount: 50,
      requestedBy: "Jane Smith",
      requestDate: "2025-04-10",
    },
    {
      id: 2,
      payrollPeriod: "2025-03",
      department: "IT",
      totalAmount: 45000,
      employeeCount: 15,
      requestedBy: "Bob Williams",
      requestDate: "2025-03-28",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Payroll #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Payroll #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Payroll Approvals</CardTitle>
        <CardDescription>Review and approve payroll runs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Payroll Period</div>
            <div>Department</div>
            <div>Total Amount</div>
            <div>Employees</div>
            <div>Requested By</div>
            <div>Request Date</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingPayrolls.map((payroll) => (
              <div key={payroll.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{payroll.payrollPeriod}</div>
                <div>{payroll.department}</div>
                <div>${payroll.totalAmount.toLocaleString()}</div>
                <div>{payroll.employeeCount}</div>
                <div>{payroll.requestedBy}</div>
                <div>{payroll.requestDate}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(payroll.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(payroll.id)}
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

const PayrollHistory = () => {
  const payrollHistory = [
    {
      id: 1,
      payrollPeriod: "2025-02",
      department: "All Departments",
      totalAmount: 145000,
      employeeCount: 48,
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-28",
    },
    {
      id: 2,
      payrollPeriod: "2025-01",
      department: "Finance",
      totalAmount: 30000,
      employeeCount: 10,
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-01-30",
      reason: "Incorrect calculations",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>View history of all payroll runs</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search payrolls..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Payroll Period</div>
            <div>Department</div>
            <div>Total Amount</div>
            <div>Employees</div>
            <div>Status</div>
            <div>Approval Date</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {payrollHistory.map((payroll) => (
              <div key={payroll.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{payroll.payrollPeriod}</div>
                <div>{payroll.department}</div>
                <div>${payroll.totalAmount.toLocaleString()}</div>
                <div>{payroll.employeeCount}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      payroll.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : payroll.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {payroll.status}
                  </span>
                </div>
                <div>{payroll.approvalDate}</div>
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

export default Payroll