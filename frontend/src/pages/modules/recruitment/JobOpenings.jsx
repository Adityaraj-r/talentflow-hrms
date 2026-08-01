import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { BriefcaseBusiness, ClipboardList, DoorClosed, Plus, Rocket, Search, RefreshCw, Eye, Pencil, Trash2, Archive } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  RecruitmentEmptyState,
  RecruitmentKpiCard,
  RecruitmentPageHeader,
  RecruitmentStatusBadge,
} from "@/components/recruitment/RecruitmentUI"

const JobOpenings = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = ["HR_OFFICER", "HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canPublish = user?.can?.("recruitment", "write") && ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    positions: "",
    employmentType: "",
    deadline: "",
  })

  const [editingJobId, setEditingJobId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState("")
  const [jobToActOn, setJobToActOn] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const getHiringRoles = (job) => {
    if (Array.isArray(job?.hiringRoles) && job.hiringRoles.length > 0) {
      return job.hiringRoles
    }
    return [{
      _id: "default",
      roleName: job?.jobTitle || "Hiring Role",
      openings: job?.positions || 1,
      filled: 0,
      skills: job?.description || "",
      status: job?.status === "Closed" ? "Closed" : "Open",
    }]
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get("/job-openings")
      setJobs(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to load job openings")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.jobTitle || !formData.department || !formData.positions || !formData.employmentType) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      if (editingJobId) {
        await apiClient.put(`/job-openings/${editingJobId}`, {
          jobTitle: formData.jobTitle,
          department: formData.department,
          positions: Number(formData.positions),
          employmentType: formData.employmentType,
          deadline: formData.deadline,
        })
        toast.success("Job updated successfully")
      } else {
        await apiClient.post("/job-openings", {
          jobTitle: formData.jobTitle,
          department: formData.department,
          positions: Number(formData.positions),
          employmentType: formData.employmentType,
          deadline: formData.deadline,
          status: "Draft",
        })
        toast.success("Job draft created successfully")
      }
      setShowForm(false)
      setEditingJobId(null)
      setFormData({ jobTitle: "", department: "", positions: "", employmentType: "", deadline: "" })
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to save job")
    }
  }

  const publishJob = async (id) => {
    try {
      await apiClient.put(`/job-openings/${id}/publish`)
      toast.success("Job published successfully")
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to publish job")
    }
  }

  const closeJob = async (id) => {
    try {
      await apiClient.put(`/job-openings/${id}/close`)
      toast.success("Job closed successfully")
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to close job")
    }
  }

  const handleEditClick = (job) => {
    setEditingJobId(job._id)
    setFormData({
      jobTitle: job.jobTitle || "",
      department: job.department || "",
      positions: job.positions ? job.positions.toString() : "",
      employmentType: job.employmentType || "",
      deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
    })
    setShowForm(true)
  }

  const handleDeleteClick = (job) => {
    setJobToActOn(job)
    setConfirmType("delete")
    setConfirmOpen(true)
  }

  const handleRemoveClick = (job) => {
    setJobToActOn(job)
    setConfirmType("remove")
    setConfirmOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!jobToActOn) return
    try {
      await apiClient.delete(`/job-openings/${jobToActOn._id}`)
      toast.success(confirmType === "delete" ? "Draft job deleted" : "Closed job removed")
      setConfirmOpen(false)
      setJobToActOn(null)
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Action failed")
    }
  }

  const total = jobs.length
  const active = jobs.filter((j) => j.status === "Published" || j.status === "Open").length
  const draft = jobs.filter((j) => j.status === "Draft").length
  const closed = jobs.filter((j) => j.status === "Closed").length

  const filteredJobs = jobs.filter((job) => {
    let matchesFilter = true
    if (activeFilter === "published") matchesFilter = job.status === "Published" || job.status === "Open"
    else if (activeFilter === "draft") matchesFilter = job.status === "Draft"
    else if (activeFilter === "closed") matchesFilter = job.status === "Closed"
    
    let matchesSearch = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      matchesSearch = (job.jobTitle?.toLowerCase().includes(q) || job.department?.toLowerCase().includes(q))
    }
    
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Openings</h1>
        </div>
        {canWrite && (
          <Button onClick={() => navigate("/dashboard/jobs/create")}>
            <Plus size={16} className="mr-2" />
            Create Job
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <RecruitmentKpiCard title="Total Jobs" value={total} icon={BriefcaseBusiness} trend={10} helper="Openings in workspace" accent="sky" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
        <RecruitmentKpiCard title="Published" value={active} icon={Rocket} trend={12} helper="Visible on careers portal" accent="emerald" active={activeFilter === "published"} onClick={() => setActiveFilter("published")} />
        <RecruitmentKpiCard title="Draft" value={draft} icon={ClipboardList} trend={5} helper="Awaiting publication" accent="amber" active={activeFilter === "draft"} onClick={() => setActiveFilter("draft")} />
        <RecruitmentKpiCard title="Closed" value={closed} icon={DoorClosed} trend={-2} helper="No longer accepting" accent="rose" active={activeFilter === "closed"} onClick={() => setActiveFilter("closed")} />
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job titles..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Job Title</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Department</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Positions</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Type</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Deadline</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan="7" className="p-4">
                      <div className="h-10 w-full animate-pulse rounded bg-muted/50" />
                    </td>
                  </tr>
                ))
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8">
                    <RecruitmentEmptyState
                      title={activeFilter === "all" ? "No job openings yet" : `No ${activeFilter} job openings`}
                      description="Create a draft job, then publish it to start collecting applications."
                      actionLabel={canWrite ? "Create Job" : undefined}
                      onAction={() => setShowForm(true)}
                    />
                  </td>
                </tr>
              ) : filteredJobs.map((job) => {
                const isOpen = job.status === "Open" || (job.status === "Published" && !job.deadline)
                return (
                  <tr key={job._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{job.jobTitle}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{job.department}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{job.positions}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{job.employmentType}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A"}</td>
                    <td className="px-6 py-4">
                      <RecruitmentStatusBadge status={isOpen ? "Open" : job.status} />
                    </td>
                    <td className="px-6 py-4 w-[140px]">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            {job.status === "Draft" && (
                              <>
                                {canWrite && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(job)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit Draft</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(job)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete Draft</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                                {canPublish && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => publishJob(job._id)}>
                                        <Rocket className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Publish Job</TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            {(job.status === "Published" || job.status === "Open") && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedJob(job); setViewOpen(true) }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Job</TooltipContent>
                                </Tooltip>
                                {canPublish && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" onClick={() => closeJob(job._id)}>
                                        <Archive className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Close Job</TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            {job.status === "Closed" && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedJob(job); setViewOpen(true) }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Job</TooltipContent>
                                </Tooltip>
                                {canPublish && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveClick(job)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove Job</TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>
                        </TooltipProvider>
                      </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setSelectedJob(null) }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{selectedJob?.jobTitle || "Job"}</span>
              <RecruitmentStatusBadge status={(selectedJob?.status === "Open" || (selectedJob?.status === "Published" && !selectedJob?.deadline)) ? "Open" : selectedJob?.status} />
            </DialogTitle>
            <DialogDescription>Job opening details.</DialogDescription>
          </DialogHeader>
          {selectedJob ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="font-medium">{selectedJob.department || "N/A"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Employment Type</div>
                <div className="font-medium">{selectedJob.employmentType || "N/A"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Positions</div>
                <div className="font-medium">{selectedJob.positions ?? "N/A"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className="font-medium">{selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString() : "N/A"}</div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-white/10 bg-muted/10 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">Hiring Progress</div>
                  <div className="text-xs text-muted-foreground">Required / Filled / Remaining</div>
                </div>
                <div className="space-y-2">
                  {getHiringRoles(selectedJob).map((role) => {
                    const required = Number(role.openings) || 0
                    const filled = Number(role.filled) || 0
                    const remaining = Math.max(0, required - filled)
                    return (
                      <div key={role._id || role.roleName} className="rounded-md border border-white/10 bg-background/60 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">{role.roleName}</div>
                            {role.skills && <div className="mt-1 text-xs text-muted-foreground">{role.skills}</div>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 px-2 py-1 text-xs">{required} required</span>
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{filled} filled</span>
                            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">{remaining} remaining</span>
                            <RecruitmentStatusBadge status={role.status || (remaining === 0 ? "Closed" : "Open")} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No job selected.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {confirmType === "delete" ? "Delete Draft Job?" : "Remove Closed Job?"}
            </DialogTitle>
            <DialogDescription>
              {confirmType === "delete"
                ? "Are you sure you want to permanently delete this draft?"
                : "This action will permanently remove this closed job opening and cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
            >
              {confirmType === "delete" ? "Delete" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobOpenings
