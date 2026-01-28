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
import { FileText, Search } from "lucide-react"
import { toast } from "sonner"

const Appraisal = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal (Department Manager)</h1>
        <p className="text-muted-foreground">Conduct performance reviews for your team</p>
      </div>

      <Tabs defaultValue="conduct">
        <TabsList>
          <TabsTrigger value="conduct">Conduct Appraisal</TabsTrigger>
          <TabsTrigger value="history">Appraisal History</TabsTrigger>
        </TabsList>

        <TabsContent value="conduct">
          <AppraisalForm />
        </TabsContent>

        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AppraisalForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    appraisalPeriod: "",
    performanceRating: "",
    comments: "",
    goals: "",
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
      !formData.appraisalPeriod ||
      !formData.performanceRating
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      toast.success("Appraisal submitted successfully")
      setIsSubmitting(false)
      setFormData({
        employeeId: "",
        employeeName: "",
        department: "",
        appraisalPeriod: "",
        performanceRating: "",
        comments: "",
        goals: "",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conduct Performance Appraisal</CardTitle>
        <CardDescription>Submit a performance review for an employee in your department</CardDescription>
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
              <Label htmlFor="appraisalPeriod">
                Appraisal Period <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appraisalPeriod"
                name="appraisalPeriod"
                type="month"
                value={formData.appraisalPeriod}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceRating">
                Performance Rating <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.performanceRating}
                onValueChange={(value) => handleSelectChange("performanceRating", value)}
                required
              >
                <SelectTrigger id="performanceRating">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                  <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              name="comments"
              placeholder="Enter performance comments"
              value={formData.comments}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Future Goals</Label>
            <Textarea
              id="goals"
              name="goals"
              placeholder="Enter goals for next period"
              value={formData.goals}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Appraisal"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const AppraisalHistory = () => {
  const appraisalHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      appraisalPeriod: "2025-02",
      performanceRating: "Good",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-03-01",
    },
    {
      id: 2,
      employeeName: "Alice Johnson",
      employeeId: "EMP002",
      department: "HR",
      appraisalPeriod: "2025-01",
      performanceRating: "Satisfactory",
      status: "Rejected",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-15",
      reason: "Incomplete feedback",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>View history of performance appraisals for your department</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search appraisals..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Department</div>
            <div>Period</div>
            <div>Rating</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {appraisalHistory.map((appraisal) => (
              <div key={appraisal.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{appraisal.employeeName}</div>
                <div>{appraisal.employeeId}</div>
                <div>{appraisal.department}</div>
                <div>{appraisal.appraisalPeriod}</div>
                <div>{appraisal.performanceRating}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      appraisal.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : appraisal.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {appraisal.status}
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

export default Appraisal