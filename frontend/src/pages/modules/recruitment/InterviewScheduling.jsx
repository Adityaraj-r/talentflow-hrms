"use client"

import { useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { Search, Calendar, Loader2, Video, Clock3, MapPin, CheckCircle2, XCircle, UserCheck, UserX, Clock, Map, Building, Phone, Send, Info, Eye, ExternalLink, CalendarDays, X } from "lucide-react"
import { format, isValid, parse } from "date-fns"
import { toast } from "sonner"

const InterviewScheduling = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const [applications, setApplications] = useState([])
  const [employees, setEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fetchingEmployees, setFetchingEmployees] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    interviewDate: "",
    startHour: "",
    startMinute: "",
    startPeriod: "AM",
    endHour: "",
    endMinute: "",
    endPeriod: "AM",
    mode: "",
    location: "",
    meetingLink: "",
    instructionsText: "",
    interviewerId: "",
    interviewerName: "",
    interviewerDesignation: "",
    officeAddress: "",
    customAddress: "",
  })
  const [processingId, setProcessingId] = useState(null)
  const todayDate = format(new Date(), "yyyy-MM-dd")

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    candidate: null,
    targetStatus: "",
    submitting: false,
    errorMessage: "",
  })

  const openDecisionModal = (candidate, targetStatus) => {
    setDecisionModal({
      open: true,
      candidate,
      targetStatus,
      submitting: false,
      errorMessage: "",
    })
  }

  const handleDecisionSubmit = async () => {
    const { candidate, targetStatus } = decisionModal
    if (!candidate?._id || !targetStatus) return

    setDecisionModal(prev => ({ ...prev, submitting: true, errorMessage: "" }))

    try {
      try {
        await apiClient.put(`/applications/${candidate._id}/status`, { status: targetStatus })
      } catch {
        await apiClient.patch(`/applications/${candidate._id}/status`, { status: targetStatus })
      }

      if (targetStatus === "Selected") {
        toast.success(`${candidate.name} accepted! Offer created & available in Offer Management.`)
      } else {
        toast.success(`${candidate.name} has been rejected.`)
      }

      setDecisionModal({ open: false, candidate: null, targetStatus: "", submitting: false, errorMessage: "" })
      await fetchApplications()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to update candidate status"
      setDecisionModal(prev => ({ ...prev, submitting: false, errorMessage: msg }))
      toast.error(`Failed to ${targetStatus === "Selected" ? "accept" : "reject"} candidate: ${msg}`)
    }
  }

  const handleToggleAssignment = async (candidate) => {
    if (!candidate?._id) return
    const newStatus = (candidate.assignmentStatus === "Cleared" || candidate.assignmentCleared) ? "Pending" : "Cleared"
    try {
      await apiClient.put(`/applications/${candidate._id}/status`, { assignmentStatus: newStatus })
      toast.success(`Assignment status updated to ${newStatus} for ${candidate.name}`)
      await fetchApplications()
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update assignment status")
    }
  }

  const handleUpdateRound = async (candidate, newRound) => {
    if (!candidate?._id) return
    try {
      await apiClient.put(`/applications/${candidate._id}/status`, { currentRound: newRound })
      toast.success(`Interview round updated to ${newRound} for ${candidate.name}`)
      await fetchApplications()
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update interview round")
    }
  }

  const fetchApplications = async () => {
    try {
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.message || "Failed to load applications")
      setApplications([])
    }
  }

  const fetchEmployees = async () => {
    setFetchingEmployees(true)
    try {
      const data = await apiClient.get("/employees")
      const allEmps = Array.isArray(data) ? data : []
      // Do not include ADMIN, SUPER ADMIN, or test/demo users
      const filtered = allEmps.filter((emp) => {
        const r = String(emp.role || "").toUpperCase().replace(/\s+/g, "_")
        const email = String(emp.email || "").toLowerCase()
        const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase()
        const isDemo = email.includes("demo") || email.includes("test") || name.includes("test")
        return r !== "ADMIN" && r !== "SUPER_ADMIN" && !isDemo
      })

      const uniqueEmpsMap = new Map()
      filtered.forEach(emp => {
        const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim().toLowerCase()
        if (fullName && !uniqueEmpsMap.has(fullName)) {
          uniqueEmpsMap.set(fullName, emp)
        }
      })

      setEmployees(Array.from(uniqueEmpsMap.values()))
    } catch (e) {
      console.error("Failed to load interviewers", e)
      toast.error(e?.message || "Failed to load interviewers")
    } finally {
      setFetchingEmployees(false)
    }
  }

  const [roleFilter, setRoleFilter] = useState("All")
  const [stageFilter, setStageFilter] = useState("All")
  const [locationFilter, setLocationFilter] = useState("All")

  useEffect(() => {
    fetchApplications()
    fetchEmployees()
  }, [])

  const baseApplications = useMemo(() => {
    return applications.filter((a) => ["Shortlisted", "Interview", "Applied", "HR Screening", "Under Review"].includes(a.status))
  }, [applications])

  const roleOptions = useMemo(() => {
    const roles = baseApplications.map(a => a.selectedPositionTitle || a.hiringRoleName || a.jobId?.jobTitle).filter(Boolean)
    return ["All", ...new Set(roles)]
  }, [baseApplications])

  const stageOptions = useMemo(() => {
    const stages = baseApplications.map(a => a.status).filter(Boolean)
    return ["All", ...new Set(stages)]
  }, [baseApplications])

  const locationOptions = useMemo(() => {
    const locs = baseApplications.map(a => a.currentLocation || a.jobId?.officeLocation || a.jobId?.location).filter(Boolean)
    return ["All", ...new Set(locs)]
  }, [baseApplications])

  const candidates = useMemo(() => {
    return baseApplications.filter((a) => {
      const q = search.toLowerCase()
      const roleVal = a.selectedPositionTitle || a.hiringRoleName || a.jobId?.jobTitle || ""
      const stageVal = a.status || ""
      const locVal = a.currentLocation || a.jobId?.officeLocation || a.jobId?.location || ""

      const matchesSearch = !q || (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q) || roleVal.toLowerCase().includes(q) || locVal.toLowerCase().includes(q)
      const matchesRole = roleFilter === "All" || roleVal === roleFilter
      const matchesStage = stageFilter === "All" || stageVal === stageFilter
      const matchesLoc = locationFilter === "All" || locVal === locationFilter

      return matchesSearch && matchesRole && matchesStage && matchesLoc
    })
  }, [baseApplications, search, roleFilter, stageFilter, locationFilter])



  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const getComposedTime = (prefix) => {
    const hour = form[`${prefix}Hour`]
    const minute = form[`${prefix}Minute`]
    const period = form[`${prefix}Period`]
    if (!hour || !minute || !period) return ""
    return `${hour}:${minute} ${period}`
  }

  const parseTimeTo24Hour = (timeValue) => {
    if (!timeValue) return null
    const raw = String(timeValue).trim()
    const parsed24 = parse(raw, "HH:mm", new Date())
    if (isValid(parsed24)) return format(parsed24, "HH:mm")
    const parsed12 = parse(raw, "hh:mm a", new Date())
    if (isValid(parsed12)) return format(parsed12, "HH:mm")
    return null
  }

  const toDateTimeISO = (dateValue, timeValue) => {
    const normalizedTime = parseTimeTo24Hour(timeValue)
    if (!dateValue || !normalizedTime) return null
    const [hours, minutes] = normalizedTime.split(":")
    const d = parse(String(dateValue), "yyyy-MM-dd", new Date())
    d.setHours(Number(hours), Number(minutes), 0, 0)
    return isValid(d) ? d.toISOString() : null
  }

  const validateTimeRange = () => {
    const start = parseTimeTo24Hour(getComposedTime("start"))
    const end = parseTimeTo24Hour(getComposedTime("end"))
    if (!start || !end) return false
    return start < end
  }

  const isValidGoogleMeetLink = (link) => {
    try {
      const url = new URL(String(link).trim())
      return url.hostname === "meet.google.com" && /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(url.pathname)
    } catch {
      return false
    }
  }

  const openGoogleMeetScheduler = () => {
    if (form.mode !== "Online") {
      toast.error("Scheduler is only available for Online mode")
      return
    }
    if (!form.interviewDate) {
      toast.error("Please select an interview date")
      return
    }
    const startTime = getComposedTime("start")
    const endTime = getComposedTime("end")
    if (!startTime || !endTime) {
      toast.error("Please select start and end time")
      return
    }
    if (!validateTimeRange()) {
      toast.error("End time must be after start time")
      return
    }
    const startDateTime = toDateTimeISO(form.interviewDate, startTime)
    const endDateTime = toDateTimeISO(form.interviewDate, endTime)
    if (!startDateTime || !endDateTime) {
      toast.error("Invalid date/time. Please select values again.")
      return
    }
    const toCalendarDate = (isoValue) => format(new Date(isoValue), "yyyyMMdd'T'HHmmss'Z'")
    const title = encodeURIComponent(`Interview: ${selected?.name || "Candidate"}`)
    const details = encodeURIComponent("Please enable Google Meet while scheduling and share the generated link in HRMS.")
    const dates = `${toCalendarDate(startDateTime)}/${toCalendarDate(endDateTime)}`
    const attendee = selected?.email ? `&add=${encodeURIComponent(selected.email)}` : ""
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}${attendee}`
    window.open(calendarUrl, "_blank", "noopener,noreferrer")
    toast.info("Google Calendar opened. Create the event with Meet, then paste the link below.")
  }

  const submitSchedule = async () => {
    if (!selected?._id) {
      toast.error("Please select a candidate")
      return
    }
    if (!form.mode) {
      toast.error("Please select interview mode")
      return
    }
    const startTime = getComposedTime("start")
    const endTime = getComposedTime("end")
    if (!form.interviewDate || !startTime || !endTime) {
      toast.error("Date and time are required")
      return
    }
    if (!validateTimeRange()) {
      toast.error("End time must be after start time")
      return
    }
    if (form.mode === "Online" && !form.meetingLink.trim()) {
      toast.error("Generate or add a meeting link for online interviews")
      return
    }
    if (form.mode === "Online" && !isValidGoogleMeetLink(form.meetingLink)) {
      toast.error("Please enter a valid Google Meet link (https://meet.google.com/xxx-xxxx-xxx)")
      return
    }
    if (form.mode === "Offline" && !form.location.trim()) {
      toast.error("Please provide interview address for offline mode")
      return
    }
    setSending(true)
    try {
      await apiClient.post(`/applications/${selected._id}/schedule-interview`, {
        interviewDate: form.interviewDate,
        startTime,
        endTime,
        mode: form.mode,
        location: form.location,
        meetingLink: form.meetingLink,
        interviewers: form.interviewerName
          ? [{ 
              name: form.interviewerName, 
              designation: form.interviewerDesignation || "Interviewer",
              id: form.interviewerId 
            }]
          : [],
        instructions: form.instructionsText
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      })
      toast.success("Interview scheduled and email sent")
      setOpen(false)
      setSelected(null)
      setForm({
        interviewDate: "",
        startHour: "",
        startMinute: "",
        startPeriod: "AM",
        endHour: "",
        endMinute: "",
        endPeriod: "AM",
        mode: "",
        location: "",
        meetingLink: "",
        instructionsText: "",
        interviewerId: "",
        interviewerName: "",
        interviewerDesignation: "",
        officeAddress: "",
        customAddress: "",
      })
      fetchApplications()
    } catch (e) {
      toast.error(e?.message || "Failed to schedule interview")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Interview Scheduling</h1>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-muted/20">
          <div className="relative flex-1 min-w-[200px] lg:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search candidate, role, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Role */}
            <div className="w-36 sm:w-44">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full bg-background text-xs h-9">
                  <SelectValue placeholder="Role: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  {roleOptions.filter(r => r !== "All").map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Stage */}
            <div className="w-32 sm:w-36">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full bg-background text-xs h-9">
                  <SelectValue placeholder="Stage: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Stages</SelectItem>
                  {stageOptions.filter(s => s !== "All").map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Location */}
            <div className="w-36 sm:w-44">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full bg-background text-xs h-9">
                  <SelectValue placeholder="Location: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Locations</SelectItem>
                  {locationOptions.filter(l => l !== "All").map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(roleFilter !== "All" || stageFilter !== "All" || locationFilter !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearch("")
                  setRoleFilter("All")
                  setStageFilter("All")
                  setLocationFilter("All")
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Candidate Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Job ID</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Applied Role</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Location</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Assignment Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Interview Round</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Current Stage</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-sm text-muted-foreground">
                      No candidates match the selected filters.
                    </td>
                  </tr>
                ) : candidates.slice((currentPage - 1) * 10, currentPage * 10).map((c) => (
                  <tr key={c._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.email}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                      {c.jobId?.jobCode || (c.jobId?._id ? `JOB-${c.jobId._id.slice(-4)}` : "N/A")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{c.selectedPositionTitle || c.hiringRoleName || c.jobId?.jobTitle || "Role"}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span>{c.currentLocation || c.jobId?.officeLocation || c.jobId?.location || "N/A"}</span>
                      </div>
                    </td>

                    {/* Assignment Status */}
                    <td className="px-6 py-4">
                      {c.jobId?.hasAssignment || (c.jobId?.workflow?.stages && c.jobId.workflow.stages.some(s => s.type === "assignment")) ? (
                        <button
                          type="button"
                          onClick={() => handleToggleAssignment(c)}
                          title="Click to toggle Assignment Cleared / Pending"
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shadow-xs",
                            (c.assignmentCleared || c.assignmentStatus === "Cleared")
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                          )}
                        >
                          {(c.assignmentCleared || c.assignmentStatus === "Cleared") ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                              Assignment Cleared
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              Assignment Pending
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-muted-foreground border border-white/10 bg-muted/30">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* Interview Round */}
                    <td className="px-6 py-4">
                      <select
                        value={c.currentRound || (c.jobId?.interviewRounds?.[0] || "Round 1")}
                        onChange={(e) => handleUpdateRound(c, e.target.value)}
                        className="appearance-none h-7 pl-2.5 pr-6 text-xs font-semibold rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 outline-none hover:bg-cyan-500/20 transition cursor-pointer"
                      >
                        {(c.jobId?.interviewRounds?.length ? c.jobId.interviewRounds : ["Round 1 - Technical", "Round 2 - Coding", "Round 3 - HR", "Final Round"]).map((r) => (
                          <option key={r} value={r} className="bg-slate-900 text-slate-100">{r}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-semibold bg-muted/50 text-muted-foreground">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canWrite && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(c)
                              setForm({
                                interviewDate: "",
                                startHour: "",
                                startMinute: "",
                                startPeriod: "AM",
                                endHour: "",
                                endMinute: "",
                                endPeriod: "AM",
                                mode: "",
                                location: "",
                                meetingLink: "",
                                instructionsText: "",
                                interviewerName: "",
                                interviewerDesignation: "",
                                officeAddress: "",
                                customAddress: "",
                              })
                              setOpen(true)
                            }}
                          >
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Schedule
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                            onClick={() => openDecisionModal(c, "Selected")}
                            title="Accept Candidate"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Accept
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                            onClick={() => openDecisionModal(c, "Rejected")}
                            title="Reject Candidate"> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {candidates.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(candidates.length / 10)}
                totalItems={candidates.length}
                itemsPerPage={10}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">Schedule interview</DialogTitle>
            <DialogDescription className="text-sm mt-1">{selected?.name} · {selected?.email}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  min={todayDate}
                  value={form.interviewDate}
                  onChange={(e) => setField("interviewDate", e.target.value)}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(value) => {
                    setField("mode", value)
                    if (value !== "Online") setField("meetingLink", "")
                    if (value === "Online") setField("location", "")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select interview mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start time</Label>
                <div className="rounded-md border px-3 py-2 animate-in fade-in-50 slide-in-from-bottom-1 duration-200">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Select Hour / Min / AM-PM
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input 
                      type="number" 
                      min="1" 
                      max="12" 
                      placeholder="HH" 
                      value={form.startHour} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (Number(val) >= 1 && Number(val) <= 12)) setField("startHour", val);
                      }} 
                      onBlur={(e) => {
                        if (e.target.value) setField("startHour", String(Number(e.target.value)).padStart(2, '0'));
                      }}
                      className="w-full"
                    />
                    <Input 
                      type="number" 
                      min="0" 
                      max="59" 
                      placeholder="MM" 
                      value={form.startMinute} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) setField("startMinute", val);
                      }} 
                      onBlur={(e) => {
                        if (e.target.value) setField("startMinute", String(Number(e.target.value)).padStart(2, '0'));
                      }}
                      className="w-full"
                    />
                    <Select value={form.startPeriod} onValueChange={(value) => setField("startPeriod", value)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <Label>End time</Label>
                <div className="rounded-md border px-3 py-2 animate-in fade-in-50 slide-in-from-bottom-1 duration-200">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Select Hour / Min / AM-PM
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input 
                      type="number" 
                      min="1" 
                      max="12" 
                      placeholder="HH" 
                      value={form.endHour} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (Number(val) >= 1 && Number(val) <= 12)) setField("endHour", val);
                      }} 
                      onBlur={(e) => {
                        if (e.target.value) setField("endHour", String(Number(e.target.value)).padStart(2, '0'));
                      }}
                      className="w-full"
                    />
                    <Input 
                      type="number" 
                      min="0" 
                      max="59" 
                      placeholder="MM" 
                      value={form.endMinute} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) setField("endMinute", val);
                      }} 
                      onBlur={(e) => {
                        if (e.target.value) setField("endMinute", String(Number(e.target.value)).padStart(2, '0'));
                      }}
                      className="w-full"
                    />
                    <Select value={form.endPeriod} onValueChange={(value) => setField("endPeriod", value)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {form.mode === "Online" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>Meeting link</Label>
                  <Button type="button" variant="outline" size="sm" onClick={openGoogleMeetScheduler}>
                    <Video className="mr-2 h-4 w-4" />
                    Open Google Scheduler
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  After scheduling in Google Calendar, paste the generated Google Meet link here.
                </p>
                <Input value={form.meetingLink} onChange={(e) => setField("meetingLink", e.target.value)} placeholder="https://meet.google.com/..." />
              </div>
            )}
            
            {form.mode === "Offline" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Interview address
                </Label>
                <Tabs
                  defaultValue="office"
                  onValueChange={(tab) => {
                    if (tab === "office") setField("location", form.officeAddress)
                    if (tab === "custom") setField("location", form.customAddress)
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="office">Office address</TabsTrigger>
                    <TabsTrigger value="custom">Custom address</TabsTrigger>
                  </TabsList>
                  <TabsContent value="office">
                    <Input
                      value={form.officeAddress}
                      onChange={(e) => {
                        setField("officeAddress", e.target.value)
                        setField("location", e.target.value)
                      }}
                      placeholder="Company office full address"
                    />
                  </TabsContent>
                  <TabsContent value="custom">
                    <Input
                      value={form.customAddress}
                      onChange={(e) => {
                        setField("customAddress", e.target.value)
                        setField("location", e.target.value)
                      }}
                      placeholder="Interview venue full address"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Interviewer name</Label>
                <Select
                  value={form.interviewerId}
                  onValueChange={(val) => {
                    const emp = employees.find(e => (e._id || e.employeeCode) === val)
                    if (emp) {
                      setField("interviewerId", val)
                      setField("interviewerName", `${emp.firstName} ${emp.lastName || ""}`.trim())
                      
                      const formatRole = (roleStr) => {
                        if (!roleStr) return ""
                        return roleStr.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                      }
                      const actualDesignation = formatRole(emp.role) || "Interviewer"
                      setField("interviewerDesignation", actualDesignation)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Interviewer Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {fetchingEmployees ? (
                      <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      (() => {
                        if (employees.length === 0) {
                          return <div className="p-4 text-center text-sm text-muted-foreground">No interviewers available</div>
                        }
                        return employees.map((emp) => {
                          const fullName = `${emp.firstName} ${emp.lastName || ""}`.trim()
                          const empId = emp._id || emp.employeeCode
                          return (
                            <SelectItem key={empId} value={empId}>
                              {fullName}
                            </SelectItem>
                          )
                        })
                      })()
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Interviewer designation</Label>
                <Input 
                  value={form.interviewerDesignation} 
                  readOnly 
                  className="bg-muted text-muted-foreground cursor-not-allowed w-full" 
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions (one per line)</Label>
              <Textarea
                rows={6}
                value={form.instructionsText}
                onChange={(e) => setField("instructionsText", e.target.value)}
                placeholder="Bring valid ID card"
                className="w-full resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={submitSchedule} disabled={sending} size="lg">
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Interview Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decision Confirmation Modal */}
      <Dialog open={decisionModal.open} onOpenChange={(val) => !decisionModal.submitting && setDecisionModal(prev => ({ ...prev, open: val }))}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              {decisionModal.targetStatus === "Selected" ? (
                <>
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  Accept Candidate & Enable Offer
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 text-rose-500" />
                  Reject Candidate Application
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              {decisionModal.targetStatus === "Selected" ? (
                <span>Confirm selection for <strong>{decisionModal.candidate?.name}</strong>. Their offer package will be auto-generated and added to <strong>Offer Management</strong> for editing.</span>
              ) : (
                <span>Are you sure you want to reject <strong>{decisionModal.candidate?.name}</strong>? This decision will update their application stage to Rejected.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate:</span>
                <span className="font-semibold text-foreground">{decisionModal.candidate?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground">{decisionModal.candidate?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium text-foreground">{decisionModal.candidate?.selectedPositionTitle || decisionModal.candidate?.hiringRoleName || "Role"}</span>
              </div>
            </div>

            {decisionModal.errorMessage && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400 space-y-1">
                <p className="font-semibold text-xs flex items-center gap-1">
                  <span>⚠️ Action Failed</span>
                </p>
                <p className="text-xs font-mono">{decisionModal.errorMessage}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              disabled={decisionModal.submitting}
              onClick={() => setDecisionModal({ open: false, candidate: null, targetStatus: "", submitting: false, errorMessage: "" })}
            >
              Cancel
            </Button>
            <Button
              variant={decisionModal.targetStatus === "Selected" ? "default" : "destructive"}
              disabled={decisionModal.submitting}
              onClick={handleDecisionSubmit}
              className={decisionModal.targetStatus === "Selected" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {decisionModal.submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : decisionModal.targetStatus === "Selected" ? (
                "Accept & Create Offer"
              ) : (
                "Reject Candidate"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InterviewScheduling
