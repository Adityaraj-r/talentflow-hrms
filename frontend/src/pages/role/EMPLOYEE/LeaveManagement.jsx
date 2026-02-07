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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Check, X, FileText } from "lucide-react"
import { toast } from "sonner"

const LeaveManagement = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const isManager = hasRole([
    "CEO",
    "Country Manager",
    "HR Manager",
    "HR Officer",
    "Department Manager",
    "Direct Manager",
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">Request and manage employee leave applications</p>
      </div>

      <Tabs defaultValue={isManager ? "pending" : "request"}>
        <TabsList>
          {!isManager && <TabsTrigger value="request">Request Leave</TabsTrigger>}
          <TabsTrigger value="history">Leave History</TabsTrigger>
          {isManager && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          {hasRole(["HR Manager", "HR Officer"]) && <TabsTrigger value="reports">Reports</TabsTrigger>}
        </TabsList>

        {!isManager && (
          <TabsContent value="request">
            <LeaveRequestForm />
          </TabsContent>
        )}

        <TabsContent value="history">
          <LeaveHistory isManager={isManager} />
        </TabsContent>

        {isManager && (
          <TabsContent value="pending">
            <PendingApprovals />
          </TabsContent>
        )}

        {hasRole(["HR Manager", "HR Officer"]) && (
          <TabsContent value="reports">
            <LeaveReports />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const LeaveRequestForm = () => {
  const [date, setDate] = useState({
    from: new Date(),
    to: new Date(),
  })
  const [leaveType, setLeaveType] = useState("")
  const [reason, setReason] = useState("")
  const [advancePayment, setAdvancePayment] = useState("no")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!leaveType) {
      toast.error("Please select a leave type")
      return
    }

    if (!date.from || !date.to) {
      toast.error("Please select both start and end dates")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Leave request submitted successfully")
      setIsSubmitting(false)

      // Reset form
      setLeaveType("")
      setReason("")
      setAdvancePayment("no")
      setDate({
        from: new Date(),
        to: new Date(),
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Leave</CardTitle>
        <CardDescription>Submit a new leave request for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                <SelectItem value="haj">Haj Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="iddah">Iddah Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Leave Period</Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "PPP")} - {format(date.to, "PPP")}
                        </>
                      ) : (
                        format(date.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {leaveType === "annual" && (
            <div className="space-y-2">
              <Label htmlFor="advancePayment">Advance Payment</Label>
              <Select value={advancePayment} onValueChange={setAdvancePayment}>
                <SelectTrigger id="advancePayment">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I need advance payment</SelectItem>
                  <SelectItem value="no">No, I don't need advance payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave</Label>
            <Input
              id="reason"
              placeholder="Enter reason for leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="font-medium mb-2">Leave Balance</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Annual Leave:</div>
              <div>18 days</div>
              <div>Sick Leave:</div>
              <div>15 days</div>
              <div>Haj Leave:</div>
              <div>21 days (unused)</div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const LeaveHistory = ({ isManager }) => {
  const leaveHistory = [
    {
      id: 1,
      employeeName: isManager ? "John Doe" : null,
      leaveType: "Annual Leave",
      startDate: "2025-03-15",
      endDate: "2025-03-25",
      days: 10,
      status: "Approved",
      approvedBy: "Jane Smith",
    },
    {
      id: 2,
      employeeName: isManager ? "Alice Johnson" : null,
      leaveType: "Sick Leave",
      startDate: "2025-02-10",
      endDate: "2025-02-12",
      days: 3,
      status: "Approved",
      approvedBy: "Jane Smith",
    },
    {
      id: 3,
      employeeName: isManager ? "Bob Williams" : null,
      leaveType: "Compassionate Leave",
      startDate: "2025-01-05",
      endDate: "2025-01-08",
      days: 3,
      status: "Rejected",
      approvedBy: "Jane Smith",
      reason: "Insufficient documentation",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave History</CardTitle>
        <CardDescription>
          {isManager ? "View leave history for your team" : "View your leave request history"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            {isManager && <div>Employee</div>}
            <div className={isManager ? "" : "col-span-2"}>Leave Type</div>
            <div className="col-span-2">Period</div>
            <div>Days</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {leaveHistory.map((leave) => (
              <div key={leave.id} className="grid grid-cols-7 p-3 text-sm">
                {isManager && <div>{leave.employeeName}</div>}
                <div className={isManager ? "" : "col-span-2"}>{leave.leaveType}</div>
                <div className="col-span-2">
                  {leave.startDate} to {leave.endDate}
                </div>
                <div>{leave.days}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${leave.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : leave.status === "Rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                  >
                    {leave.status}
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

const PendingApprovals = () => {
  const pendingLeaves = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      leaveType: "Annual Leave",
      startDate: "2025-04-15",
      endDate: "2025-04-25",
      days: 10,
      reason: "Family vacation",
      requestDate: "2025-04-01",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP005",
      leaveType: "Sick Leave",
      startDate: "2025-04-10",
      endDate: "2025-04-12",
      days: 3,
      reason: "Medical appointment",
      requestDate: "2025-04-08",
    },
    {
      id: 3,
      employeeName: "Bob Williams",
      employeeId: "EMP010",
      leaveType: "Compassionate Leave",
      startDate: "2025-04-05",
      endDate: "2025-04-08",
      days: 3,
      reason: "Family emergency",
      requestDate: "2025-04-04",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Leave request #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Leave request #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Leave Approvals</CardTitle>
        <CardDescription>Review and approve leave requests from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Leave Type</div>
            <div className="col-span-2">Period</div>
            <div>Days</div>
            <div>Reason</div>
            <div>Requested</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{leave.employeeName}</div>
                <div>{leave.leaveType}</div>
                <div className="col-span-2">
                  {leave.startDate} to {leave.endDate}
                </div>
                <div>{leave.days}</div>
                <div>{leave.reason}</div>
                <div>{leave.requestDate}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(leave.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(leave.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
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

const LeaveReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Reports</CardTitle>
        <CardDescription>Generate and view leave reports across the organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Leave by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">Department Chart</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Leave by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">Leave Type Chart</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">Monthly Trend Chart</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Leave Balance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Annual Leave</div>
                <div className="text-2xl font-bold">1,245</div>
                <div className="text-xs text-muted-foreground">Total days available</div>
              </div>
              <div className="bg-background p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Sick Leave</div>
                <div className="text-2xl font-bold">875</div>
                <div className="text-xs text-muted-foreground">Total days available</div>
              </div>
              <div className="bg-background p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Used Leave</div>
                <div className="text-2xl font-bold">632</div>
                <div className="text-xs text-muted-foreground">Total days used</div>
              </div>
              <div className="bg-background p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Pending Approvals</div>
                <div className="text-2xl font-bold">28</div>
                <div className="text-xs text-muted-foreground">Awaiting approval</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>Generate Report</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LeaveManagement