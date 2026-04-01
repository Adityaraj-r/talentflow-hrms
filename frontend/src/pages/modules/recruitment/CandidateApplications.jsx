import { useEffect, useMemo, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Users, UserCheck, UserX, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const CandidateApplications = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isOperationsManager = role === "OPERATIONS_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && !isOperationsManager

  const [applications,setApplications] = useState([])
  const [search,setSearch] = useState("")
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  const uploadBaseUrl = useMemo(
    () =>
      (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(
        /\/api\/?$/,
        ""
      ),
    []
  )

  const fetchApplications = async () => {

    try {
      const data = await apiClient.get("/applications")
      setApplications(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load applications")
      setApplications([])
    }

  }

  useEffect(()=>{
    fetchApplications()
  },[])

  const handleShortlist = async (id) => {

    try{

      await apiClient.put(`/applications/${id}/status`, { status: "Shortlisted" })

      fetchApplications()

    }catch(err){
      toast.error(err?.response?.data?.error || "Failed to shortlist")
    }

  }

  const handleReject = async (id) => {

    try{

      await apiClient.put(`/applications/${id}/status`, { status: "Rejected" })

      fetchApplications()

    }catch(err){
      toast.error(err?.response?.data?.error || "Failed to reject")
    }

  }

  const filteredApplications = useMemo(
    () =>
      applications.filter((app) =>
        (app.name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [applications, search]
  )

  const getStatusStyle = (status) => {

    if(status === "Applied")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"

    if(status === "Shortlisted")
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"

    if(status === "Rejected")
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"

    return ""
  }

  const stats = useMemo(() => {
    const total = applications.length
    const shortlisted = applications.filter(a => a.status === "Shortlisted").length
    const rejected = applications.filter(a => a.status === "Rejected").length
    const applied = applications.filter(a => a.status === "Applied").length
    return { total, shortlisted, rejected, applied }
  }, [applications])

  const { total, shortlisted, rejected, applied } = stats

  return (

    <div className="p-8">

      <div className="flex justify-between items-center mb-10">

        <div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Candidate Applications
          </h1>

          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Manage and review candidate applications
          </p>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex justify-between items-center">

          <div>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Total Applications
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {total}
            </h2>

          </div>

          <Users className="text-blue-600"/>

        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 flex justify-between items-center">

          <div>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Applied
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {applied}
            </h2>

          </div>

          <FileText className="text-indigo-600"/>

        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex justify-between items-center">

          <div>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Shortlisted
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {shortlisted}
            </h2>

          </div>

          <UserCheck className="text-purple-600"/>

        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex justify-between items-center">

          <div>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Rejected
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {rejected}
            </h2>

          </div>

          <UserX className="text-red-600"/>

        </div>

      </div>

      <input
        type="text"
        placeholder="Search candidate..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="
        w-full md:w-96
        border border-gray-300 dark:border-slate-700
        bg-white dark:bg-slate-900
        text-gray-700 dark:text-slate-200
        rounded-xl px-4 py-2 mb-8
        focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      <div className="space-y-6">

        {filteredApplications.map(app => (

          <div
            key={app._id}
            className="
            bg-white dark:bg-slate-900
            border border-gray-200 dark:border-slate-800
            rounded-2xl
            p-6
            shadow-sm
            hover:shadow-md
            transition
            "
          >

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {app.name}
                </h2>

                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {app.email}
                </p>

                <p className="text-sm mt-1 text-gray-600 dark:text-slate-300">
                  Applied For:
                  <span className="font-medium ml-1">
                    {app.jobId?.jobTitle}
                  </span>
                </p>

              </div>

              <span className={`text-xs px-3 py-1 rounded-full ${getStatusStyle(app.status)}`}>
                {app.status}
              </span>

            </div>

            <div className="mt-5 flex gap-3 flex-wrap">

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedApplication(app)
                  setViewOpen(true)
                }}
              >
                View
              </Button>

              {canWrite && (
                <>
                  <Button
                    onClick={()=>handleShortlist(app._id)}
                    disabled={app.status !== "Applied"}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
                  >
                    Shortlist
                  </Button>
                  <Button
                    onClick={()=>handleReject(app._id)}
                    disabled={app.status !== "Applied"}
                    variant="destructive"
                    className="disabled:opacity-40"
                  >
                    Reject
                  </Button>
                </>
              )}

            </div>

          </div>

        ))}

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
              Candidate details and resume (if available).
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
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Open Resume
                    </Button>
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

export default CandidateApplications