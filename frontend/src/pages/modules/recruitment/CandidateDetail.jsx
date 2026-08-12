import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Eye,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Plus,
  Bookmark,
  Award,
  Link as LinkIcon,
  ShieldCheck,
  Send,
  MessageSquare
} from "lucide-react"
import { RecruitmentStatusBadge } from "@/components/recruitment/RecruitmentUI"
import { PriorityDot } from "@/components/ui/PriorityDot"

const bgvCategories = [
  { key: "address", label: "Address Verification" },
  { key: "identity", label: "Identity & ID Verification" },
  { key: "education", label: "Highest Education Check" },
  { key: "employment", label: "Employment History Reference Check" },
  { key: "criminal", label: "Criminal Record Check" },
]

const CandidateDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = ["HR_OFFICER", "HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canFinalApprove = user?.can?.("recruitment", "write") && ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview") // overview, resume, tasks

  // Interactive Actions state
  const [stageLoading, setStageLoading] = useState(false)
  const [feedbackFormData, setFeedbackFormData] = useState({ round: 'Technical', rating: 5, feedback: '', recommendation: 'Borderline' })
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Interview schedule state
  const [interviewForm, setInterviewForm] = useState({ interviewDate: '', startTime: '', endTime: '', mode: 'Online', meetingLink: '', location: '', interviewerName: '', interviewerId: '', instructions: '' })
  const [interviewLoading, setInterviewLoading] = useState(false)

  // BGV checks state
  const [bgvChecks, setBgvChecks] = useState({ identity: 'Pending', education: 'Pending', employment: 'Pending', criminal: 'Pending' })
  const [bgvNotes, setBgvNotes] = useState('')
  const [bgvLoading, setBgvLoading] = useState(false)

  // Offer Package state
  const [offer, setOffer] = useState(null)
  const [offerForm, setOfferForm] = useState({ salary: '', joiningDate: '', expiryDate: '', position: '', department: '', bonus: '' })
  const [offerSaveLoading, setOfferSaveLoading] = useState(false)
  const [isEditingOfferPackage, setIsEditingOfferPackage] = useState(false)
  
  const [workflowStatus, setWorkflowStatus] = useState(null)

  const uploadBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, ""),
    []
  )

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get(`/applications/${id}`)
      const record = data?.data?.data || data?.data || data
      setApp(record)
      
      if (record.backgroundVerification) {
        setBgvChecks({
          identity: record.backgroundVerification.checks?.identity || 'Pending',
          education: record.backgroundVerification.checks?.education || 'Pending',
          employment: record.backgroundVerification.checks?.employment || 'Pending',
          criminal: record.backgroundVerification.checks?.criminal || 'Pending',
        })
        setBgvNotes(record.backgroundVerification.notes || '')
      }

      const wfData = await apiClient.get(`/applications/${id}/workflow-status`)
      if (wfData.data) setWorkflowStatus(wfData.data)

      try {
        const offerRes = await apiClient.get('/offers')
        const offerList = offerRes?.data ?? offerRes ?? []
        const found = Array.isArray(offerList) ? offerList.find(o => 
          (record._id && (o.candidateId?._id === record._id || o.candidateId === record._id)) ||
          (record.email && o.candidateEmail?.toLowerCase() === record.email.toLowerCase())
        ) : null
        if (found) {
          setOffer(found)
          setOfferForm({
            salary: found.salary || '',
            joiningDate: found.joiningDate || '',
            expiryDate: found.expiryDate ? new Date(found.expiryDate).toISOString().split('T')[0] : '',
            position: found.position || record.selectedPositionTitle || record.jobId?.jobTitle || '',
            department: found.department || record.jobId?.department || '',
            bonus: found.bonus || ''
          })
        } else {
          setOfferForm({
            salary: '',
            joiningDate: '',
            expiryDate: '',
            position: record.selectedPositionTitle || record.hiringRoleName || record.jobId?.jobTitle || '',
            department: record.jobId?.department || '',
            bonus: ''
          })
        }
      } catch (err) {
        console.error("Offer fetch error:", err)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load candidate details")
      navigate("/dashboard/applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCandidateDetails()
    }
  }, [id])

  const handleUpdateStatus = async (newStatus) => {
    try {
      setStageLoading(true)
      await apiClient.put(`/applications/${id}/status`, { status: newStatus })
      toast.success(`Hiring stage updated to: ${newStatus}`)
      fetchCandidateDetails()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update status")
    } finally {
      setStageLoading(false)
    }
  }

  const handleRecordFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackFormData.round || !feedbackFormData.feedback.trim()) {
      toast.error("Please add evaluation notes and round")
      return
    }
    try {
      setFeedbackLoading(true)
      await apiClient.post(`/applications/${id}/evaluate`, {
        round: feedbackFormData.round,
        rating: Number(feedbackFormData.rating),
        feedback: feedbackFormData.feedback,
        recommendation: feedbackFormData.recommendation
      })
      toast.success("Evaluation notes recorded successfully!")
      setFeedbackFormData({ round: 'Technical', rating: 5, feedback: '', recommendation: 'Borderline' })
      fetchCandidateDetails()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback")
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    if (!interviewForm.interviewDate || !interviewForm.startTime || !interviewForm.endTime) {
      toast.error("Please fill all required interview fields")
      return
    }
    try {
      setInterviewLoading(true)
      await apiClient.post(`/applications/${id}/schedule-interview`, {
        interviewDate: interviewForm.interviewDate,
        startTime: interviewForm.startTime,
        endTime: interviewForm.endTime,
        mode: interviewForm.mode,
        meetingLink: interviewForm.mode === 'Online' ? interviewForm.meetingLink : '',
        location: interviewForm.mode === 'Offline' ? interviewForm.location : '',
        interviewers: interviewForm.interviewerName ? [{ name: interviewForm.interviewerName, id: interviewForm.interviewerId || '' }] : [],
        instructions: interviewForm.instructions ? interviewForm.instructions.split(',').map(s => s.trim()).filter(Boolean) : []
      })
      toast.success("Interview scheduled successfully!")
      setInterviewForm({ interviewDate: '', startTime: '', endTime: '', mode: 'Online', meetingLink: '', location: '', interviewerName: '', interviewerId: '', instructions: '' })
      fetchCandidateDetails()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to schedule interview")
    } finally {
      setInterviewLoading(false)
    }
  }

  const handleUpdateBGV = async (e) => {
    e.preventDefault()
    try {
      setBgvLoading(true)
      await apiClient.put(`/applications/${id}/bgv`, { checks: bgvChecks, notes: bgvNotes })
      toast.success("Background Verification details updated!")
      fetchCandidateDetails()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update BGV status")
    } finally {
      setBgvLoading(false)
    }
  }

  const handleSaveOfferPackage = async (e) => {
    e.preventDefault()
    if (!offerForm.salary || !offerForm.joiningDate) {
      toast.error("Salary package amount and joining date are required")
      return
    }
    try {
      setOfferSaveLoading(true)
      if (offer?._id) {
        const res = await apiClient.put(`/offers/${offer._id}`, {
          salary: Number(offerForm.salary),
          joiningDate: offerForm.joiningDate,
          expiryDate: offerForm.expiryDate || undefined,
          position: offerForm.position || app.selectedPositionTitle || app.jobId?.jobTitle,
          department: offerForm.department || app.jobId?.department,
          bonus: Number(offerForm.bonus || 0)
        })
        toast.success("Offer package updated successfully!")
        const updated = res?.data?.data || res?.data
        if (updated && updated._id) setOffer(updated)
        setIsEditingOfferPackage(false)
      } else {
        const res = await apiClient.post('/offers', {
          candidateId: app._id,
          candidateEmail: app.email,
          candidateName: app.name,
          salary: Number(offerForm.salary),
          joiningDate: offerForm.joiningDate,
          expiryDate: offerForm.expiryDate || undefined,
          position: offerForm.position || app.selectedPositionTitle || app.jobId?.jobTitle,
          department: offerForm.department || app.jobId?.department,
          bonus: Number(offerForm.bonus || 0)
        })
        toast.success("Offer package generated successfully!")
        const created = res?.data?.data || res?.data
        if (created && created._id) setOffer(created)
        setIsEditingOfferPackage(false)
      }
      fetchCandidateDetails()
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Failed to save offer package")
    } finally {
      setOfferSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-800 dark:border-t-cyan-400"></div>
        <p className="text-sm font-semibold text-slate-500">Loading candidate profile...</p>
      </div>
    )
  }

  if (!app) return null

  const fileUrl = app.resume
    ? (app.resume.startsWith("http://") || app.resume.startsWith("https://") 
        ? app.resume 
        : `${uploadBaseUrl}/uploads/${app.resume.replace(/^\/?(uploads\/)?/, "")}`)
    : ""

  return (
    <div className="space-y-6 max-w-full pb-10">
      {/* Header Workspace */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/80 dark:border-white/10 p-5 rounded-xl">
        <div className="space-y-1.5">
          <button
            onClick={() => navigate("/dashboard/applications")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Candidate list
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">{app.name}</h1>
            <RecruitmentStatusBadge status={app.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{app.jobId?.jobTitle || "Unassigned Position"} • Match score: <span className="font-bold text-cyan-600 dark:text-cyan-400">{app.aiFitScore || app.matchScore || 0}% Match</span></p>
        </div>

        {/* Change Stage dropdown action */}
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs font-semibold text-slate-500">Update Hiring Stage:</Label>
            <select
              value={app.status}
              disabled={stageLoading}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview Scheduling</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>
      
      {workflowStatus?.hasWorkflow && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Workflow Progress Tracker
            </h2>
            <div className="text-sm font-semibold">
              Current Score: <span className="text-cyan-600 dark:text-cyan-400">{workflowStatus.score || 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {workflowStatus.stages?.map((stage, idx) => (
              <div key={stage.key || idx} className="flex-1 flex flex-col items-center min-w-[100px]">
                <div className={`w-full h-2 mb-2 rounded-full ${stage.status === 'Completed' ? 'bg-emerald-500' : stage.status === 'In Progress' ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                <div className="text-xs font-semibold text-center text-slate-700 dark:text-slate-300">{stage.name}</div>
                <div className="text-[10px] text-slate-500">{stage.status}</div>
              </div>
            ))}
          </div>
          {canWrite && workflowStatus.currentStageIndex < workflowStatus.stages?.length - 1 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleUpdateStatus('AdvanceWorkflow')} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs cursor-pointer">
                Advance to Next Stage
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Candidate Details, Resume preview, Evaluation Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Candidate Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-4">
              <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Candidate Profile Info
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Location</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.currentLocation || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Notice Period</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.noticePeriod ? `${app.noticePeriod}` : "Not declared"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Briefcase className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Years of Experience</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.yearsOfExperience} years</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Bookmark className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Company & Title</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.currentCompany || "N/A"} - {app.currentDesignation || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FileSpreadsheet className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">CTC Package Details (Current / Expected)</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {app.currentCtc || "N/A"} / {app.expectedCtc || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Award className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Highest Education</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{app.highestEducation || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Social profiles links */}
            <div className="flex flex-wrap items-center gap-3 border-t pt-4 mt-5 text-xs font-semibold">
              {app.linkedin && (
                <a
                  href={app.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  <LinkIcon className="h-3 w-3" /> LinkedIn Profile
                </a>
              )}
              {app.portfolio && (
                <a
                  href={app.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  <LinkIcon className="h-3 w-3" /> Personal Portfolio
                </a>
              )}
            </div>
          </Card>

          {/* Resume PDF Section */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Resume Document
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {fileUrl ? "Resume file is uploaded and available for download or preview." : "No resume document has been uploaded for this candidate."}
                </p>
              </div>

              {fileUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4" /> Preview Resume
                  </a>
                  <a
                    href={fileUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition cursor-pointer shadow-sm"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Evaluation & Feedback Logs */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-4">
              <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Interview Evaluation Logs
            </h2>
            <div className="space-y-3.5">
              {Array.isArray(app.interviewEvaluations) && app.interviewEvaluations.length > 0 ? (
                app.interviewEvaluations.map((log, index) => (
                  <div key={index} className="border-l-2 border-cyan-500 pl-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{log.interviewerName || "Interviewer"} ({log.round})</span>
                      <span className="text-slate-400">{log.evaluatedAt ? new Date(log.evaluatedAt).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {log.feedback}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">Score Rating: {log.rating} / 5</div>
                      <div className="text-[11px] font-bold text-slate-500">Rec: {log.recommendation}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-sm border-2 border-dashed rounded-lg">No evaluation notes or feedbacks recorded yet. Use the sidebar to add feedback.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Workspaces: Offer Package, Schedule Interview, Feedback, BGV Panel */}
        <div className="space-y-6">
          
          {/* Offer Package Workspace */}
          {canWrite && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                  Offer Package & Details
                </h2>
                {offer && (
                  <RecruitmentStatusBadge status={offer.status} />
                )}
              </div>

              {offer && !isEditingOfferPackage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Offer ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{offer.offerId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Salary Package</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">INR {Number(offer.salary || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Joining Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{offer.joiningDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Expiry Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Position</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{offer.position || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{offer.department || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => setIsEditingOfferPackage(true)}
                      className="w-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                    >
                      Edit Offer Amount & Dates
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveOfferPackage} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Salary Package Amount (INR / annum)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 1200000"
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, salary: e.target.value }))}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Proposed Joining Date</Label>
                      <Input
                        type="date"
                        value={offerForm.joiningDate}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                        className="text-xs h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Offer Expiry Date</Label>
                      <Input
                        type="date"
                        value={offerForm.expiryDate}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Position Title</Label>
                      <Input
                        type="text"
                        placeholder="Role / Title"
                        value={offerForm.position}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, position: e.target.value }))}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Department</Label>
                      <Input
                        type="text"
                        placeholder="Department"
                        value={offerForm.department}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, department: e.target.value }))}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Annual Bonus (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="Bonus amount"
                      value={offerForm.bonus}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, bonus: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={offerSaveLoading} className="flex-1 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer">
                      {offerSaveLoading ? "Saving..." : offer ? "Save Offer Updates" : "Create Offer Package"}
                    </Button>
                    {offer && (
                      <Button type="button" variant="ghost" onClick={() => setIsEditingOfferPackage(false)} className="text-xs cursor-pointer">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </Card>
          )}
          
          {/* BGV verification checklist workspace (available if status is Selected or offered) */}
          {["Selected", "bgv", "hired", "offer"].some(v => (app.status || "").toLowerCase().includes(v)) && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                Background Verification (BGV)
              </h2>

              <form onSubmit={handleUpdateBGV} className="space-y-4">
                <div className="space-y-2.5">
                  {['identity', 'education', 'employment', 'criminal'].map((category) => (
                    <div key={category} className="space-y-1">
                      <Label className="text-[10px] font-bold capitalize">{category} Check</Label>
                      <select
                        value={bgvChecks[category]}
                        onChange={(e) => setBgvChecks(prev => ({ ...prev, [category]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bgvRemarks" className="text-xs font-bold">Verification Remarks</Label>
                  <Textarea
                    id="bgvRemarks"
                    rows={3}
                    placeholder="Enter background check remarks..."
                    value={bgvNotes}
                    onChange={(e) => setBgvNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" disabled={bgvLoading} className="w-full text-xs font-bold cursor-pointer">
                  {bgvLoading ? "Saving BGV Status..." : "Save BGV check details"}
                </Button>
              </form>
            </Card>
          )}

          {/* Schedule Interview Workspace */}
          {canWrite && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-cyan-600" />
                Schedule Interview
              </h2>

              <form onSubmit={handleScheduleInterview} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Interview Date</Label>
                    <Input
                      type="date"
                      value={interviewForm.interviewDate}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Mode</Label>
                    <select
                      value={interviewForm.mode}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, mode: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Start Time</Label>
                    <Input
                      type="time"
                      value={interviewForm.startTime}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">End Time</Label>
                    <Input
                      type="time"
                      value={interviewForm.endTime}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {interviewForm.mode === 'Online' ? (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Meeting Link</Label>
                    <Input
                      type="url"
                      placeholder="e.g. https://zoom.us/..."
                      value={interviewForm.meetingLink}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Location</Label>
                    <Input
                      type="text"
                      placeholder="Office address or room"
                      value={interviewForm.location}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, location: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Interviewer Name</Label>
                    <Input
                      type="text"
                      placeholder="Name"
                      value={interviewForm.interviewerName}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewerName: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Interviewer ID (opt)</Label>
                    <Input
                      type="text"
                      placeholder="ID"
                      value={interviewForm.interviewerId}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewerId: e.target.value }))}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Instructions (comma separated)</Label>
                  <Textarea
                    rows={2}
                    placeholder="E.g. Be prepared to share screen, prepare a demo"
                    value={interviewForm.instructions}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" disabled={interviewLoading} className="w-full text-xs font-bold cursor-pointer">
                  {interviewLoading ? "Creating Task..." : "Schedule Interview Invite"}
                </Button>
              </form>
            </Card>
          )}

          {/* Record Feedback Workspace */}
          {canWrite && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Send className="h-4.5 w-4.5 text-cyan-600" />
                Add Evaluation Feedback
              </h2>

              <form onSubmit={handleRecordFeedback} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Round</Label>
                    <select
                      value={feedbackFormData.round}
                      onChange={(e) => setFeedbackFormData(prev => ({ ...prev, round: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="HR Screening">HR Screening</option>
                      <option value="Technical">Technical</option>
                      <option value="Managerial">Managerial</option>
                      <option value="Final Stage">Final Stage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Rating Score (1 - 5)</Label>
                    <select
                      value={feedbackFormData.rating}
                      onChange={(e) => setFeedbackFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="5">5 - Exceptional</option>
                      <option value="4">4 - Strong Candidate</option>
                      <option value="3">3 - Qualified</option>
                      <option value="2">2 - Borderline</option>
                      <option value="1">1 - Not Qualified</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Feedback Remarks</Label>
                  <Textarea
                    rows={4}
                    placeholder="Describe candidate performance, technical strengths, culture fit..."
                    value={feedbackFormData.feedback}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, feedback: e.target.value }))}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Recommendation</Label>
                  <select
                    value={feedbackFormData.recommendation}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Recommended">Recommended</option>
                    <option value="Not Recommended">Not Recommended</option>
                    <option value="Borderline">Borderline</option>
                  </select>
                </div>

                <Button type="submit" disabled={feedbackLoading} className="w-full text-xs font-bold cursor-pointer">
                  {feedbackLoading ? "Saving Notes..." : "Submit Evaluation Feedback"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default CandidateDetail
