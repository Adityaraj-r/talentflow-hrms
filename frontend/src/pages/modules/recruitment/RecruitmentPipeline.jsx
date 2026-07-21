import { useCallback, useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { Download, RotateCcw, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecruitmentPageHeader } from "@/components/recruitment/RecruitmentUI"
import {
  AtsRecommendationWidgets,
  CandidateDrawer,
  enrichCandidate,
  normalizePipelineStage,
  PipelineAnalytics,
  PipelineBoard,
  PipelineFilters,
  PipelineInsightsPanel,
  PIPELINE_STAGES,
} from "@/components/recruitment/PipelineKanban"

const defaultFilters = {
  search: "",
  recruiter: "All",
  department: "All",
  role: "All",
  stage: "All",
  experience: "All",
  priority: "All",
}

const getExperienceBucket = (years) => {
  const numeric = Number(years) || 0
  if (numeric <= 2) return "0-2 years"
  if (numeric <= 5) return "3-5 years"
  return "6+ years"
}

const RecruitmentPipeline = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canFinalApprove = user?.can?.("recruitment", "write") && role === "HR_MANAGER"

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(defaultFilters)
  const [savedFilters, setSavedFilters] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const uploadBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api"
    return apiUrl.replace(/\/api\/?$/, "")
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load applications")
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const candidates = useMemo(
    () => {
      const duplicateCounts = applications.reduce((acc, application) => {
        const keys = [
          application.email,
          application.phone,
          application.name,
        ].map((value) => (value || "").toString().trim().toLowerCase()).filter(Boolean)
        keys.forEach((key) => {
          acc[key] = (acc[key] || 0) + 1
        })
        return acc
      }, {})

      return applications.map((application) => {
        const duplicateFlag = [application.email, application.phone, application.name]
          .map((value) => (value || "").toString().trim().toLowerCase())
          .filter(Boolean)
          .some((key) => duplicateCounts[key] > 1)

        return enrichCandidate({
          ...application,
          duplicateFlag,
          stage: normalizePipelineStage(application.status),
        })
      })
    },
    [applications]
  )

  const filterOptions = useMemo(
    () => ({
      recruiters: [...new Set(candidates.map((candidate) => candidate.recruiter).filter(Boolean))],
      departments: [...new Set(candidates.map((candidate) => candidate.department).filter(Boolean))],
      roles: [...new Set(candidates.map((candidate) => candidate.role).filter(Boolean))],
    }),
    [candidates]
  )

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        const searchText = `${candidate.name || ""} ${candidate.email || ""} ${candidate.role || ""} ${candidate.department || ""} ${candidate.skills.join(" ")}`.toLowerCase()
        const matchesSearch = searchText.includes(filters.search.toLowerCase())
        const matchesRecruiter = filters.recruiter === "All" || candidate.recruiter === filters.recruiter
        const matchesDepartment = filters.department === "All" || candidate.department === filters.department
        const matchesRole = filters.role === "All" || candidate.role === filters.role
        const matchesStage = filters.stage === "All" || candidate.stage === filters.stage
        const matchesExperience = filters.experience === "All" || getExperienceBucket(candidate.experienceYears) === filters.experience
        const matchesPriority = filters.priority === "All" || candidate.priority === filters.priority

        return (
          matchesSearch &&
          matchesRecruiter &&
          matchesDepartment &&
          matchesRole &&
          matchesStage &&
          matchesExperience &&
          matchesPriority
        )
      }),
    [candidates, filters]
  )

  const handleMoveCandidate = useCallback(
    async (candidate, targetStage) => {
      const targetConfig = PIPELINE_STAGES.find((stage) => stage.id === targetStage)
      if (!targetConfig) return
      if (targetStage === "selected" && !canFinalApprove) {
        toast.error("Only HR Manager can perform final candidate approval")
        return
      }

      const previousApplications = applications
      setApplications((current) =>
        current.map((application) =>
          application._id === candidate._id
            ? { ...application, status: targetConfig.apiStatus }
            : application
        )
      )

      try {
        await apiClient.put(`/applications/${candidate._id}/status`, { status: targetConfig.apiStatus })
        toast.success(`${candidate.name} moved to ${targetConfig.label}`)
      } catch (error) {
        setApplications(previousApplications)
        toast.error(error?.response?.data?.error || "Could not update candidate stage")
      }
    },
    [applications, canFinalApprove]
  )

  const handleSaveFilter = () => {
    const activeParts = Object.entries(filters)
      .filter(([key, value]) => key !== "search" && value !== "All")
      .map(([, value]) => value)
    const label = filters.search || activeParts.join(" - ") || "Pipeline view"
    setSavedFilters((current) => [{ label, filters }, ...current].slice(0, 4))
    toast.success("Filter saved")
  }

  const activeSummary = useMemo(() => {
    const interviews = filteredCandidates.filter((candidate) => candidate.stage === "Interview").length
    const offers = filteredCandidates.filter((candidate) => candidate.stage === "Offer").length
    const hires = filteredCandidates.filter((candidate) => candidate.stage === "Hired").length
    return `${filteredCandidates.length} candidates - ${interviews} interviews - ${offers} offers - ${hires} hires`
  }, [filteredCandidates])

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        title="Recruitment Pipeline"
        subtitle="A drag-and-drop ATS workflow for screening, interviews, offers, and hiring decisions."
        summary={activeSummary}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setFilters(defaultFilters)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={fetchApplications}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="button">
              <Download className="mr-2 h-4 w-4" />
              Export View
            </Button>
          </>
        }
      />

      <PipelineAnalytics candidates={filteredCandidates} />

      <PipelineFilters
        filters={filters}
        onChange={setFilters}
        options={filterOptions}
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onApplySavedFilter={setFilters}
      />

      <PipelineBoard
        candidates={filteredCandidates}
        onMoveCandidate={handleMoveCandidate}
        onOpenCandidate={setSelectedCandidate}
        canWrite={canWrite}
        loading={loading}
      />

      <CandidateDrawer
        candidate={selectedCandidate}
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        uploadBaseUrl={uploadBaseUrl}
      />
    </div>
  )
}

export default RecruitmentPipeline
