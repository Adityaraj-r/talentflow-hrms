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

const StaffRequisition = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canCreateRequisition = hasRole(["CEO", "Country Manager", "HR Manager", "Department Manager"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Requisition</h1>
        <p className="text-muted-foreground">Request and manage staff requisitions</p>
      </div>

      <Tabs defaultValue={canCreateRequisition ? "create" : "pending"}>
        <TabsList>
          {canCreateRequisition && <TabsTrigger value="create">Create Requisition</TabsTrigger>}
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">Requisition History</TabsTrigger>
        </TabsList>

        {canCreateRequisition && (
          <TabsContent value="create">
            <RequisitionForm />
          </TabsContent>
        )}

        <TabsContent value="pending">
          <PendingRequisitions />
        </TabsContent>

        <TabsContent value="history">
          <RequisitionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const RequisitionForm = () => {
  const [formData, setFormData] = useState({
    position: "",
    department: "",
    jobType: "",
    numberOfPositions: 1,
    minSalary: "",
    maxSalary: "",
    jobDescription: "",
    requirements: "",
    reason: "",
    urgency: "normal",
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
    if (!formData.position || !formData.department || !formData.jobType) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Staff requisition submitted successfully")
      setIsSubmitting(false)

      // Reset form
      setFormData({
        position: "",
        department: "",
        jobType: "",
        numberOfPositions: 1,
        minSalary: "",
        maxSalary: "",
        jobDescription: "",
        requirements: "",
        reason: "",
        urgency: "normal",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Staff Requisition</CardTitle>
        <CardDescription>Submit a new staff requisition for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">
                Position Title <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleSelectChange("position", value)}
                required
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software-engineer">Software Engineer</SelectItem>
                  <SelectItem value="project-manager">Project Manager</SelectItem>
                  <SelectItem value="hr-specialist">HR Specialist</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="sales-representative">Sales Representative</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="jobType">
                Job Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.jobType} onValueChange={(value) => handleSelectChange("jobType", value)} required>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPositions">Number of Positions</Label>
              <Input
                id="numberOfPositions"
                name="numberOfPositions"
                type="number"
                min="1"
                value={formData.numberOfPositions}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSalary">Minimum Salary</Label>
              <Input
                id="minSalary"
                name="minSalary"
                type="number"
                placeholder="Enter minimum salary"
                value={formData.minSalary}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSalary">Maximum Salary</Label>
              <Input
                id="maxSalary"
                name="maxSalary"
                type="number"
                placeholder="Enter maximum salary"
                value={formData.maxSalary}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleSelectChange("urgency", value)}>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              placeholder="Enter job description"
              value={formData.jobDescription}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              name="requirements"
              placeholder="Enter job requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Requisition <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.reason} onValueChange={(value) => handleSelectChange("reason", value)} required>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-position">New Position</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
                <SelectItem value="additional-headcount">Additional Headcount</SelectItem>
                <SelectItem value="project-based">Project Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Requisition"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingRequisitions = () => {
  const pendingRequisitions = [
    {
      id: 1,
      position: "Software Engineer",
      department: "IT",
      requestedBy: "John Doe",
      requestDate: "2025-04-01",
      status: "Pending Country Manager Approval",
      urgency: "High",
    },
    {
      id: 2,
      position: "HR Specialist",
      department: "Human Resources",
      requestedBy: "Alice Johnson",
      requestDate: "2025-03-28",
      status: "Pending CEO Approval",
      urgency: "Normal",
    },
    {
      id: 3,
      position: "Accountant",
      department: "Finance",
      requestedBy: "Bob Williams",
      requestDate: "2025-03-25",
      status: "Pending HR Manager Approval",
      urgency: "Low",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Requisition #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Requisition #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requisition Approvals</CardTitle>
        <CardDescription>Review and approve staff requisitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Position</div>
            <div>Department</div>
            <div>Requested By</div>
            <div>Date</div>
            <div>Status</div>
            <div>Urgency</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingRequisitions.map((req) => (
              <div key={req.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{req.position}</div>
                <div>{req.department}</div>
                <div>{req.requestedBy}</div>
                <div>{req.requestDate}</div>
                <div>{req.status}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      req.urgency === "High"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : req.urgency === "Normal"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {req.urgency}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(req.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(req.id)}
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

const RequisitionHistory = () => {
  const requisitionHistory = [
    {
      id: 1,
      position: "Software Engineer",
      department: "IT",
      requestedBy: "John Doe",
      requestDate: "2025-03-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-03-05",
    },
    {
      id: 2,
      position: "HR Specialist",
      department: "Human Resources",
      requestedBy: "Alice Johnson",
      requestDate: "2025-02-15",
      status: "Rejected",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-20",
      reason: "Budget constraints",
    },
    {
      id: 3,
      position: "Accountant",
      department: "Finance",
      requestedBy: "Bob Williams",
      requestDate: "2025-02-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-05",
    },
    {
      id: 4,
      position: "Sales Representative",
      department: "Sales",
      requestedBy: "Charlie Brown",
      requestDate: "2025-01-15",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-01-20",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Requisition History</CardTitle>
          <CardDescription>View history of all staff requisitions</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search requisitions..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Position</div>
            <div>Department</div>
            <div>Requested By</div>
            <div>Request Date</div>
            <div>Status</div>
            <div>Approval Date</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {requisitionHistory.map((req) => (
              <div key={req.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{req.position}</div>
                <div>{req.department}</div>
                <div>{req.requestedBy}</div>
                <div>{req.requestDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : req.status === "Rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div>{req.approvalDate}</div>
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

export default StaffRequisition
