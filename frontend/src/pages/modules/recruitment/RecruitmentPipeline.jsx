import { useCallback, useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { Download, RotateCcw, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActionIcon } from "@/components/ui/action-icon"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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

  const activeCandidate = useMemo(() => {
    if (!selectedCandidate) return null
    return candidates.find((c) => c._id === selectedCandidate._id) || selectedCandidate
  }, [candidates, selectedCandidate])

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

  const handleExportView = () => {
    const doc = new jsPDF("portrait", "mm", "a4")
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    let hasData = false
    const activeFiltersArr = Object.entries(filters)
      .filter(([key, value]) => key !== "search" && value && value !== "All" && value !== "Unassigned")
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
    
    if (filters.search && filters.search.trim() !== "") {
      activeFiltersArr.unshift(`Search: ${filters.search.trim()}`)
    }
    
    let filterLines = []
    let startY = 38
    if (activeFiltersArr.length > 0) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "italic")
      const filterText = activeFiltersArr.join(" | ")
      filterLines = doc.splitTextToSize(filterText, pageWidth - (margin * 2))
      startY = 35 + (filterLines.length * 5) + 3
    }

    const drawHeaderAndFooter = (pdfDoc) => {
      const totalPages = pdfDoc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdfDoc.setPage(i)
        
        // Draw page border
        pdfDoc.setDrawColor(150, 150, 150)
        pdfDoc.setLineWidth(0.3)
        pdfDoc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10)

        // Title on page 1 only
        if (i === 1) {
          pdfDoc.setFontSize(22)
          pdfDoc.setFont("helvetica", "bold")
          pdfDoc.setTextColor(33, 37, 41)
          pdfDoc.text("Recruitment Pipeline Report", pageWidth / 2, 28, { align: "center" })

          if (filterLines.length > 0) {
            pdfDoc.setFontSize(10)
            pdfDoc.setFont("helvetica", "italic")
            pdfDoc.setTextColor(100, 100, 100)
            pdfDoc.text(filterLines, pageWidth / 2, 35, { align: "center" })
          }
        }

        // Footer on every page
        pdfDoc.setFontSize(8)
        pdfDoc.setTextColor(150, 150, 150)
        pdfDoc.text("Recruitment Pipeline Report", margin, pageHeight - margin + 8)
        
        const footerDate = new Date().toLocaleString()
        pdfDoc.text(footerDate, pageWidth / 2, pageHeight - margin + 8, { align: "center" })
        
        pdfDoc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - margin + 8, { align: "right" })
      }
    }

    PIPELINE_STAGES.forEach((stage, index) => {
      const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id)
      hasData = hasData || stageCandidates.length > 0
      
      let tableData = stageCandidates.map(c => {
        const appId = c.applicationId ? String(c.applicationId) : (c._id ? `APP-${c._id.substring(c._id.length - 4).toUpperCase()}` : "APP-0000")
        const email = c.email || "N/A"
        const phone = c.phone || "N/A"
        const score = `${c.matchScore || c.aiFitScore || 0}%`
        return [appId, c.name || "N/A", email, phone, c.role || "N/A", c.recruiter || "N/A", score]
      })

      if (tableData.length === 0) {
        tableData = [[{ content: "No candidates found in this stage.", colSpan: 7, styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 100, 100] } }]]
      }

      // Prevent awkward page break for stage header. 
      // Need space for navy header (10) + table head (10) + up to 4 rows (40)
      const rowsToCheck = Math.min(tableData.length, 4)
      const requiredSpace = 10 + 10 + (rowsToCheck * 10) + 5
      
      if (startY > pageHeight - margin - requiredSpace) {
         doc.addPage()
         startY = margin + 5
      }

      const currentStartY = startY;

      // Draw Navy Blue Header ONLY ONCE before the table
      doc.setFillColor(26, 61, 100)
      doc.rect(margin, currentStartY, pageWidth - (margin * 2), 8, 'F')
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(`STAGE ${index + 1}: ${stage.label.toUpperCase()} (${stageCandidates.length} Candidates)`, margin + 5, currentStartY + 5.5)

      autoTable(doc, {
        startY: currentStartY + 10,
        head: [['App ID', 'Name', 'Email', 'Phone', 'Position', 'Recruiter', 'AI Score']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 4, 
          valign: 'middle', 
          font: 'helvetica',
          lineColor: [220, 220, 220],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'center' },
          4: { halign: 'left' },
          5: { halign: 'center' },
          6: { halign: 'center' }
        },
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255, 
          fontStyle: 'bold',
          lineColor: [41, 128, 185],
          lineWidth: 0.2
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        margin: { top: margin, bottom: margin + 15, left: margin, right: margin },
        tableWidth: 'auto',
        pageBreak: 'auto',
        showHead: 'everyPage'
      })
      
      startY = doc.lastAutoTable.finalY + 12
    })

    if (!hasData) {
      toast.error("No candidates available to export")
      return
    }

    drawHeaderAndFooter(doc)
    doc.save("Pipeline_Report.pdf")
    toast.success("Pipeline exported to PDF successfully")
  }



  return (
    <div className="space-y-6 max-w-full pb-10">
      <RecruitmentPageHeader
        title="Recruitment Pipeline"
        actions={
          <div className="flex items-center gap-2">
            <ActionIcon icon={RotateCcw} tooltip="Reset Filters" onClick={() => setFilters(defaultFilters)} variant="outline" />
            <ActionIcon icon={SlidersHorizontal} tooltip="Refresh Pipeline" onClick={fetchApplications} variant="outline" />
            <ActionIcon icon={Download} tooltip="Export View" onClick={handleExportView} variant="default" iconClassName="h-4 w-4 text-white" />
          </div>
        }
      />

      <PipelineAnalytics
        candidates={candidates}
        activeStage={filters.stage}
        onSelectStage={(stage) => setFilters((prev) => ({ ...prev, stage }))}
      />

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
        candidate={activeCandidate}
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        uploadBaseUrl={uploadBaseUrl}
        onRefresh={fetchApplications}
      />
    </div>
  )
}

export default RecruitmentPipeline
