import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { reviewApi } from "@/services/reviewApi"
import apiClient from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Check, Search, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const Appraisal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal (HR Manager)</h1>
        <p className="text-muted-foreground">Manage employee performance reviews and feedback</p>
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="hr-review">HR Review Queue</TabsTrigger>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingApprovals />
        </TabsContent>
        <TabsContent value="hr-review">
          <HRReviewQueue />
        </TabsContent>
        <TabsContent value="all">
          <AllReviews />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Tab 1: Reviews with status "completed" — HR Manager approves these
const PendingApprovals = () => {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})

  const fetchCompletedReviews = async () => {
    try {
      setLoading(true)
      // Fetch reviews with status=completed — these are ready for HR approval
      const res = await reviewApi.getAllReviews({ status: "completed" })
      setReviews(Array.isArray(res) ? res : res?.data ?? [])
    } catch {
      toast.error("Failed to fetch reviews awaiting approval")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompletedReviews() }, [])

  const handleApprove = async (reviewId) => {
    try {
      setApprovingId(reviewId)
      await reviewApi.approveReview(reviewId, {
        feedback: feedbackMap[reviewId] || "",
      })
      toast.success("Review approved successfully!")
      fetchCompletedReviews()
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to approve review")
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approval</CardTitle>
        <CardDescription>Completed reviews waiting for your approval</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No reviews awaiting approval.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {review.employeeId?.firstName} {review.employeeId?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {review.employeeId?.department} · Cycle: {review.cycleId?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reviewer: {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                    </p>
                    {review.overallRating > 0 && (
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        Overall Rating: {review.overallRating} / 5
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(`/role/hr_manager/review/${review._id}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* HR Feedback + Approve */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Optional HR Manager feedback before approving..."
                    rows={2}
                    className="text-sm"
                    value={feedbackMap[review._id] || ""}
                    onChange={(e) =>
                      setFeedbackMap((prev) => ({ ...prev, [review._id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleApprove(review._id)}
                    disabled={approvingId === review._id}
                  >
                    {approvingId === review._id
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...</>
                      : <><Check className="mr-2 h-4 w-4" /> Approve Review</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Tab 2: Reviews with status "manager review done" — HR submits their review notes
const HRReviewQueue = () => {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})

  const fetchManagerReviewDone = async () => {
    try {
      setLoading(true)
      const res = await reviewApi.getAllReviews({ status: "manager review done" })
      setReviews(Array.isArray(res) ? res : res?.data ?? [])
    } catch {
      toast.error("Failed to fetch HR review queue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchManagerReviewDone() }, [])

  const handleHRReview = async (reviewId) => {
    if (!feedbackMap[reviewId]?.trim()) {
      toast.error("Please add HR feedback before submitting")
      return
    }
    try {
      setSubmittingId(reviewId)
      await apiClient.patch(`performance/hr-review/${reviewId}`, {
        adminFeedback: feedbackMap[reviewId],
      })
      toast.success("HR review submitted successfully!")
      fetchManagerReviewDone()
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to submit HR review")
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>HR Review Queue</CardTitle>
        <CardDescription>Manager-reviewed assessments awaiting your HR validation</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No reviews in HR review queue.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {review.employeeId?.firstName} {review.employeeId?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {review.employeeId?.department} · Cycle: {review.cycleId?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Manager: {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                    </p>
                    {review.overallRating > 0 && (
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        Manager Rating: {review.overallRating} / 5
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/role/hr_manager/review/${review._id}`)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="HR Manager feedback (required)..."
                    rows={2}
                    className="text-sm"
                    value={feedbackMap[review._id] || ""}
                    onChange={(e) =>
                      setFeedbackMap((prev) => ({ ...prev, [review._id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleHRReview(review._id)}
                    disabled={submittingId === review._id}
                  >
                    {submittingId === review._id
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      : <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit HR Review</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Tab 3: All reviews — searchable full list
const AllReviews = () => {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const res = await reviewApi.getAllReviews({})
        setReviews(Array.isArray(res) ? res : res?.data ?? [])
      } catch {
        toast.error("Failed to fetch all reviews")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase()
    if (s === "approved") return "bg-green-100 text-green-700"
    if (s === "completed" || s === "hr reviewed") return "bg-blue-100 text-blue-700"
    if (s === "manager review done") return "bg-purple-100 text-purple-700"
    if (s === "self assessment done") return "bg-indigo-100 text-indigo-700"
    return "bg-yellow-100 text-yellow-700"
  }

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase()
    const name = `${r.employeeId?.firstName ?? ""} ${r.employeeId?.lastName ?? ""}`.toLowerCase()
    const dept = r.employeeId?.department?.toLowerCase() ?? ""
    const cycle = r.cycleId?.name?.toLowerCase() ?? ""
    return name.includes(q) || dept.includes(q) || cycle.includes(q)
  })

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>Complete history of all performance appraisals</CardDescription>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, dept or cycle..."
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
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No reviews match your search." : "No reviews found."}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium min-w-[700px]">
              <div>Employee</div>
              <div>Department</div>
              <div>Cycle</div>
              <div>Rating</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>
            <div className="divide-y min-w-[700px]">
              {filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-6 p-3 text-sm items-center hover:bg-muted/30 transition-colors">
                  <div className="font-medium">
                    {review.employeeId?.firstName} {review.employeeId?.lastName}
                  </div>
                  <div>{review.employeeId?.department ?? "—"}</div>
                  <div>{review.cycleId?.name ?? "—"}</div>
                  <div>
                    {review.overallRating > 0
                      ? <span className="font-semibold text-orange-600">{review.overallRating}/5</span>
                      : <span className="text-muted-foreground">—</span>}
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(review.status)}`}>
                      {review.status
                        ? review.status.charAt(0).toUpperCase() + review.status.slice(1)
                        : "Pending"}
                    </span>
                  </div>
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/role/hr_manager/review/${review._id}`)}
                    >
                      <FileText className="h-4 w-4" />
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
