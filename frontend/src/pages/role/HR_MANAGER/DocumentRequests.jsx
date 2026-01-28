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

const DocumentRequests = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canProcessRequest = hasRole(["HR Manager"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Requests (HR Manager)</h1>
        <p className="text-muted-foreground">Manage employee requests for official documents</p>
      </div>

      <Tabs defaultValue={canProcessRequest ? "request" : "history"}>
        <TabsList>
          {canProcessRequest && <TabsTrigger value="request">Process Request</TabsTrigger>}
          {canProcessRequest && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        {canProcessRequest && (
          <TabsContent value="request">
            <RequestForm />
          </TabsContent>
        )}

        {canProcessRequest && (
          <TabsContent value="pending">
            <PendingRequests />
          </TabsContent>
        )}

        <TabsContent value="history">
          <RequestHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const RequestForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    documentType: "",
    requestDate: "",
    purpose: "",
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
      !formData.documentType ||
      !formData.requestDate ||
      !formData.purpose
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      toast.success("Document request submitted successfully")
      setIsSubmitting(false)

      setFormData({
        employeeId: "",
        employeeName: "",
        documentType: "",
        requestDate: "",
        purpose: "",
        notes: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Document Request</CardTitle>
        <CardDescription>Submit a request for an official document</CardDescription>
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
              <Label htmlFor="documentType">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => handleSelectChange("documentType", value)}
                required
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment-certificate">Employment Certificate</SelectItem>
                  <SelectItem value="salary-slip">Salary Slip</SelectItem>
                  <SelectItem value="experience-letter">Experience Letter</SelectItem>
                  <SelectItem value="noc">No Objection Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestDate">
                Request Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requestDate"
                name="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose of Request <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="purpose"
              name="purpose"
              placeholder="Enter the purpose of the document request"
              value={formData.purpose}
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
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingRequests = () => {
  const pendingRequests = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      documentType: "Employment Certificate",
      requestDate: "2025-04-15",
      purpose: "Visa application",
      submittedBy: "Jane Smith",
      submissionDate: "2025-04-15",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      documentType: "Salary Slip",
      requestDate: "2025-04-10",
      purpose: "Bank loan application",
      submittedBy: "Bob Williams",
      submissionDate: "2025-04-10",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Document request #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Document request #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Document Requests</CardTitle>
        <CardDescription>Review and approve document requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Document Type</div>
            <div>Request Date</div>
            <div>Purpose</div>
            <div>Submitted By</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingRequests.map((request) => (
              <div key={request.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{request.employeeName}</div>
                <div>{request.employeeId}</div>
                <div>{request.documentType}</div>
                <div>{request.requestDate}</div>
                <div>{request.purpose}</div>
                <div>{request.submittedBy}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(request.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(request.id)}
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

const RequestHistory = () => {
  const requestHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      documentType: "Employment Certificate",
      requestDate: "2025-03-01",
      purpose: "Visa application",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-03-05",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      documentType: "Salary Slip",
      requestDate: "2025-02-15",
      purpose: "Bank loan application",
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-20",
      reason: "Incomplete request details",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Document Request History</CardTitle>
          <CardDescription>View history of all document requests</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search requests..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Document Type</div>
            <div>Request Date</div>
            <div>Purpose</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {requestHistory.map((request) => (
              <div key={request.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{request.employeeName}</div>
                <div>{request.employeeId}</div>
                <div>{request.documentType}</div>
                <div>{request.requestDate}</div>
                <div>{request.purpose}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      request.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : request.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {request.status}
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

export default DocumentRequests