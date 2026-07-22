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
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterRole, setFilterRole] = useState("All Roles")
  const [filterAIMatch, setFilterAIMatch] = useState("All")
  const [sortBy, setSortBy] = useState("Newest First")

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

  const jobRoles = useMemo(() => {
    const roles = new Set()
    applications.forEach((app) => {
      if (app.jobId?.jobTitle) {
        roles.add(app.jobId.jobTitle)
      }
    })
    return ["All Roles", ...Array.from(roles)]
  }, [applications])

  const handleResetFilters = () => {
    setSearch("")
    setFilterStatus("All")
    setFilterRole("All Roles")
    setFilterAIMatch("All")
    setSortBy("Newest First")
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = !search ||
        (app.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (app.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (app._id || "").toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (filterStatus !== "All") {
        const normalizedApp = normalizeApplicationStage(app.status)
        const target = filterStatus.toLowerCase()
        if (target === "hired") {
          matchesStatus = normalizedApp === "selected" || app.status.toLowerCase().includes("hire");
        } else {
          matchesStatus = normalizedApp === target || app.status.toLowerCase().includes(target);
        }
      }

      const matchesRole = filterRole === "All Roles" || app.jobId?.jobTitle === filterRole;

      let matchesAI = true;
      if (filterAIMatch !== "All") {
        const score = Number(app.aiFitScore || app.matchScore || 0)
        const label = app.aiRecommendationLabel || getMatchLabel(score)
        
        let calculatedLabel = "Poor Match";
        if (label === "Excellent Match" || label === "Strong Match" || score >= 75) {
          calculatedLabel = "Strong Match";
        } else if (label === "Moderate Match" || (score >= 60 && score < 75)) {
          calculatedLabel = "Good Match";
        } else if (score >= 40 && score < 60) {
          calculatedLabel = "Review Required";
        }

        matchesAI = calculatedLabel === filterAIMatch;
      }

      return matchesSearch && matchesStatus && matchesRole && matchesAI;
    });
  }, [applications, search, filterStatus, filterRole, filterAIMatch])

  const rankedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (sortBy === "Newest First") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "Oldest First") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "Highest AI Match") {
        const scoreA = Number(a.aiFitScore || a.matchScore || 0);
        const scoreB = Number(b.aiFitScore || b.matchScore || 0);
        return scoreB - scoreA;
      }
      if (sortBy === "Candidate Name (A–Z)") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [filteredApplications, sortBy])

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

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-card/85 p-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate..."
            className="w-full text-foreground bg-background"
          />
        </div>
        <div className="w-full sm:w-auto min-w-[140px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Hired">Hired</option>
          </select>
        </div>
        <div className="w-full sm:w-auto min-w-[140px]">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {jobRoles.map((role) => (
              <option key={role} value={role}>
                {role === "All Roles" ? "All Roles" : role}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto min-w-[140px]">
          <select
            value={filterAIMatch}
            onChange={(e) => setFilterAIMatch(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All AI Matches</option>
            <option value="Strong Match">Strong Match</option>
            <option value="Good Match">Good Match</option>
            <option value="Review Required">Review Required</option>
            <option value="Poor Match">Poor Match</option>
          </select>
        </div>
        <div className="w-full sm:w-auto min-w-[140px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Highest AI Match">Highest AI Match</option>
            <option value="Candidate Name (A–Z)">Candidate Name (A–Z)</option>
          </select>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="w-full sm:w-auto border-white/10 bg-background hover:bg-muted"
          >
            Reset Filters
          </Button>
        </div>
      </div>


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
