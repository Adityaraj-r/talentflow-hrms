"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { reviewApi } from "@/services/reviewApi"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Check, X, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

const Appraisal = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal (HR Manager)</h1>
        <p className="text-muted-foreground">Manage employee performance reviews and feedback</p>
      </div>

      <Tabs defaultValue="conduct">
        <TabsList>
          <TabsTrigger value="conduct">Conduct Appraisal</TabsTrigger>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="history">All Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="conduct">
          <AppraisalForm />
        </TabsContent>

        <TabsContent value="pending">
          <PendingAppraisals />
        </TabsContent>

        <TabsContent value="history">
          <AllReviews />
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
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

    try {
      // Assuming you have a createReview endpoint in reviewApi
      // await reviewApi.createReview(formData)
      toast.success("Appraisal submitted successfully")
      setFormData({
        employeeId: "",
        employeeName: "",
        department: "",
        appraisalPeriod: "",
        performanceRating: "",
        comments: "",
        goals: "",
      })
    } catch (error) {
      toast.error("Failed to submit appraisal")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conduct Performance Appraisal</CardTitle>
        <CardDescription>Submit a performance review for an employee</CardDescription>
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
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Appraisal"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingAppraisals = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const res = await reviewApi.getPendingReviews()
      setReviews(res.data || [])
    } catch (error) {
      toast.error("Failed to fetch pending reviews")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const handleApprove = async (id) => {
    try {
      await reviewApi.approveReview(id, { feedback: "Approved by HR Manager" })
      toast.success("Appraisal approved successfully")
      fetchPendingReviews() // Refresh list after approval
    } catch (error) {
      toast.error("Failed to approve appraisal")
      console.error(error)
    }
  }

  const handleReject = async (id) => {
    try {
      // Rejection logic—assuming it goes to a reject endpoint or passes negative status
      // You can adapt this payload based on your API's exact rejection requirements
      await reviewApi.approveReview(id, { feedback: "Rejected by HR Manager", status: 'rejected' })
      toast.error("Appraisal rejected")
      fetchPendingReviews() // Refresh list
    } catch (error) {
      toast.error("Failed to reject appraisal")
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Appraisal Reviews</CardTitle>
        <CardDescription>Review and approve performance appraisals</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pending appraisals found.</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium min-w-[800px]">
              <div>Employee</div>
              <div>Employee ID</div>
              <div>Department</div>
              <div>Period</div>
              <div>Rating</div>
              <div>Submitted By</div>
              <div>Actions</div>
            </div>
            <div className="divide-y min-w-[800px]">
              {reviews.map((review) => (
                <div key={review._id} className="grid grid-cols-7 p-3 text-sm items-center">
                  <div className="font-medium">{review.employeeName || 'N/A'}</div>
                  <div>{review.employeeId || 'N/A'}</div>
                  <div>{review.department || 'N/A'}</div>
                  <div>{review.appraisalPeriod || 'N/A'}</div>
                  <div>{review.performanceRating || 'N/A'}</div>
                  <div>{review.submittedBy || 'N/A'}</div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(review._id)}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Approve</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(review._id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => navigate(`/role/hr_manager/review/${review._id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const AllReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        setLoading(true)
        const res = await reviewApi.getAllReviews({})
        setReviews(res.data || [])
      } catch (error) {
        toast.error("Failed to fetch reviews history")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllReviews()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>View history of all performance appraisals</CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search appraisals..." className="pl-8 w-full sm:w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No appraisals found.</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium min-w-[800px]">
              <div>Employee</div>
              <div>Employee ID</div>
              <div>Department</div>
              <div>Period</div>
              <div>Rating</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y min-w-[800px]">
              {reviews.map((review) => (
                <div key={review._id} className="grid grid-cols-7 p-3 text-sm items-center">
                  <div className="font-medium">{review.employeeName || 'N/A'}</div>
                  <div>{review.employeeId || 'N/A'}</div>
                  <div>{review.department || 'N/A'}</div>
                  <div>{review.appraisalPeriod || 'N/A'}</div>
                  <div>{review.performanceRating || 'N/A'}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        review.status === "approved" || review.status === "Approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : review.status === "rejected" || review.status === "Rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {review.status || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => navigate(`/role/hr_manager/review/${review._id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default Appraisal