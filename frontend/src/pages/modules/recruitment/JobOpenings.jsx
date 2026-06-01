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
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canPublish = user?.can?.("recruitment", "write") && role === "HR_MANAGER"
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

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get("/job-openings")
      setJobs(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load job openings")
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
      await apiClient.post("/job-openings", {
        jobTitle: formData.jobTitle,
        department: formData.department,
        positions: Number(formData.positions),
        employmentType: formData.employmentType,
        deadline: formData.deadline,
        status: "Draft",
      })
      setShowForm(false)
      setFormData({ jobTitle: "", department: "", positions: "", employmentType: "", deadline: "" })
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to create job")
    }
  }

  const publishJob = async (id) => {
    try {
      await apiClient.put(`/job-openings/${id}/publish`)
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to publish job")
    }
  }

  const closeJob = async (id) => {
    try {
      await apiClient.put(`/job-openings/${id}/close`)
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to close job")
    }
  }

  const total = jobs.length
  const active = jobs.filter((j) => j.status === "Published").length
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
            <Button onClick={() => setShowForm(true)}>
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
            <h2 className="text-lg font-semibold">Create Job Draft</h2>
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
                <Button type="submit">Save Draft</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
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
        ) : jobs.map((job) => (
          <Card key={job._id} className="border-white/10 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{job.jobTitle}</h3>
                <p className="text-sm text-muted-foreground">{job.department} · {job.positions} positions · {job.employmentType}</p>
                <p className="text-sm text-muted-foreground">
                  Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RecruitmentStatusBadge status={job.status} />
                <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setViewOpen(true) }}>View</Button>
                {canPublish && job.status === "Draft" && <Button size="sm" onClick={() => publishJob(job._id)}>Publish</Button>}
                {canPublish && job.status === "Published" && <Button size="sm" variant="destructive" onClick={() => closeJob(job._id)}>Close</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setSelectedJob(null) }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{selectedJob?.jobTitle || "Job"}</span>
              <RecruitmentStatusBadge status={selectedJob?.status} />
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
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No job selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobOpenings
