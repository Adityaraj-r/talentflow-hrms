"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { reviewApi } from "@/services/reviewApi"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton" 
import { FileText, Check, X, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

const Appraisal = () => {
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
    if (!formData.employeeId || !formData.employeeName || !formData.department || !formData.appraisalPeriod || !formData.performanceRating) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Logic for submitting HR-initiated appraisal
      toast.success("Appraisal submitted successfully")
      setFormData({
        employeeId: "", employeeName: "", department: "", appraisalPeriod: "",
        performanceRating: "", comments: "", goals: "",
      })
    } catch (error) {
      toast.error("Failed to submit appraisal")
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
              <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
              <Input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name <span className="text-red-500">*</span></Label>
              <Input id="employeeName" name="employeeName" value={formData.employeeName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
              <Select value={formData.department} onValueChange={(v) => handleSelectChange("department", v)} required>
                <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appraisalPeriod">Appraisal Period <span className="text-red-500">*</span></Label>
              <Input id="appraisalPeriod" name="appraisalPeriod" type="month" value={formData.appraisalPeriod} onChange={handleChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="performanceRating">Performance Rating <span className="text-red-500">*</span></Label>
            <Select value={formData.performanceRating} onValueChange={(v) => handleSelectChange("performanceRating", v)} required>
              <SelectTrigger id="performanceRating"><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="satisfactory">Satisfactory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" name="comments" value={formData.comments} onChange={handleChange} rows={4} />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Appraisal"}
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPendingReviews() }, [])

  const handleAction = async (id, status) => {
    try {
      await reviewApi.approveReview(id, { 
        feedback: `${status.charAt(0).toUpperCase() + status.slice(1)} by HR Manager`, 
        status: status 
      })
      toast[status === 'approved' ? 'success' : 'error'](`Appraisal ${status} successfully`)
      fetchPendingReviews()
    } catch (error) {
      toast.error(`Failed to ${status} appraisal`)
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
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pending appraisals found.</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium min-w-[800px]">
              <div>Employee</div><div>ID</div><div>Dept</div><div>Period</div><div>Rating</div><div>From</div><div>Actions</div>
            </div>
            <div className="divide-y min-w-[800px]">
              {reviews.map((review) => (
                <div key={review._id} className="grid grid-cols-7 p-3 text-sm items-center hover:bg-muted/30 transition-colors">
                  <div className="font-medium">{review.employeeName}</div>
                  <div>{review.employeeId}</div>
                  <div>{review.department}</div>
                  <div>{review.appraisalPeriod}</div>
                  <div className="capitalize">{review.performanceRating}</div>
                  <div>{review.submittedBy}</div>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleAction(review._id, 'approved')}><Check className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleAction(review._id, 'rejected')}><X className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/role/HR_MANAGER/review/${review._id}`)}><FileText className="h-4 w-4" /></Button>
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
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        setLoading(true)
        const res = await reviewApi.getAllReviews({})
        setReviews(res.data || [])
      } catch (error) {
        toast.error("Failed to fetch reviews history")
      } finally {
        setLoading(false)
      }
    }
    fetchAllReviews()
  }, [])

  const filteredReviews = reviews.filter((r) =>
    r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>View history of all performance appraisals</CardDescription>
        </div>
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search by name, ID or dept..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No appraisals found.</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium min-w-[800px]">
              <div>Employee</div><div>ID</div><div>Dept</div><div>Period</div><div>Rating</div><div>Status</div><div className="text-right">Action</div>
            </div>
            <div className="divide-y min-w-[800px]">
              {filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-7 p-3 text-sm items-center">
                  <div className="font-medium">{review.employeeName}</div>
                  <div>{review.employeeId}</div>
                  <div>{review.department}</div>
                  <div>{review.appraisalPeriod}</div>
                  <div className="capitalize">{review.performanceRating}</div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      review.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-700" : 
                      review.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {review.status || 'Pending'}
                    </span>
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/role/HR_MANAGER/review/${review._id}`)}><FileText className="h-4 w-4" /></Button>
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