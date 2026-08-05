"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  listHrRecruitmentSuggestions,
  acknowledgeRecruitmentSuggestion,
} from "@/services/recruitmentSuggestionService"
import { Navigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
export default function RecruitmentSuggestionsInbox() {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})

  const allowed =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_OFFICER"

  const canAck =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_OFFICER"

  const load = async () => {
    try {
      const res = await listHrRecruitmentSuggestions()
      const data = res?.data ?? res
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (allowed) load()
  }, [allowed])

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  const onAck = async (id) => {
    try {
      await acknowledgeRecruitmentSuggestion(id, {
        hrNote: notes[id] || "",
        status: "acknowledged",
      })
      toast.success("Marked as acknowledged")
      load()
    } catch (e) {
      toast.error(e?.response?.data?.error || "Update failed")
    }
  }

  const onClose = async (id) => {
    try {
      await acknowledgeRecruitmentSuggestion(id, {
        hrNote: notes[id] || "",
        status: "closed",
      })
      toast.success("Closed")
      load()
    } catch (e) {
      toast.error(e?.response?.data?.error || "Update failed")
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruitment Suggestions</h1>
        <p className="text-muted-foreground mt-1">
          Suggestions raised from governance oversight. Acknowledge and resolve items here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Open items first; newest at top.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((s) => (
                <li key={s._id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="font-semibold">{s.subject}</span>
                    <Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.contextType}
                    {s.contextRef ? ` · ${s.contextRef}` : ""}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{s.message}</p>
                  <p className="text-xs text-muted-foreground">
                    From:{" "}
                    {s.createdBy?.firstName
                      ? `${s.createdBy.firstName} ${s.createdBy.lastName || ""} (${s.createdBy.email})`
                      : "Admin"}
                    {" · "}
                    {s.createdAt && new Date(s.createdAt).toLocaleString()}
                  </p>
                  {canAck && s.status === "open" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor={`note-${s._id}`}>HR note (optional)</Label>
                      <Textarea
                        id={`note-${s._id}`}
                        rows={2}
                        value={notes[s._id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [s._id]: e.target.value }))
                        }
                        placeholder="Internal note or reply summary"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" type="button" onClick={() => onAck(s._id)}>
                          Acknowledge
                        </Button>
                        <Button size="sm" type="button" variant="outline" onClick={() => onClose(s._id)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                  {s.hrNote && (
                    <p className="text-xs border-t pt-2">
                      <span className="font-medium">Note: </span>
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
