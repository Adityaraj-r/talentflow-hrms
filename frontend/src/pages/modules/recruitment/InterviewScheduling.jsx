"use client"

import { useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import googleMeetService from "@/services/googleMeetService"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Calendar, Loader2, Video } from "lucide-react"
import { toast } from "sonner"

const InterviewScheduling = () => {
  const { user } = useUser()
  const canWrite = user?.can?.("recruitment", "write")
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [meetingLoading, setMeetingLoading] = useState(false)
  const [form, setForm] = useState({
    interviewDate: "",
    startTime: "",
    endTime: "",
    mode: "Online",
    location: "",
    meetingLink: "",
    instructionsText: "",
    interviewerName: "",
    interviewerDesignation: "",
  })

  const fetchApplications = async () => {
    try {
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.message || "Failed to load applications")
      setApplications([])
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const candidates = useMemo(() => {
    return applications
      .filter((a) => ["Shortlisted", "Interview"].includes(a.status))
      .filter((a) => {
        const q = search.toLowerCase()
        return (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
      })
  }, [applications, search])

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const generateMeet = async () => {
    if (!selected?.email || !form.interviewDate || !form.startTime || !form.endTime) {
      toast.error("Set date/time and select candidate first")
      return
    }
    setMeetingLoading(true)
    try {
      const startDateTime = new Date(`${form.interviewDate}T${form.startTime}:00`).toISOString()
      const endDateTime = new Date(`${form.interviewDate}T${form.endTime}:00`).toISOString()
      const res = await googleMeetService.createMeeting({
        summary: `Interview: ${selected?.jobId?.jobTitle || "Candidate"} - ${selected.name}`,
        description: "Interview session",
        startDateTime,
        endDateTime,
        attendees: [selected.email],
      })
      const link = res?.meetLink || res?.data?.meetLink
      if (!link) {
        toast.error("Could not generate meeting link")
        return
      }
      setField("meetingLink", link)
      setField("mode", "Online")
      toast.success("Meeting link generated")
    } catch (e) {
      toast.error(e?.message || "Failed to generate meeting link")
    } finally {
      setMeetingLoading(false)
    }
  }

  const submitSchedule = async () => {
    if (!selected?._id) return
    if (!form.interviewDate || !form.startTime || !form.endTime || !form.mode) {
      toast.error("Date, time and mode are required")
      return
    }
    setSending(true)
    try {
      await apiClient.post(`/applications/${selected._id}/schedule-interview`, {
        interviewDate: form.interviewDate,
        startTime: form.startTime,
        endTime: form.endTime,
        mode: form.mode,
        location: form.location,
        meetingLink: form.meetingLink,
        interviewers: form.interviewerName
          ? [{ name: form.interviewerName, designation: form.interviewerDesignation || "Interviewer" }]
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
        startTime: "",
        endTime: "",
        mode: "Online",
        location: "",
        meetingLink: "",
        instructionsText: "",
        interviewerName: "",
        interviewerDesignation: "",
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
                  <Button
                    disabled={!canWrite}
                    onClick={() => {
                      setSelected(c)
                      setOpen(true)
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
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
                <Input type="date" value={form.interviewDate} onChange={(e) => setField("interviewDate", e.target.value)} />
              </div>
              <div>
                <Label>Mode</Label>
                <Input value={form.mode} onChange={(e) => setField("mode", e.target.value)} placeholder="Online or InPerson" />
              </div>
              <div>
                <Label>Start time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setField("startTime", e.target.value)} />
              </div>
              <div>
                <Label>End time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Office / Building / Room" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Meeting link</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateMeet} disabled={meetingLoading}>
                  {meetingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                  Generate Meet
                </Button>
              </div>
              <Input value={form.meetingLink} onChange={(e) => setField("meetingLink", e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Interviewer name</Label>
                <Input value={form.interviewerName} onChange={(e) => setField("interviewerName", e.target.value)} />
              </div>
              <div>
                <Label>Interviewer designation</Label>
                <Input value={form.interviewerDesignation} onChange={(e) => setField("interviewerDesignation", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Instructions (one per line)</Label>
              <Textarea
                rows={4}
                value={form.instructionsText}
                onChange={(e) => setField("instructionsText", e.target.value)}
                placeholder="Bring valid ID card"
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
