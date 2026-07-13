import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { reviewApi } from "@/services/reviewApi"
import apiClient from "@/services/apiClient"
import { performanceApi } from "@/services/performanceApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Search, Loader2, Star, Target } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  displayPersonName,
  formatDateDDMMMYYYY,
  formatWorkflowStageLabel,
} from "@/lib/pmsDisplay"

function unwrap(res) {
  if (res == null) return null
  if (Array.isArray(res)) return res
  if (typeof res === "object" && res.data !== undefined) return res.data
  return res
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
}

/** Shared cycle + review-for-cycle state, used by both "My goals" and "Self-assessment" tabs. */
function useMyReviewForCycle() {
  const [cycles, setCycles] = useState([])
  const [loadingCycles, setLoadingCycles] = useState(true)
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [myReview, setMyReview] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setLoadingCycles(true)
        const res = await apiClient.get("/performance/cycles")
        const inner = unwrap(res)
        const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : []
        setCycles(list.filter((c) => c.status === "active"))
      } catch (e) {
        toast.error(e?.error || e?.message || "Failed to load performance cycles")
      } finally {
        setLoadingCycles(false)
      }
    }
    fetchCycles()
  }, [])

  const refetchReview = async () => {
    if (!selectedCycleId) {
      setMyReview(null)
      return
    }
    try {
      setLoadingReview(true)
      const res = await apiClient.get(`/performance/my-review/${selectedCycleId}`)
      setMyReview(unwrap(res))
    } catch (e) {
      setMyReview(null)
      toast.error(e?.error || e?.message || "No review assigned for this cycle yet.")
    } finally {
      setLoadingReview(false)
    }
  }

  useEffect(() => {
    refetchReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycleId])

  return {
    cycles,
    loadingCycles,
    selectedCycleId,
    setSelectedCycleId,
    myReview,
    loadingReview,
    refetchReview,
  }
}

const Appraisal = () => {
  const shared = useMyReviewForCycle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal</h1>
        <p className="text-muted-foreground">
          Goals, self-assessment, and your appraisal history (live data).
        </p>
      </div>
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="goals">My goals</TabsTrigger>
          <TabsTrigger value="self">Self-assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsTab shared={shared} />
        </TabsContent>
        <TabsContent value="self">
          <SelfAssessmentForm shared={shared} />
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
        const raw = unwrap(res)
        setReviews(Array.isArray(raw) ? raw : [])
      } catch (e) {
        toast.error(e?.error || e?.message || "Failed to load your review history")
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    fetchMyReviews()
  }, [user?.id])

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase()
    if (s === "approved" || s === "completed" || s === "feedback_released") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
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
          <CardTitle>My reviews</CardTitle>
          <CardDescription>Assigned cycles, reviewer, and workflow stage</CardDescription>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by cycle, status, reviewer…"
            className="pl-8 w-[240px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Cycle</div>
            <div>Rating</div>
            <div>Reviewer</div>
            <div>Status</div>
          </div>
          <div className="divide-y">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-5 items-center gap-4 p-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="ml-auto h-8 w-8" />
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                {searchQuery ? "No reviews match your search." : "No reviews assigned yet."}
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-5 items-center p-3 text-sm transition-colors hover:bg-muted/30">
                  <div className="font-medium">{review.cycleId?.name ?? "—"}</div>
                  <div>
                    {review.overallRating > 0 ? (
                      <span className="font-semibold text-orange-600">{review.overallRating} / 5</span>
                    ) : (
                      <span className="text-muted-foreground">Not rated yet</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {displayPersonName(review.reviewerId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {review.reviewerId?.designation ?? ""}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(review.status)}`}>
                      {formatWorkflowStageLabel(review.status)}
                    </span>
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

const CycleSelect = ({ cycles, loadingCycles, selectedCycleId, setSelectedCycleId }) => (
  <div className="space-y-2">
    <Label>
      Review cycle <span className="text-red-500">*</span>
    </Label>
    {loadingCycles ? (
      <Skeleton className="h-10 w-full" />
    ) : (
      <select
        value={selectedCycleId}
        onChange={(e) => setSelectedCycleId(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="">— Select active cycle —</option>
        {cycles.length === 0 ? (
          <option disabled>No active cycles found</option>
        ) : (
          cycles.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))
        )}
      </select>
    )}
  </div>
)

const GoalsTab = ({ shared }) => {
  const {
    cycles,
    loadingCycles,
    selectedCycleId,
    setSelectedCycleId,
    myReview,
    loadingReview,
    refetchReview,
  } = shared

  const [goals, setGoals] = useState([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [confirmingGoals, setConfirmingGoals] = useState(false)

  const loadGoals = async () => {
    try {
      setLoadingGoals(true)
      const res = await performanceApi.getMyGoals()
      const raw = unwrap(res)
      setGoals(Array.isArray(raw) ? raw : [])
    } catch (e) {
      toast.error(e?.error || e?.message || "Could not load goals")
      setGoals([])
    } finally {
      setLoadingGoals(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [])

  const statusNorm = normalizeStatus(myReview?.status)
  const canConfirmGoals = myReview && statusNorm === "goals_pending"

  const handleConfirmGoals = async () => {
    if (!myReview?._id) return
    try {
      setConfirmingGoals(true)
      await reviewApi.confirmGoals(myReview._id)
      toast.success("Goals confirmed. You can now submit your self-assessment.")
      await refetchReview()
    } catch (error) {
      toast.error(error?.error || error?.message || "Could not confirm goals")
    } finally {
      setConfirmingGoals(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          My goals
        </CardTitle>
        <CardDescription>
          Goals created by HR or your manager for appraisal cycles. Confirm goals below once they're finalized for a cycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CycleSelect
          cycles={cycles}
          loadingCycles={loadingCycles}
          selectedCycleId={selectedCycleId}
          setSelectedCycleId={setSelectedCycleId}
        />

        {selectedCycleId && loadingReview && <Skeleton className="h-20 w-full" />}

        {selectedCycleId && myReview && !loadingReview && (
          <div className="space-y-3 rounded-lg border border-muted p-4 text-sm">
            <div>
              <span className="font-medium">Workflow: </span>
              {formatWorkflowStageLabel(myReview.status)}
            </div>
            {canConfirmGoals ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground">
                  Confirm your goals when they are finalized for this cycle.
                </p>
                <Button type="button" variant="secondary" size="sm" disabled={confirmingGoals} onClick={handleConfirmGoals}>
                  {confirmingGoals ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm goals"}
                </Button>
              </div>
            ) : (
              <p className="text-green-700 dark:text-green-400">Goals already confirmed for this cycle.</p>
            )}
          </div>
        )}

        <div>
          {loadingGoals ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No goals yet. Your manager or HR will create goals for the active cycle.
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g._id} className="rounded-lg border p-4 text-sm">
                  <p className="font-semibold">{g.title}</p>
                  {g.description ? <p className="mt-1 text-muted-foreground">{g.description}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Status: {g.status ?? "—"}</span>
                    <span>Weight: {g.weight ?? "—"}%</span>
                    <span>Progress: {g.progress ?? 0}%</span>
                    <span>Cycle: {g.cycleId?.name ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const SelfAssessmentForm = ({ shared }) => {
  const {
    cycles,
    loadingCycles,
    selectedCycleId,
    setSelectedCycleId,
    myReview,
    loadingReview,
  } = shared

  const [selfRating, setSelfRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selfComments, setSelfComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const statusNorm = normalizeStatus(myReview?.status)
  const canSubmitSelf = myReview && statusNorm === "goals_locked"
  const goalsNotConfirmedYet = myReview && statusNorm === "goals_pending"
  const selfDone =
    !!myReview &&
    (statusNorm === "self_assessment_done" ||
      String(myReview.status || "").toLowerCase().includes("self assessment"))

  const feedbackReleased =
    myReview &&
    (normalizeStatus(myReview.status) === "feedback_released" ||
      String(myReview.status || "").toLowerCase().includes("feedback"))

  const competencies = useMemo(() => {
    if (!myReview?.competencies || !Array.isArray(myReview.competencies)) return []
    return myReview.competencies
  }, [myReview])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCycleId) {
      toast.error("Please select a cycle")
      return
    }
    if (!canSubmitSelf) {
      toast.error("Confirm your goals first in the \"My goals\" tab.")
      return
    }
    if (selfRating < 1) {
      toast.error("Please select a self-rating")
      return
    }
    try {
      setSubmitting(true)
      await apiClient.post("/performance/self-assessment", {
        cycleId: selectedCycleId,
        selfRating,
        selfComments,
      })
      toast.success("Self assessment submitted successfully!")
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
        <CardTitle>Self-assessment</CardTitle>
        <CardDescription>
          Confirm your goals in the "My goals" tab first, then submit your self-assessment here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CycleSelect
            cycles={cycles}
            loadingCycles={loadingCycles}
            selectedCycleId={selectedCycleId}
            setSelectedCycleId={setSelectedCycleId}
          />

          {selectedCycleId && loadingReview && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {myReview && !loadingReview && (
            <div className="space-y-4 rounded-lg border border-muted p-4 text-sm">
              <div>
                <span className="font-medium">Reviewer: </span>
                {displayPersonName(myReview.reviewerId)}
                {myReview.reviewerId?.designation ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {myReview.reviewerId.designation}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="font-medium">Workflow: </span>
                {formatWorkflowStageLabel(myReview.status)}
              </div>
              {goalsNotConfirmedYet && (
                <p className="text-muted-foreground">
                  Confirm your goals in the "My goals" tab before submitting your self-assessment.
                </p>
              )}
              {selfDone && !feedbackReleased && (
                <p className="font-medium text-green-700 dark:text-green-400">
                  Self-assessment submitted for this cycle.
                </p>
              )}
            </div>
          )}

          {competencies.length > 0 && myReview && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <Label className="text-base">Competency template</Label>
              <p className="text-xs text-muted-foreground">
                Your manager will score these dimensions; use overall rating & comments below for your self-view.
              </p>
              <ul className="space-y-2">
                {competencies.map((c, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">(manager rates 1–5)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedbackReleased && myReview && (
            <div className="space-y-3 rounded-lg border border-green-500/40 bg-green-500/5 p-4 text-sm">
              <p className="font-semibold text-green-800 dark:text-green-300">Your feedback is available</p>
              {myReview.managerComments ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Manager</p>
                  <p className="whitespace-pre-wrap">{myReview.managerComments}</p>
                </div>
              ) : null}
              {myReview.strengths ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Strengths</p>
                  <p>{myReview.strengths}</p>
                </div>
              ) : null}
              {myReview.areasForImprovement ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Development areas</p>
                  <p>{myReview.areasForImprovement}</p>
                </div>
              ) : null}
              {myReview.adminFeedback ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">HR</p>
                  <p className="whitespace-pre-wrap">{myReview.adminFeedback}</p>
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Overall self rating <span className="text-red-500">*</span>
            </Label>
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
                    className={`h-8 w-8 transition-colors ${star <= (hoveredRating || selfRating)
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
              placeholder="Achievements, challenges, and growth areas…"
              value={selfComments}
              onChange={(e) => setSelfComments(e.target.value)}
              rows={5}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !canSubmitSelf || selfDone}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit self-assessment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Appraisal