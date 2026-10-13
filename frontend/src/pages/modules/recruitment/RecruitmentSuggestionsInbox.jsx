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
import { DataTable } from "@/components/ui/data-table"
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
    <div className="space-y-6 max-w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Recruitment Suggestions</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Suggestions raised from governance oversight. Acknowledge and resolve items here.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Open items first; newest at top.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="p-4">
              <DataTable 
                data={items}
                columns={[
                  {
                    accessorKey: "subject",
                    header: "Subject",
                    cell: ({ row }) => <span className="font-semibold">{row.original.subject}</span>
                  },
                  {
                    accessorKey: "status",
                    header: "Status",
                    cell: ({ row }) => <Badge variant={row.original.status === "open" ? "default" : "secondary"}>{row.original.status}</Badge>
                  },
                  {
                    accessorKey: "contextType",
                    header: "Context",
                    cell: ({ row }) => (
                      <span className="text-xs text-muted-foreground">
                        {row.original.contextType}
                        {row.original.contextRef ? ` · ${row.original.contextRef}` : ""}
                      </span>
                    )
                  },
                  {
                    accessorKey: "message",
                    header: "Message",
                    cell: ({ row }) => (
                      <div className="max-w-[300px]">
                        <p className="text-sm whitespace-pre-wrap">{row.original.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          From: {row.original.createdBy?.firstName ? `${row.original.createdBy.firstName} ${row.original.createdBy.lastName || ""}` : "Admin"}
                        </p>
                      </div>
                    )
                  },
                  {
                    id: "actions",
                    header: "Actions",
                    cell: ({ row }) => {
                      const s = row.original;
                      if (!canAck || s.status !== "open") {
                        return s.hrNote ? <span className="text-xs font-medium">Note: {s.hrNote}</span> : null;
                      }
                      return (
                        <div className="space-y-2 min-w-[200px]">
                          <Textarea
                            rows={1}
                            value={notes[s._id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [s._id]: e.target.value }))}
                            placeholder="Internal note"
                            className="h-8 min-h-[32px] text-xs"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={() => onAck(s._id)}>Ack</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onClose(s._id)}>Close</Button>
                          </div>
                        </div>
                      );
                    }
                  }
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
