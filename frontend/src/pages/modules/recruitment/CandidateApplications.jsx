import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { CalendarClock, FileText, Search, UserCheck, Users, UserX, Eye, CheckCircle, XCircle, ChevronDown, ArrowUpRight } from "lucide-react"
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
  RecruitmentPageHeader,
  RecruitmentStatusBadge,
  RecruitmentTable,
} from "@/components/recruitment/RecruitmentUI"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import { ActionIcon } from "@/components/ui/action-icon"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

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
  if (normalized.includes("select") || normalized.includes("hire") || normalized.includes("offer") || normalized.includes("join") || normalized.includes("accept")) return "selected"
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

const getOfferStatusLabel = (app) => {
  if (app.offerStatus) return app.offerStatus;
  if (app.offer?.status) return app.offer?.status;
  const statusLower = (app.status || "").toLowerCase();
  if (statusLower.includes("reject")) return "N/A";
  if (statusLower.includes("offer") || statusLower.includes("hire") || statusLower.includes("join")) {
    return app.status;
  }
  if (statusLower.includes("select")) return "Draft";
  return "Not Started";
}

const CandidateApplications = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canFinalApprove = user?.can?.("recruitment", "write") && role === "HR_MANAGER"

  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filters for Section 1 - New Applicants
  const [searchNew, setSearchNew] = useState("")
  const [filterRoleNew, setFilterRoleNew] = useState("All Roles")
  const [filterHiringRoleNew, setFilterHiringRoleNew] = useState("All Hiring Roles")
  const [filterDeptNew, setFilterDeptNew] = useState("All Departments")
  const [filterStatusNew, setFilterStatusNew] = useState("All")
  const [filterAIMatchNew, setFilterAIMatchNew] = useState("All")
  const [filterAppliedDateNew, setFilterAppliedDateNew] = useState("")
  const [sortByNew, setSortByNew] = useState("Newest First")

  // Filters for Section 2 - Completed Applications
  const [searchCompleted, setSearchCompleted] = useState("")
  const [filterStatusCompleted, setFilterStatusCompleted] = useState("All")
  const [filterRoleCompleted, setFilterRoleCompleted] = useState("All Roles")
  const [filterHiringRoleCompleted, setFilterHiringRoleCompleted] = useState("All Hiring Roles")
  const [filterDeptCompleted, setFilterDeptCompleted] = useState("All Departments")
  const [filterDecisionDateCompleted, setFilterDecisionDateCompleted] = useState("")
  const [filterOfferStatusCompleted, setFilterOfferStatusCompleted] = useState("All")
  const [sortByCompleted, setSortByCompleted] = useState("Newest First")

  const uploadBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, ""),
    []
  )

  const getResumeUrl = (resumePath) => {
    if (!resumePath) return ""
    if (resumePath.startsWith("http://") || resumePath.startsWith("https://")) return resumePath
    const filename = resumePath.replace(/^\/?(uploads\/)?/, "")
    return `${uploadBaseUrl}/uploads/${filename}`
  }

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

  const hiringRolesList = useMemo(() => {
    const roles = new Set()
    applications.forEach((app) => {
      if (app.hiringRoleName) {
        roles.add(app.hiringRoleName)
      }
    })
    return ["All Hiring Roles", ...Array.from(roles)]
  }, [applications])

  const departments = useMemo(() => {
    const depts = new Set()
    applications.forEach((app) => {
      if (app.jobId?.department) {
        depts.add(app.jobId.department)
      }
    })
    return ["All Departments", ...Array.from(depts)]
  }, [applications])

  const handleResetFiltersNew = () => {
    setSearchNew("")
    setFilterRoleNew("All Roles")
    setFilterHiringRoleNew("All Hiring Roles")
    setFilterDeptNew("All Departments")
    setFilterStatusNew("All")
    setFilterAIMatchNew("All")
    setFilterAppliedDateNew("")
    setSortByNew("Newest First")
  }

  const handleResetFiltersCompleted = () => {
    setSearchCompleted("")
    setFilterStatusCompleted("All")
    setFilterRoleCompleted("All Roles")
    setFilterHiringRoleCompleted("All Hiring Roles")
    setFilterDeptCompleted("All Departments")
    setFilterDecisionDateCompleted("")
    setFilterOfferStatusCompleted("All")
    setSortByCompleted("Newest First")
  }

  const isCompleted = (app) => {
    const statusLower = (app.status || "").toLowerCase()
    return (
      statusLower.includes("select") ||
      statusLower.includes("reject") ||
      statusLower.includes("offer") ||
      statusLower.includes("hire") ||
      statusLower.includes("join")
    )
  }

  const newApplicants = useMemo(() => {
    return applications.filter((app) => !isCompleted(app))
  }, [applications])

  const completedApplications = useMemo(() => {
    return applications.filter((app) => isCompleted(app))
  }, [applications])

  // New Applicants filtering and sorting
  const filteredNew = useMemo(() => {
    return newApplicants.filter((app) => {
      const matchesSearch = !searchNew ||
        (app.name || "").toLowerCase().includes(searchNew.toLowerCase()) ||
        (app.email || "").toLowerCase().includes(searchNew.toLowerCase()) ||
        (app._id || "").toLowerCase().includes(searchNew.toLowerCase())

      let matchesStatus = true
      if (filterStatusNew !== "All") {
        const normalizedApp = normalizeApplicationStage(app.status)
        const target = filterStatusNew.toLowerCase()
        matchesStatus = normalizedApp === target || app.status.toLowerCase().includes(target)
      }

      const matchesRole = filterRoleNew === "All Roles" || app.jobId?.jobTitle === filterRoleNew
      const matchesHiringRole = filterHiringRoleNew === "All Hiring Roles" || app.hiringRoleName === filterHiringRoleNew
      const matchesDept = filterDeptNew === "All Departments" || app.jobId?.department === filterDeptNew

      let matchesAI = true
      if (filterAIMatchNew !== "All") {
        const score = Number(app.aiFitScore || app.matchScore || 0)
        const label = app.aiRecommendationLabel || getMatchLabel(score)
        
        let calculatedLabel = "Poor Match"
        if (label === "Excellent Match" || label === "Strong Match" || score >= 75) {
          calculatedLabel = "Strong Match"
        } else if (label === "Moderate Match" || (score >= 60 && score < 75)) {
          calculatedLabel = "Good Match"
        } else if (score >= 40 && score < 60) {
          calculatedLabel = "Review Required"
        }

        matchesAI = calculatedLabel === filterAIMatchNew
      }

      const matchesAppliedDate = !filterAppliedDateNew || new Date(app.createdAt).toISOString().startsWith(filterAppliedDateNew)

      return matchesSearch && matchesStatus && matchesRole && matchesHiringRole && matchesDept && matchesAI && matchesAppliedDate
    })
  }, [newApplicants, searchNew, filterStatusNew, filterRoleNew, filterHiringRoleNew, filterDeptNew, filterAIMatchNew, filterAppliedDateNew])

  const rankedNew = useMemo(() => {
    return [...filteredNew].sort((a, b) => {
      if (sortByNew === "Newest First") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
      if (sortByNew === "Oldest First") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      }
      if (sortByNew === "Highest AI Match") {
        const scoreA = Number(a.aiFitScore || a.matchScore || 0)
        const scoreB = Number(b.aiFitScore || b.matchScore || 0)
        return scoreB - scoreA
      }
      if (sortByNew === "Candidate Name (A–Z)") {
        return (a.name || "").localeCompare(b.name || "")
      }
      return 0
    })
  }, [filteredNew, sortByNew])

  // Completed Applications filtering and sorting
  const filteredCompleted = useMemo(() => {
    return completedApplications.filter((app) => {
      const matchesSearch = !searchCompleted ||
        (app.name || "").toLowerCase().includes(searchCompleted.toLowerCase()) ||
        (app.email || "").toLowerCase().includes(searchCompleted.toLowerCase()) ||
        (app._id || "").toLowerCase().includes(searchCompleted.toLowerCase())

      let matchesStatus = true
      if (filterStatusCompleted !== "All") {
        const normalizedApp = normalizeApplicationStage(app.status)
        const target = filterStatusCompleted.toLowerCase()
        matchesStatus = normalizedApp === target || app.status.toLowerCase().includes(target)
      }

      const matchesRole = filterRoleCompleted === "All Roles" || app.jobId?.jobTitle === filterRoleCompleted
      const matchesHiringRole = filterHiringRoleCompleted === "All Hiring Roles" || app.hiringRoleName === filterHiringRoleCompleted
      const matchesDept = filterDeptCompleted === "All Departments" || app.jobId?.department === filterDeptCompleted

      const matchesDecisionDate = !filterDecisionDateCompleted || new Date(app.updatedAt).toISOString().startsWith(filterDecisionDateCompleted)

      let matchesOfferStatus = true
      if (filterOfferStatusCompleted !== "All") {
        const statusStr = (app.offerStatus || app.offer?.status || "").toLowerCase()
        matchesOfferStatus = statusStr.includes(filterOfferStatusCompleted.toLowerCase())
      }

      return matchesSearch && matchesStatus && matchesRole && matchesHiringRole && matchesDept && matchesDecisionDate && matchesOfferStatus
    })
  }, [completedApplications, searchCompleted, filterStatusCompleted, filterRoleCompleted, filterHiringRoleCompleted, filterDeptCompleted, filterDecisionDateCompleted, filterOfferStatusCompleted])

  const rankedCompleted = useMemo(() => {
    return [...filteredCompleted].sort((a, b) => {
      if (sortByCompleted === "Newest First") {
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      }
      if (sortByCompleted === "Oldest First") {
        return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0)
      }
      if (sortByCompleted === "Highest AI Match") {
        const scoreA = Number(a.aiFitScore || a.matchScore || 0)
        const scoreB = Number(b.aiFitScore || b.matchScore || 0)
        return scoreB - scoreA
      }
      if (sortByCompleted === "Candidate Name (A–Z)") {
        return (a.name || "").localeCompare(b.name || "")
      }
      return 0
    })
  }, [filteredCompleted, sortByCompleted])

  const newColumns = useMemo(() => [
    {
      id: "serial",
      header: "S.No.",
      cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    },
    {
      accessorKey: "candidate",
      header: "Candidate",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center gap-3">
            <CandidateAvatar name={app.name} />
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{app.name}</div>
              <div className="text-xs text-muted-foreground truncate">{app.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "jobId",
      header: "Job ID",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <span className="font-mono text-xs font-semibold text-primary whitespace-nowrap">
            {app.jobId?.jobCode || (app.jobId?._id ? `JOB-${app.jobId._id.slice(-4)}` : "N/A")}
          </span>
        );
      }
    },
    {
      accessorKey: "appliedPosition",
      header: "Applied Position",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground">{app.jobId?.jobTitle || app.hiringRoleName || 'Unassigned'}</span>;
      }
    },
    {
      accessorKey: "experience",
      header: "Experience",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground">{app.yearsOfExperience || 0} yrs</span>;
      }
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="whitespace-nowrap">
            {app.source === "Employee Referral" ? (
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  Employee Referral
                </span>
                {app.referredByEmployeeId && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]" title={`Referred by ${app.referredByEmployeeId.name}`}>
                    By: {app.referredByEmployeeId.name}
                  </div>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Career Portal
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "matchScore",
      header: "Match Score",
      cell: ({ row }) => {
        const app = row.original;
        const score = Number(app.aiFitScore || app.matchScore || 0);
        return (
          <span className={`font-semibold text-slate-700 dark:text-slate-300`}>
            {score}%
          </span>
        );
      }
    },
    {
      accessorKey: "appliedDate",
      header: "Applied Date",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground whitespace-nowrap">{new Date(app.createdAt).toLocaleDateString()}</span>;
      }
    },
    {
      accessorKey: "hiringStage",
      header: "Hiring Stage",
      cell: ({ row }) => {
        const app = row.original;
        return <RecruitmentStatusBadge status={app.status} />;
      }
    },
    {
      accessorKey: "resume",
      header: "Resume PDF",
      cell: ({ row }) => {
        const app = row.original;
        return app.resume ? (
          <a href={getResumeUrl(app.resume)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
            <Eye className="h-3.5 w-3.5" /> View
          </a>
        ) : <span className="text-xs text-muted-foreground">N/A</span>;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionIcon icon={Eye} tooltip="Quick View" onClick={() => { setSelectedApplication(app); setViewOpen(true) }} className="text-purple-500 hover:text-primary hover:bg-purple-500/10" />
            {canWrite && (
              <>
                <ActionIcon icon={CheckCircle2} tooltip="Shortlist" onClick={() => handleShortlist(app._id)} disabled={normalizeApplicationStage(app.status) !== 'applied'} className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" />
                <ActionIcon icon={XCircle} tooltip="Reject" onClick={() => handleReject(app._id)} disabled={['selected','rejected'].includes(normalizeApplicationStage(app.status))} className="text-slate-500 hover:text-rose-600 hover:bg-rose-50" />
              </>
            )}
          </div>
        );
      }
    }
  ], [canWrite, setSelectedApplication, setViewOpen, handleShortlist, handleReject]);

  const completedColumns = useMemo(() => [
    {
      id: "serial",
      header: "S.No.",
      cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    },
    {
      accessorKey: "candidate",
      header: "Candidate",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center gap-3">
            <CandidateAvatar name={app.name} />
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{app.name}</div>
              <div className="text-xs text-muted-foreground truncate">{app.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "jobId",
      header: "Job ID",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <span className="font-mono text-xs font-semibold text-primary whitespace-nowrap">
            {app.jobId?.jobCode || (app.jobId?._id ? `JOB-${app.jobId._id.slice(-4)}` : "N/A")}
          </span>
        );
      }
    },
    {
      accessorKey: "appliedPosition",
      header: "Applied Position",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground">{app.jobId?.jobTitle || app.hiringRoleName || 'Unassigned'}</span>;
      }
    },
    {
      accessorKey: "experience",
      header: "Experience",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground">{app.yearsOfExperience || 0} yrs</span>;
      }
    },
    {
      accessorKey: "matchScore",
      header: "Match Score",
      cell: ({ row }) => {
        const app = row.original;
        const score = Number(app.aiFitScore || app.matchScore || 0);
        return (
          <span className={`font-semibold text-slate-700 dark:text-slate-300`}>
            {score}%
          </span>
        );
      }
    },
    {
      accessorKey: "decisionDate",
      header: "Decision Date",
      cell: ({ row }) => {
        const app = row.original;
        return <span className="text-muted-foreground whitespace-nowrap">{new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</span>;
      }
    },
    {
      accessorKey: "finalStatus",
      header: "Final Status",
      cell: ({ row }) => {
        const app = row.original;
        return <RecruitmentStatusBadge status={app.status} />;
      }
    },
    {
      accessorKey: "resume",
      header: "Resume PDF",
      cell: ({ row }) => {
        const app = row.original;
        return app.resume ? (
          <a href={getResumeUrl(app.resume)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
            <Eye className="h-3.5 w-3.5" /> View
          </a>
        ) : <span className="text-xs text-muted-foreground">N/A</span>;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionIcon icon={Eye} tooltip="Quick View" onClick={() => { setSelectedApplication(app); setViewOpen(true) }} className="text-purple-500 hover:text-primary hover:bg-purple-500/10" />
            {!(app.status || "").toLowerCase().includes("reject") && (
              <Link to="/dashboard/offer-management" title="Offer Management" onClick={(e) => e.stopPropagation()}>
                <ActionIcon icon={FileText} tooltip="Offer Management" className="text-purple-500 hover:text-primary hover:bg-purple-500/10" />
              </Link>
            )}
          </div>
        );
      }
    }
  ], [setSelectedApplication, setViewOpen]);

  const stats = useMemo(() => {
    const result = { total: applications.length, applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 }
    applications.forEach((app) => {
      result[normalizeApplicationStage(app.status)] += 1
    })
    return result
  }, [applications])

  const [activeKpiFilter, setActiveKpiFilter] = useState("all")

  const handleKpiCardClick = (stageKey) => {
    setActiveKpiFilter(stageKey)
    if (stageKey === "all") {
      setFilterStatusNew("All")
      setFilterStatusCompleted("All")
    } else if (stageKey === "selected" || stageKey === "rejected") {
      setFilterStatusCompleted(stageKey === "selected" ? "Selected" : "Rejected")
    } else {
      setFilterStatusNew(stageKey === "applied" ? "Applied" : stageKey === "shortlisted" ? "Shortlisted" : "Interview")
    }
  }

  const percentOfTotal = (count) => stats.total ? Math.round((count / stats.total) * 100) : 0
  const stageCards = [
    {
      stageKey: "all",
      title: "Total Applications",
      value: stats.total,
      icon: Users,
      trend: 100,
      helper: `${stats.total} total candidates`,
      accent: "blue",
    },
    {
      stageKey: "applied",
      title: "New Applications",
      value: stats.applied,
      icon: FileText,
      trend: percentOfTotal(stats.applied),
      helper: stats.applied === 0 ? "All applications reviewed" : "Candidates awaiting first review",
      accent: "purple",
    },
    {
      stageKey: "shortlisted",
      title: "Shortlisted",
      value: stats.shortlisted,
      icon: UserCheck,
      trend: percentOfTotal(stats.shortlisted),
      helper: "Ready for interview planning",
      accent: "purple",
    },
    {
      stageKey: "interview",
      title: "Interview Scheduled",
      value: stats.interview,
      icon: CalendarClock,
      trend: percentOfTotal(stats.interview),
      helper: stats.interview === 0 ? "No active interviews" : "Candidates in interview workflow",
      accent: "amber",
    },
    {
      stageKey: "selected",
      title: "Selected",
      value: stats.selected,
      icon: UserCheck,
      trend: percentOfTotal(stats.selected),
      helper: stats.selected === 0 ? "No approved candidates" : "Approved candidates",
      accent: "emerald",
    },
    {
      stageKey: "rejected",
      title: "Rejected",
      value: stats.rejected,
      icon: UserCheck,
      trend: -percentOfTotal(stats.rejected),
      helper: stats.rejected === 0 ? "No rejected candidates" : "Closed candidate decisions",
      accent: "rose",
    },
  ]

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        title="Candidate Applications"
      />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stageCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            variant={card.accent}
            isActive={activeKpiFilter === card.stageKey}
            onClick={() => handleKpiCardClick(card.stageKey)}
          />
        ))}
      </div>

      {/* SECTION 1 — NEW APPLICANTS */}
      <div className="space-y-4">
        

        {/* NEW APPLICANTS FILTER BAR */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchNew}
                onChange={(e) => setSearchNew(e.target.value)}
                placeholder="Search candidate..."
                className="pl-9 h-9 w-full"
              />
            </div>
            <FilterSelect label="Role" value={filterRoleNew} onChange={setFilterRoleNew} options={jobRoles} />
            <FilterSelect label="Hiring Role" value={filterHiringRoleNew} onChange={setFilterHiringRoleNew} options={hiringRolesList} />
            <FilterSelect label="Department" value={filterDeptNew} onChange={setFilterDeptNew} options={departments} />
            <FilterSelect label="Stage" value={filterStatusNew} onChange={setFilterStatusNew} options={["All Stages", "Applied", "Shortlisted", "Interview"]} />
            <FilterSelect label="AI Match" value={filterAIMatchNew} onChange={setFilterAIMatchNew} options={["All AI Matches", "Strong Match", "Good Match", "Review Required", "Poor Match"]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              type="date"
              value={filterAppliedDateNew}
              onChange={(e) => setFilterAppliedDateNew(e.target.value)}
              className="h-9 w-full text-foreground bg-background px-3 text-sm"
            />
            <FilterSelect label="Sort By" value={sortByNew} onChange={setSortByNew} options={["Newest First", "Oldest First", "Highest AI Match", "Candidate Name (A–Z)"]} />
            <Button
              variant="outline"
              onClick={handleResetFiltersNew}
              className="h-9 w-full border-input bg-background hover:bg-muted"
            >
              Reset Filter
            </Button>
          </div>
        </div>

        {/* NEW APPLICANTS TABLE */}
        <div className="rounded-lg border border-border bg-card/80 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-5 text-center text-sm text-muted-foreground">Loading applications...</div>
          ) : filteredNew.length === 0 ? (
            <div className="p-5">
              <RecruitmentEmptyState title="No active applications" description="No new or active candidates match the filters." />
            </div>
          ) : (
            <DataTable 
              columns={newColumns} 
              data={rankedNew} 
              searchable={false} 
              defaultPageSize={10} 
              onRowClick={(app) => navigate(`/dashboard/applications/${app._id}`)} 
            />
          )}
        </div>
      </div>

      {/* SECTION 2 — COMPLETED APPLICATIONS */}
      <div className="space-y-4 pt-4">
        

        {/* COMPLETED APPLICATIONS FILTER BAR */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchCompleted}
                onChange={(e) => setSearchCompleted(e.target.value)}
                placeholder="Search candidate..."
                className="pl-9 h-9 w-full"
              />
            </div>
            <FilterSelect label="Role" value={filterRoleCompleted} onChange={setFilterRoleCompleted} options={jobRoles} />
            <FilterSelect label="Hiring Role" value={filterHiringRoleCompleted} onChange={setFilterHiringRoleCompleted} options={hiringRolesList} />
            <FilterSelect label="Department" value={filterDeptCompleted} onChange={setFilterDeptCompleted} options={departments} />
            <FilterSelect label="Stage" value={filterStatusCompleted} onChange={setFilterStatusCompleted} options={["All Statuses", "Selected", "Rejected"]} />
            <FilterSelect label="Offer Status" value={filterOfferStatusCompleted} onChange={setFilterOfferStatusCompleted} options={["All Offer Statuses", "Draft", "Sent", "Accepted", "Rejected"]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              type="date"
              value={filterDecisionDateCompleted}
              onChange={(e) => setFilterDecisionDateCompleted(e.target.value)}
              className="h-9 w-full text-foreground bg-background px-3 text-sm"
            />
            <FilterSelect label="Sort By" value={sortByCompleted} onChange={setSortByCompleted} options={["Newest First", "Oldest First", "Highest AI Match", "Candidate Name (A–Z)"]} />
            <Button
              variant="outline"
              onClick={handleResetFiltersCompleted}
              className="h-9 w-full border-input bg-background hover:bg-muted"
            >
              Reset Filter
            </Button>
          </div>
        </div>

        {/* COMPLETED APPLICATIONS TABLE */}
        <div className="rounded-lg border border-border bg-card/80 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-5 text-center text-sm text-muted-foreground">Loading applications...</div>
          ) : filteredCompleted.length === 0 ? (
            <div className="p-5">
              <RecruitmentEmptyState title="No completed applications" description="No candidates reached a final decision yet." />
            </div>
          ) : (
            <DataTable 
              columns={completedColumns} 
              data={rankedCompleted} 
              searchable={false} 
              defaultPageSize={10} 
              onRowClick={(app) => navigate(`/dashboard/applications/${app._id}`)} 
            />
          )}
        </div>
      </div>

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
                  <div className="font-medium">{selectedApplication.selectedPositionTitle || selectedApplication.hiringRoleName || selectedApplication.jobId?.jobTitle || "N/A"}</div>
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
                  <a href={getResumeUrl(selectedApplication.resume)} target="_blank" rel="noreferrer">
                    <Button className="bg-purple-600 text-white hover:bg-purple-700">Open Resume</Button>
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

function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <div className="relative block w-full">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={options[0]} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

