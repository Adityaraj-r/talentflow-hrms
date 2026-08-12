"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  createRecruitmentSuggestion,
  listMyRecruitmentSuggestions,
} from "@/services/recruitmentSuggestionService"
import { Navigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

const contextOptions = [
  { value: "general", label: "General" },
  { value: "requisition", label: "Staff requisition" },
  { value: "job", label: "Job opening" },
  { value: "application", label: "Application" },
  { value: "candidate", label: "Candidate / pipeline" },
  { value: "offer", label: "Offer" },
  { value: "onboarding", label: "Onboarding" },
]

export default function AdminRecruitmentSuggestions() {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [contextType, setContextType] = useState("general")
  const [contextRef, setContextRef] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)

  const loadMine = async () => {
    try {
      const res = await listMyRecruitmentSuggestions()
      const list = res?.data ?? res
      setMine(Array.isArray(list) ? list : [])
    } catch {
      setMine([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") loadMine()
  }, [role])

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <Navigate to="/unauthorized" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required")
      return
    }
    setSubmitting(true)
    try {
      await createRecruitmentSuggestion({
        subject: subject.trim(),
        message: message.trim(),
        contextType,
        contextRef: contextRef.trim() || undefined,
      })
      toast.success("Suggestion sent to HR Manager")
      setSubject("")
      setMessage("")
      setContextRef("")
      setContextType("general")
      loadMine()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not send suggestion")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Suggest to HR Manager</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Governance feedback on recruitment & staffing. This does not change records; HR Manager can review and respond.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle>New suggestion</CardTitle>
          <CardDescription>
            Visible to HR Manager and tracked for follow-up. Operational actions still happen in standard workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short title"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={contextType} onValueChange={setContextType}>
                <SelectTrigger>
                  <SelectValue placeholder="Context" />
                </SelectTrigger>
                <SelectContent>
                  {contextOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference (optional)</Label>
              <Input
                id="ref"
                value={contextRef}
                onChange={(e) => setContextRef(e.target.value)}
                placeholder="e.g. requisition ID, job title, candidate email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Describe your observation or recommendation for HR Manager."
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send to HR Manager"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Your recent suggestions</CardTitle>
          <CardDescription>Status updates when HR Manager acknowledges.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions yet.</p>
          ) : (
            <ul className="space-y-3">
              {mine.map((s) => (
                <li
                  key={s._id}
                  className="rounded-lg border p-3 text-sm space-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.subject}</span>
                    <Badge variant={s.status === "open" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{s.message}</p>
                  {s.hrNote && (
                    <p className="text-xs border-t pt-2 mt-2">
                      <span className="font-medium">HR note: </span>
                      {s.hrNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
