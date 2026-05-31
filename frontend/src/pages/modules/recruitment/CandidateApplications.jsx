import { useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { CalendarClock, FileText, Search, UserCheck, Users, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  CandidateAvatar,
  ProgressBar,
  RecruitmentEmptyState,
  RecruitmentKpiCard,
  RecruitmentPageHeader,
  RecruitmentStatusBadge,
  RecruitmentTable,
} from "@/components/recruitment/RecruitmentUI"

const applicationStages = {
  applied: { label: "Applied", progress: 18 },
  shortlisted: { label: "Shortlisted", progress: 42 },
  interview: { label: "Interview", progress: 66 },
  selected: { label: "Selected", progress: 88 },
  rejected: { label: "Rejected", progress: 100 },
}

const normalizeApplicationStage = (status = "") => {
  const normalized = status.toString().trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
  if (normalized.includes("reject")) return "rejected"
  if (normalized.includes("select") || normalized.includes("hire")) return "selected"
  if (normalized.includes("interview")) return "interview"
  if (normalized.includes("shortlist") || normalized.includes("screen")) return "shortlisted"
  return "applied"
}

const getMatchLabel = (score = 0) => {
  const normalized = Math.min(100, Math.max(0, Number(score) || 0))
  if (normalized >= 90) return "Excellent Match"
  if (normalized >= 75) return "Strong Match"
  if (normalized >= 60) return "Moderate Match"
  return "Weak Match"
}

const getRiskClass = (risk = "") => {
  if (risk === "Low Risk") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
  if (risk === "High Risk") return "border-rose-400/30 bg-rose-500/10 text-rose-300"
  return "border-amber-400/30 bg-amber-500/10 text-amber-300"
}

const CandidateApplications = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canFinalApprove = user?.can?.("recruitment", "write") && role === "HR_MANAGER"

  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState("")
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const uploadBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, ""),
    []
  )

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load applications")
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleShortlist = async (id) => {
    try {
      await apiClient.put(`/applications/${id}/status`, { status: "Shortlisted" })
      fetchApplications()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to shortlist")
    }
  }

  const handleSelected = async (id) => {
    try {
      await apiClient.put(`/applications/${id}/status`, { status: "Selected" })
      fetchApplications()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to select")
    }
  }

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/applications/${id}/status`, { status: "Rejected" })
      fetchApplications()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to reject")
    }
  }

  const filteredApplications = useMemo(
    () =>
      applications.filter((app) =>
        `${app.name || ""} ${app.email || ""} ${app.jobId?.jobTitle || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [applications, search]
  )

  const rankedApplications = useMemo(
    () =>
      [...filteredApplications].sort((a, b) => {
        const rankA = Number(a.aiRank) || Number.MAX_SAFE_INTEGER
        const rankB = Number(b.aiRank) || Number.MAX_SAFE_INTEGER
        if (rankA !== rankB) return rankA - rankB
        const scoreDelta = Number(b.aiFitScore || b.matchScore || 0) - Number(a.aiFitScore || a.matchScore || 0)
        if (scoreDelta) return scoreDelta
        const experienceDelta = Number(b.experienceScore || 0) - Number(a.experienceScore || 0)
        if (experienceDelta) return experienceDelta
        return Number(b.skillsScore || 0) - Number(a.skillsScore || 0)
      }),
    [filteredApplications]
  )

  const stats = useMemo(() => {
    const result = { total: applications.length, applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 }
    applications.forEach((app) => {
      result[normalizeApplicationStage(app.status)] += 1
    })
    return result
  }, [applications])

  const percentOfTotal = (count) => stats.total ? Math.round((count / stats.total) * 100) : 0
  const stageCards = [
    {
      title: "Total Applications",
      value: stats.total,
      icon: Users,
      trend: 100,
      helper: `${stats.total} total candidates`,
      accent: "sky",
    },
    {
      title: "New Applications",
      value: stats.applied === 0 ? "All candidates processed" : stats.applied,
      icon: FileText,
      trend: percentOfTotal(stats.applied),
      helper: stats.applied === 0 ? "All applications reviewed" : "Candidates awaiting first review",
      accent: "cyan",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted,
      icon: UserCheck,
      trend: percentOfTotal(stats.shortlisted),
      helper: "Ready for interview planning",
      accent: "violet",
    },
    {
      title: "Interview Scheduled",
      value: stats.interview,
      icon: CalendarClock,
      trend: percentOfTotal(stats.interview),
      helper: stats.interview === 0 ? "No active interviews" : "Candidates in interview workflow",
      accent: "amber",
    },
    {
      title: "Selected",
      value: stats.selected,
      icon: UserCheck,
      trend: percentOfTotal(stats.selected),
      helper: stats.selected === 0 ? "No approved candidates" : "Approved candidates",
      accent: "emerald",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: UserX,
      trend: -percentOfTotal(stats.rejected),
      helper: stats.rejected === 0 ? "No rejected candidates" : "Closed candidate decisions",
      accent: "rose",
    },
  ]

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        title="Candidate Applications"
        subtitle="Review candidate profiles, resumes, and stage decisions from a single ATS workspace."
        summary={`${filteredApplications.length} visible candidates - ${stats.applied} applied - ${stats.shortlisted} shortlisted - ${stats.interview} in interview - ${stats.selected} selected - ${stats.rejected} rejected`}
        actions={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, role, email..."
              className="pl-9"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stageCards.map((card) => (
          <RecruitmentKpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendLabel="of applicants"
            helper={card.helper}
            updated="Live data"
            accent={card.accent}
          />
        ))}
      </div>

      <section className="rounded-lg border border-white/10 bg-card/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Top Recommended Candidates</h2>
          <span className="text-xs text-muted-foreground">Ranked by fit, experience, and skills</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {rankedApplications.slice(0, 3).map((app, index) => {
            const score = Number(app.aiFitScore || app.matchScore || 0)
            return (
              <div key={app._id} className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-cyan-300">#{app.aiRank || index + 1}</span>
                  <span className="text-sm font-semibold">{score}%</span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{app.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{app.aiRecommendationLabel || getMatchLabel(score)} - {app.suggestedNextAction || "Manual Review"}</p>
              </div>
            )
          })}
          {rankedApplications.length === 0 && (
            <p className="text-sm text-muted-foreground">No ranked candidates available.</p>
          )}
        </div>
      </section>

      <RecruitmentTable columns={["Candidate", "Role", "Contact", "Status", "AI Fit", "Progress", "Actions"]}>
        {loading ? (
          <tr>
            <td colSpan={7} className="p-0">
              <div className="p-5 text-sm text-muted-foreground">Loading applications...</div>
            </td>
          </tr>
        ) : filteredApplications.length === 0 ? (
          <tr>
            <td colSpan={7} className="p-5">
              <RecruitmentEmptyState
                title="No applications yet"
                description="Start publishing jobs to receive applications, then shortlist and move qualified candidates through the pipeline."
              />
            </td>
          </tr>
        ) : (
          rankedApplications.map((app, index) => (
            <tr key={app._id} className="transition-colors hover:bg-muted/30 odd:bg-white/[0.02]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <CandidateAvatar name={app.name} />
                  <div>
                    <div className="font-medium text-foreground">{app.name}</div>
                    <div className="text-xs text-muted-foreground">Applicant #{index + 1}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{app.jobId?.jobTitle || "Unassigned"}</td>
              <td className="px-5 py-4 text-muted-foreground">{app.email}</td>
              <td className="px-5 py-4">
                <RecruitmentStatusBadge status={app.status} />
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">#{app.aiRank || index + 1} - {Number(app.aiFitScore || app.matchScore || 0)}%</div>
                  <div className="text-xs text-muted-foreground">{app.aiRecommendationLabel || getMatchLabel(app.aiFitScore || app.matchScore)}</div>
                </div>
              </td>
              <td className="px-5 py-4">
                <ProgressBar value={applicationStages[normalizeApplicationStage(app.status)]?.progress || 18} />
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedApplication(app); setViewOpen(true) }}>
                    View
                  </Button>
                  {canWrite && (
                    <>
                      <Button size="sm" onClick={() => handleShortlist(app._id)} disabled={normalizeApplicationStage(app.status) !== "applied"} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40">
                        Shortlist
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(app._id)} disabled={["selected", "rejected"].includes(normalizeApplicationStage(app.status))} className="disabled:opacity-40">
                        Reject
                      </Button>
                      {canFinalApprove && (
                        <Button size="sm" onClick={() => handleSelected(app._id)} disabled={normalizeApplicationStage(app.status) !== "interview"} className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40">
                          Selected
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </RecruitmentTable>

      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setSelectedApplication(null) }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{selectedApplication?.name || "Candidate"}</span>
              <RecruitmentStatusBadge status={selectedApplication?.status} />
            </DialogTitle>
            <DialogDescription>Candidate details and resume availability.</DialogDescription>
          </DialogHeader>

          {selectedApplication ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium break-words">{selectedApplication.email}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                  <div className="text-xs text-muted-foreground">Position</div>
                  <div className="font-medium">{selectedApplication.jobId?.jobTitle || "N/A"}</div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Why this score?</div>
                    <div className="font-medium">
                      #{selectedApplication.aiRank || "Pending"} - {Number(selectedApplication.aiFitScore || selectedApplication.matchScore || 0)}% {selectedApplication.aiRecommendationLabel || getMatchLabel(selectedApplication.aiFitScore || selectedApplication.matchScore)}
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskClass(selectedApplication.riskLevel)}`}>
                    {selectedApplication.riskLevel || "Medium Risk"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["Skill Match", selectedApplication.skillsScore],
                    ["Experience Match", selectedApplication.experienceScore],
                    ["Education Match", selectedApplication.educationScore],
                    ["Resume Quality", selectedApplication.resumeQualityScore],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{label}</span>
                        <span>{Number(value || 0)}%</span>
                      </div>
                      <ProgressBar value={Number(value || 0)} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strengths</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(selectedApplication.strengths?.length ? selectedApplication.strengths : selectedApplication.matchedSkills || []).slice(0, 8).map((item) => (
                        <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(selectedApplication.missingSkills || []).slice(0, 8).map((item) => (
                        <span key={item} className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">{item}</span>
                      ))}
                      {(!selectedApplication.missingSkills || selectedApplication.missingSkills.length === 0) && (
                        <span className="text-xs text-muted-foreground">No critical gaps detected.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Suggested next action: <span className="font-semibold text-foreground">{selectedApplication.suggestedNextAction || "Manual Review"}</span>
                </div>
              </div>

              {selectedApplication.resume ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-muted/10 p-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Resume</div>
                    <div className="truncate text-sm" title={selectedApplication.resume}>{selectedApplication.resume}</div>
                  </div>
                  <a href={`${uploadBaseUrl}/uploads/${selectedApplication.resume}`} target="_blank" rel="noreferrer">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">Open Resume</Button>
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No resume uploaded for this application.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No candidate selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CandidateApplications
