import { useCallback, useMemo, useState, useEffect } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STAGE_COLORS = {
  Applied:"bg-blue-500/15 text-blue-500 border-blue-500/30",
  Shortlisted:"bg-purple-500/15 text-purple-500 border-purple-500/30",
  Interview:"bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  Selected:"bg-green-500/15 text-green-500 border-green-500/30",
  Rejected:"bg-red-500/15 text-red-500 border-red-500/30"
}

const RecruitmentPipeline = () => {
  const { user } = useUser()
  const canWrite = user?.can?.("recruitment", "write")

  const [applications,setApplications] = useState([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [stageFilter,setStageFilter] = useState("All")
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  const uploadBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api"
    return apiUrl.replace(/\/api\/?$/, "")
  }, [])

  const stageCounts = useMemo(
    () => ({
      Applied: applications.filter(a => a.status === "Applied").length,
      Shortlisted: applications.filter(a => a.status === "Shortlisted").length,
      Interview: applications.filter(a => a.status === "Interview").length,
      Selected: applications.filter(a => a.status === "Selected").length,
      Rejected: applications.filter(a => a.status === "Rejected").length
    }),
    [applications]
  )

  const fetchApplications = useCallback(async () => {
    try{
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    }catch(error){
      console.log(error)
    }
    setLoading(false)
  }, [])

  useEffect(()=>{
    fetchApplications()
  },[fetchApplications])

  const handleStageChange = useCallback(async (id, newStatus) => {
    try {
      await apiClient.put(`/applications/${id}/status`, { status: newStatus })

      setApplications(prev =>
        prev.map(app =>
          app._id === id
            ? { ...app, status: newStatus }
            : app
        )
      )
    } catch (error) {
      console.log(error)
    }
  }, [])

  const filtered = useMemo(() => applications.filter(app => {

    const name = (app.name || "").toLowerCase()
    const job = (app.jobId?.jobTitle || "").toLowerCase()

    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      job.includes(search.toLowerCase())

    const matchesStage =
      stageFilter === "All" || app.status === stageFilter

    return matchesSearch && matchesStage

  }), [applications, search, stageFilter])

  if(loading){
    return(
      <div className="flex items-center justify-center h-64">
        Loading...
      </div>
    )
  }

  return(

    <div className="p-6 space-y-6">

      <div>
        <h2 className="text-2xl font-semibold">
          Recruitment Pipeline
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Track and manage all job applications
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">

        {Object.entries(stageCounts).map(([stage,count]) =>(

          <div
            key={stage}
            onClick={()=>setStageFilter(stageFilter===stage?"All":stage)}
            className={`rounded-xl border p-4 text-center cursor-pointer transition-all hover:scale-105 ${STAGE_COLORS[stage]}`}
          >

            <p className="text-xs font-medium opacity-80">
              {stage}
            </p>

            <p className="text-2xl font-bold mt-1">
              {count}
            </p>

          </div>

        ))}

      </div>

      <div className="flex items-center gap-4">

        <input
          type="text"
          placeholder="Search candidate..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 w-72 text-sm"
        />

        <select
          value={stageFilter}
          onChange={(e)=>setStageFilter(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 text-sm cursor-pointer"
        >

          <option value="All">All Stages</option>

          {Object.keys(stageCounts).map(s=>(
            <option key={s} value={s}>
              {s}
            </option>
          ))}

        </select>

      </div>

      <div className="rounded-xl border overflow-hidden">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b bg-muted/50 text-left uppercase tracking-wider text-muted-foreground text-xs">

              <th className="px-6 py-3">Name</th>

              <th className="px-6 py-3">Position</th>

              <th className="px-6 py-3">Email</th>

              <th className="px-6 py-3">Stage</th>

              <th className="px-6 py-3 text-right">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length===0 ?(

              <tr>

                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No candidates found
                </td>

              </tr>

            ):filtered.map(app=>(

              <tr key={app._id} className="border-b hover:bg-muted/30">

                <td className="px-6 py-4 font-medium">
                  {app.name}
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {app.jobId?.jobTitle}
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {app.email}
                </td>

                <td className="px-6 py-4">
                  {canWrite ? (
                    <select
                      value={app.status}
                      onChange={(e)=>handleStageChange(app._id,e.target.value)}
                      className={`text-xs rounded-full px-3 py-1 border font-medium bg-transparent cursor-pointer ${STAGE_COLORS[app.status]}`}
                    >
                      {Object.keys(stageCounts).map(s=>(
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs rounded-full px-3 py-1 border font-medium ${STAGE_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs"
                      onClick={() => {
                        setSelectedApplication(app)
                        setViewOpen(true)
                      }}
                    >
                      View
                    </button>
                    {canWrite && app.status !== "Rejected" && (
                      <button
                        type="button"
                        onClick={()=>handleStageChange(app._id,"Rejected")}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setSelectedApplication(null)
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="truncate">
                {selectedApplication?.name || "Candidate"}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border">
                {selectedApplication?.status || ""}
              </span>
            </DialogTitle>
            <DialogDescription>
              View candidate details and resume (if available).
            </DialogDescription>
          </DialogHeader>

          {selectedApplication ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium break-words">{selectedApplication.email}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Position</div>
                  <div className="font-medium">
                    {selectedApplication.jobId?.jobTitle || "N/A"}
                  </div>
                </div>
              </div>

              {selectedApplication.resume ? (
                <div className="rounded-lg border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Resume</div>
                    <div className="text-sm truncate" title={selectedApplication.resume}>
                      {selectedApplication.resume}
                    </div>
                  </div>
                  <a
                    href={`${uploadBaseUrl}/uploads/${selectedApplication.resume}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shrink-0"
                  >
                    Open Resume
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No resume uploaded for this application.
                </div>
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

export default RecruitmentPipeline