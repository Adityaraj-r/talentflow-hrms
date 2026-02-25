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
import { FileText, Check, X, Search } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

const Tickets = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canRequestTickets = hasRole(["HR Manager", "HR Officer", "Payroll Officer"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Travel Ticket Management</h1>
        <p className="text-muted-foreground">Manage employee travel ticket requests</p>
      </div>

      <Tabs defaultValue={canRequestTickets ? "request" : "history"}>
        <TabsList>
          {canRequestTickets && <TabsTrigger value="request">Request Ticket</TabsTrigger>}
          {canRequestTickets && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">Ticket History</TabsTrigger>
        </TabsList>

        {canRequestTickets && (
          <TabsContent value="request">
            <TicketForm />
          </TabsContent>
        )}

        {canRequestTickets && (
          <TabsContent value="pending">
            <PendingTickets />
          </TabsContent>
        )}

        <TabsContent value="history">
          <TicketHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TicketForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    travelPurpose: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    ticketType: "",
    estimatedCost: "",
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
    if (
      !formData.employeeId ||
      !formData.employeeName ||
      !formData.travelPurpose ||
      !formData.destination ||
      !formData.departureDate ||
      !formData.ticketType
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Ticket request submitted successfully")
      setIsSubmitting(false)

      // Reset form
      setFormData({
        employeeId: "",
        employeeName: "",
        travelPurpose: "",
        destination: "",
        departureDate: "",
        returnDate: "",
        ticketType: "",
        estimatedCost: "",
        notes: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Travel Ticket</CardTitle>
        <CardDescription>Submit a new travel ticket request for an employee</CardDescription>
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
              <Label htmlFor="travelPurpose">
                Travel Purpose <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.travelPurpose}
                onValueChange={(value) => handleSelectChange("travelPurpose", value)}
                required
              >
                <SelectTrigger id="travelPurpose">
                  <SelectValue placeholder="Select travel purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Meeting</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="personal">Personal (Company-Sponsored)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">
                Destination <span className="text-red-500">*</span>
              </Label>
              <Input
                id="destination"
                name="destination"
                placeholder="Enter destination"
                value={formData.destination}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departureDate">
                Departure Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="departureDate"
                name="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Return Date</Label>
              <Input
                id="returnDate"
                name="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketType">
                Ticket Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.ticketType}
                onValueChange={(value) => handleSelectChange("ticketType", value)}
                required
              >
                <SelectTrigger id="ticketType">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input
                id="estimatedCost"
                name="estimatedCost"
                type="number"
                placeholder="Enter estimated cost"
                value={formData.estimatedCost}
                onChange={handleChange}
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
          {isSubmitting ? "Submitting..." : "Submit Ticket Request"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingTickets = () => {
  const pendingTickets = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      travelPurpose: "Business Meeting",
      destination: "New York",
      departureDate: "2025-05-01",
      ticketType: "Economy",
      estimatedCost: 500,
      requestedBy: "Jane Smith",
      requestDate: "2025-04-15",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      travelPurpose: "Conference",
      destination: "London",
      departureDate: "2025-04-20",
      ticketType: "Business",
      estimatedCost: 1200,
      requestedBy: "Bob Williams",
      requestDate: "2025-04-10",
    },
  ]

  const handleApprove = (id) => {
    toast.success(`Ticket request #${id} approved successfully`)
  }

  const handleReject = (id) => {
    toast.success(`Ticket request #${id} rejected successfully`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Ticket Approvals</CardTitle>
        <CardDescription>Review and approve travel ticket requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Purpose</div>
            <div>Destination</div>
            <div>Departure</div>
            <div>Ticket Type</div>
            <div>Cost</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {pendingTickets.map((ticket) => (
              <div key={ticket.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{ticket.employeeName}</div>
                <div>{ticket.employeeId}</div>
                <div>{ticket.travelPurpose}</div>
                <div>{ticket.destination}</div>
                <div>{ticket.departureDate}</div>
                <div>{ticket.ticketType}</div>
                <div>${ticket.estimatedCost.toLocaleString()}</div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleApprove(ticket.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleReject(ticket.id)}
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

const TicketHistory = () => {
  const ticketHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      travelPurpose: "Business Meeting",
      destination: "New York",
      departureDate: "2025-03-01",
      ticketType: "Economy",
      estimatedCost: 500,
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-25",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      travelPurpose: "Conference",
      destination: "London",
      departureDate: "2025-02-15",
      ticketType: "Business",
      estimatedCost: 1200,
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-10",
      reason: "Budget constraints",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Ticket History</CardTitle>
          <CardDescription>View history of all travel ticket requests</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search tickets..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Purpose</div>
            <div>Destination</div>
            <div>Departure</div>
            <div>Ticket Type</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {ticketHistory.map((ticket) => (
              <div key={ticket.id} className="grid grid-cols-8 p-3 text-sm">
                <div className="font-medium">{ticket.employeeName}</div>
                <div>{ticket.employeeId}</div>
                <div>{ticket.travelPurpose}</div>
                <div>{ticket.destination}</div>
                <div>{ticket.departureDate}</div>
                <div>{ticket.ticketType}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      ticket.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : ticket.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {ticket.status}
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

export default Tickets