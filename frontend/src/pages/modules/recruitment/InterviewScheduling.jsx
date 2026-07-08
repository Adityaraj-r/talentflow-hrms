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
import { Search, Calendar, Loader2, Video, Clock3, MapPin } from "lucide-react"
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
  const todayDate = format(new Date(), "yyyy-MM-dd")

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

  useEffect(() => {
    fetchApplications()
    fetchEmployees()
  }, [])

  const candidates = useMemo(() => {
    return applications
      .filter((a) => ["Shortlisted", "Interview"].includes(a.status))
      .filter((a) => {
        const q = search.toLowerCase()
        return (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
      })
  }, [applications, search])

  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")), [])
  const minuteOptions = useMemo(() => ["00", "15", "30", "45"], [])

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Scheduling</h1>
        <p className="text-muted-foreground">Schedule interviews and send dedicated candidate emails</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidates ready for interviews</CardTitle>
          <CardDescription>Only shortlisted or interview-stage applications are shown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {candidates.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">No candidates available for scheduling.</div>
          ) : (
            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c._id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.jobId?.jobTitle || "Role"} · {c.status}
                    </div>
                  </div>
                  {canWrite && (
                    <Button
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
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>{selected?.name} · {selected?.email}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="space-y-1.5">
              <Label>Instructions (one per line)</Label>
              <Textarea
                rows={4}
                value={form.instructionsText}
                onChange={(e) => setField("instructionsText", e.target.value)}
                placeholder="Bring valid ID card"
                className="w-full"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={submitSchedule} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send dedicated interview email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InterviewScheduling
