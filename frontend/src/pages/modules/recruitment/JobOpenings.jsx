import { useEffect, useState } from "react"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BriefcaseBusiness, ClipboardList, DoorClosed, Plus, Rocket } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        title="Job Openings"
        subtitle="Create, publish, and close hiring openings across departments."
        summary={`${total} openings · ${active} published · ${draft} drafts`}
        actions={
          canWrite && (
            <Button onClick={() => {
              setEditingJobId(null);
              setFormData({ jobTitle: "", department: "", positions: "", employmentType: "", deadline: "" });
              setShowForm(true);
            }}>
              <Plus size={16} className="mr-2" />
              Create Job
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <RecruitmentKpiCard title="Total Jobs" value={total} icon={BriefcaseBusiness} trend={10} helper="Openings in workspace" accent="sky" />
        <RecruitmentKpiCard title="Published" value={active} icon={Rocket} trend={12} helper="Visible on careers portal" accent="emerald" />
        <RecruitmentKpiCard title="Draft" value={draft} icon={ClipboardList} trend={5} helper="Awaiting publication" accent="amber" />
        <RecruitmentKpiCard title="Closed" value={closed} icon={DoorClosed} trend={-2} helper="No longer accepting" accent="rose" />
      </div>

      {canWrite && showForm && (
        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editingJobId ? "Edit Job Draft" : "Create Job Draft"}</h2>
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
              <input type="text" name="jobTitle" placeholder="Job Title" value={formData.jobTitle} onChange={handleChange} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="number" name="positions" placeholder="Positions" value={formData.positions} onChange={handleChange} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Intern">Intern</option>
                <option value="Contract">Contract</option>
              </select>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit">{editingJobId ? "Update Draft" : "Save Draft"}</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingJobId(null);
                  setFormData({ jobTitle: "", department: "", positions: "", employmentType: "", deadline: "" });
                }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="dark-shimmer h-28 rounded-lg border border-white/10 bg-card/80" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <RecruitmentEmptyState
            title="No job openings yet"
            description="Create a draft job, then publish it to start collecting applications."
            actionLabel={canWrite ? "Create Job" : undefined}
            onAction={() => setShowForm(true)}
          />
        ) : jobs.map((job) => {
          const isOpen = job.status === "Open" || (job.status === "Published" && !job.deadline)
          return (
            <Card key={job._id} className="border-white/10 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">{job.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{job.department} · {job.positions} positions · {getHiringRoles(job).length} hiring role{getHiringRoles(job).length !== 1 && "s"} · {job.employmentType}</p>
                  <p className="text-sm text-muted-foreground">
                    Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RecruitmentStatusBadge status={isOpen ? "Open" : job.status} />
                  {job.status === "Draft" && (
                    <>
                      {canWrite && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(job)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(job)}>Delete</Button>
                        </>
                      )}
                      {canPublish && (
                        <Button size="sm" onClick={() => publishJob(job._id)}>Publish</Button>
                      )}
                    </>
                  )}
                  {(job.status === "Published" || job.status === "Open") && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setViewOpen(true) }}>View</Button>
                      {canPublish && (
                        <Button size="sm" variant="destructive" onClick={() => closeJob(job._id)}>Close</Button>
                      )}
                    </>
                  )}
                  {job.status === "Closed" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setViewOpen(true) }}>View</Button>
                      {canPublish && (
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveClick(job)}>Remove</Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
