import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { reviewApi } from "@/services/reviewApi"
import apiClient from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Search, Loader2, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const Appraisal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal</h1>
        <p className="text-muted-foreground">View your performance history and submit self-assessments</p>
      </div>
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Appraisal History</TabsTrigger>
          <TabsTrigger value="self">Self Assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>
        <TabsContent value="self">
          <SelfAssessmentForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AppraisalHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!user?.id) return
    const fetchMyReviews = async () => {
      try {
        setLoading(true)
        const res = await reviewApi.getEmployeeReviews(user.id)
        setReviews(Array.isArray(res) ? res : res?.data ?? [])
      } catch {
        toast.error("Failed to load your review history")
      } finally {
        setLoading(false)
      }
    }
    fetchMyReviews()
  }, [user?.id])

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase()
    if (s === "approved" || s === "completed") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    if (s === "manager review done" || s === "hr reviewed") return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    if (s === "self assessment done") return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
  }

  const filteredReviews = reviews.filter((r) => {
    const cycleName = r.cycleId?.name?.toLowerCase() ?? ""
    const status = r.status?.toLowerCase() ?? ""
    const reviewer = `${r.reviewerId?.firstName ?? ""} ${r.reviewerId?.lastName ?? ""}`.toLowerCase()
    const q = searchQuery.toLowerCase()
    return cycleName.includes(q) || status.includes(q) || reviewer.includes(q)
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Reviews</CardTitle>
          <CardDescription>Historical record of your performance evaluations</CardDescription>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by cycle or status..."
            className="pl-8 w-[220px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Cycle</div>
            <div>Overall Rating</div>
            <div>Reviewer</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-5 p-3 items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-8 ml-auto" />
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No reviews match your search." : "No reviews assigned yet."}
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-5 p-3 text-sm items-center hover:bg-muted/30 transition-colors">
                  <div className="font-medium">{review.cycleId?.name ?? "—"}</div>
                  <div>
                    {review.overallRating > 0
                      ? <span className="font-semibold text-orange-600">{review.overallRating} / 5</span>
                      : <span className="text-muted-foreground">Not rated yet</span>}
                  </div>
                  <div>
                    {review.reviewerId
                      ? `${review.reviewerId.firstName} ${review.reviewerId.lastName}`
                      : "—"}
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
                      onClick={() => navigate(`/role/employee/review/${review._id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SelfAssessmentForm = () => {
  const [cycles, setCycles] = useState([])
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [selfRating, setSelfRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selfComments, setSelfComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingCycles, setLoadingCycles] = useState(true)

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setLoadingCycles(true)
        const res = await apiClient.get("/performance/cycles")
        const all = Array.isArray(res) ? res : res?.data ?? []
        setCycles(all.filter((c) => c.status === "active"))
      } catch {
        toast.error("Failed to load performance cycles")
      } finally {
        setLoadingCycles(false)
      }
    }
    fetchCycles()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCycleId) { toast.error("Please select a cycle"); return }
    if (selfRating < 1) { toast.error("Please select a self-rating"); return }
    try {
      setSubmitting(true)
      await apiClient.post("/performance/self-assessment", {
        cycleId: selectedCycleId,
        selfRating,
        selfComments,
      })
      toast.success("Self assessment submitted successfully!")
      setSelectedCycleId("")
      setSelfRating(0)
      setSelfComments("")
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to submit self assessment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self Assessment</CardTitle>
        <CardDescription>Rate your own performance for the current review cycle</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Review Cycle <span className="text-red-500">*</span></Label>
            {loadingCycles ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                required
              >
                <option value="">— Select active cycle —</option>
                {cycles.length === 0
                  ? <option disabled>No active cycles found</option>
                  : cycles.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Self Rating <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelfRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || selfRating)
                        ? "fill-orange-400 text-orange-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {selfRating > 0 && (
                <span className="ml-2 text-sm font-semibold text-orange-600">{selfRating} / 5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              placeholder="Describe your achievements, challenges, and areas you'd like to grow in..."
              value={selfComments}
              onChange={(e) => setSelfComments(e.target.value)}
              rows={5}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                : "Submit Self Assessment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Appraisal
