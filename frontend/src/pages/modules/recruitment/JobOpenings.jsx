import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { BriefcaseBusiness, ClipboardList, DoorClosed, Plus, Rocket, Search, RefreshCw, Eye, Pencil, Trash2, Archive, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  RecruitmentEmptyState,
  RecruitmentKpiCard,
  RecruitmentPageHeader,
  RecruitmentStatusBadge,
} from "@/components/recruitment/RecruitmentUI"
import { DataTable } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    description: "",
    experience: "",
    skills: "",
    minSalary: "",
    maxSalary: "",
  })

  const [editingJobId, setEditingJobId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState("")
  const [jobToActOn, setJobToActOn] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedDept, setSelectedDept] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

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
    try {
      setLoading(true)
      const response = await apiClient.get("/jobs")
      setJobs(Array.isArray(response?.data?.data) ? response.data.data : response?.data || response || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load jobs list")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const publishJob = async (id) => {
    try {
      await apiClient.put(`/jobs/${id}/publish`)
      toast.success("Job opening published successfully!")
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to publish job opening")
    }
  }

  const closeJob = async (id) => {
    try {
      await apiClient.put(`/jobs/${id}/close`)
      toast.success("Job opening marked as Closed")
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to close job opening")
    }
  }

  const deleteJob = async (id) => {
    try {
      await apiClient.delete(`/jobs/${id}`)
      toast.success("Job opening deleted successfully")
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete job")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      jobTitle: formData.jobTitle,
      department: formData.department,
      positions: Number(formData.positions),
      employmentType: formData.employmentType,
      deadline: formData.deadline || undefined,
      description: formData.description,
      hiringRoles: [{
        roleName: formData.jobTitle,
        openings: Number(formData.positions),
        minSalary: formData.minSalary ? Number(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? Number(formData.maxSalary) : undefined,
        experience: formData.experience,
        skills: formData.skills,
      }],
    }

    try {
      if (editingJobId) {
        await apiClient.put(`/job-openings/${editingJobId}`, payload)
        toast.success("Job updated successfully")
      } else {
        await apiClient.post("/job-openings", {
          ...payload,
          status: "Draft",
        })
        toast.success("Job draft created successfully")
      }
      setShowForm(false)
      setEditingJobId(null)
      setFormData({
        jobTitle: "",
        department: "",
        positions: "",
        employmentType: "",
        deadline: "",
        description: "",
        experience: "",
        skills: "",
        minSalary: "",
        maxSalary: "",
      })
      fetchJobs()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to save job")
    }
  }

  const handleEditClick = (job) => {
    const roles = getHiringRoles(job)
    const firstRole = roles[0] || {}
    setEditingJobId(job._id)
    setFormData({
      jobTitle: job.jobTitle || "",
      department: job.department || "",
      positions: job.positions ? job.positions.toString() : "",
      employmentType: job.employmentType || "",
      deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
      description: job.description || "",
      experience: firstRole.experience || "",
      skills: firstRole.skills || "",
      minSalary: firstRole.minSalary ? firstRole.minSalary.toString() : "",
      maxSalary: firstRole.maxSalary ? firstRole.maxSalary.toString() : "",
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
  const publishedCount = jobs.filter((j) => j.status === "Published").length
  const openCount = jobs.filter((j) => j.status === "Open").length
  const active = jobs.filter((j) => j.status === "Published" || j.status === "Open").length
  const draft = jobs.filter((j) => j.status === "Draft").length
  const closed = jobs.filter((j) => j.status === "Closed").length

  const rolesOptions = useMemo(() => [...new Set(jobs.map(j => j.jobTitle).filter(Boolean))].sort(), [jobs])
  const deptsOptions = useMemo(() => [...new Set(jobs.map(j => j.department).filter(Boolean))].sort(), [jobs])
  const locationsOptions = useMemo(() => [...new Set(jobs.map(j => j.officeLocation || "On-site").filter(Boolean))].sort(), [jobs])

  const handleKpiCardClick = (filterKey) => {
    setActiveFilter(filterKey)
    if (filterKey === "published") setSelectedStatus("Published")
    else if (filterKey === "open") setSelectedStatus("Open")
    else if (filterKey === "draft") setSelectedStatus("Draft")
    else if (filterKey === "closed") setSelectedStatus("Closed")
    else setSelectedStatus("all")
  }

  const handleStatusChange = (statusVal) => {
    setSelectedStatus(statusVal)
    if (statusVal === "Published") setActiveFilter("published")
    else if (statusVal === "Open") setActiveFilter("open")
    else if (statusVal === "Draft") setActiveFilter("draft")
    else if (statusVal === "Closed") setActiveFilter("closed")
    else setActiveFilter("all")
  }

  const filteredJobs = jobs.filter((job) => {
    let matchesStatus = true
    if (selectedStatus !== "all") {
      matchesStatus = (job.status || "").toLowerCase() === selectedStatus.toLowerCase()
    }
    
    let matchesSearch = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      matchesSearch = (job.jobTitle?.toLowerCase().includes(q) || job.department?.toLowerCase().includes(q) || (job.jobCode && job.jobCode.toLowerCase().includes(q)))
    }

    let matchesRole = true
    if (selectedRole !== "all") {
      matchesRole = job.jobTitle === selectedRole
    }

    let matchesDept = true
    if (selectedDept !== "all") {
      matchesDept = job.department === selectedDept
    }

    let matchesLocation = true
    if (selectedLocation !== "all") {
      matchesLocation = (job.officeLocation || "On-site") === selectedLocation
    }
    
    return matchesStatus && matchesSearch && matchesRole && matchesDept && matchesLocation
  })

  const columns = useMemo(() => [
    {
      accessorKey: "jobCode",
      header: "Job ID",
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {job.jobCode || `JOB-${job._id?.slice(-4)}`}
          </div>
        )
      }
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      cell: ({ row }) => {
        const job = row.original
        return (
          <button
            onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
            className="font-medium hover:underline text-left cursor-pointer transition"
          >
            {job.jobTitle}
          </button>
        )
      }
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.original.department}</span>
    },
    {
      accessorKey: "positions",
      header: "Positions",
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.original.positions}</span>
    },
    {
      accessorKey: "employmentType",
      header: "Type",
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.original.employmentType}</span>
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.original.deadline ? new Date(row.original.deadline).toLocaleDateString() : "N/A"}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const job = row.original
        const isOpen = job.status === "Open" || (job.status === "Published" && !job.deadline)
        return <RecruitmentStatusBadge status={isOpen ? "Open" : job.status} />
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right w-[140px] ml-auto">Actions</div>,
      cell: ({ row }) => {
        const job = row.original
        
        // View Button Logic
        const canView = job.status !== "Draft"
        const viewTooltip = canView ? "View Job" : "Drafts cannot be viewed"

        // Close (Archive) Button Logic
        const canClose = (job.status === "Published" || job.status === "Open") && canPublish
        let closeTooltip = "Close Job"
        if (!canPublish) closeTooltip = "No permission to close jobs"
        else if (job.status === "Closed") closeTooltip = "Job is already closed"
        else if (job.status === "Draft") closeTooltip = "Cannot close a draft"

        // Delete Button Logic
        const canDelete = (job.status === "Draft" && canWrite) || (job.status !== "Draft" && canPublish)
        let deleteTooltip = "Delete Job & Related Data"
        if (job.status === "Draft" && !canWrite) deleteTooltip = "No permission to delete drafts"
        else if (job.status !== "Draft" && !canPublish) deleteTooltip = "No permission to delete jobs"

        return (
          <div className="w-[140px] ml-auto">
            <TooltipProvider>
              <div className="flex items-center justify-end gap-1">
                
                {/* View Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                        onClick={() => { setSelectedJob(job); setViewOpen(true) }}
                        disabled={!canView}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{viewTooltip}</TooltipContent>
                </Tooltip>

                {/* Close (Archive) Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" 
                        onClick={() => closeJob(job._id)}
                        disabled={!canClose}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{closeTooltip}</TooltipContent>
                </Tooltip>

                {/* Delete Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDeleteClick(job)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{deleteTooltip}</TooltipContent>
                </Tooltip>

              </div>
            </TooltipProvider>
          </div>
        )
      }
    }
  ], [canWrite, canPublish, navigate, handleEditClick, handleDeleteClick, publishJob, setSelectedJob, setViewOpen, closeJob])

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Job Openings</h1>
        </div>
        {canWrite && (
          <Button onClick={() => navigate("/dashboard/jobs/create")}>
            <Plus size={16} className="mr-2" />
            Create Job
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <RecruitmentKpiCard title="Total Jobs" value={total} icon={BriefcaseBusiness} trend={10} helper="Openings in workspace" accent="sky" active={activeFilter === "all"} onClick={() => handleKpiCardClick("all")} />
        <RecruitmentKpiCard title="Published" value={active} icon={Rocket} trend={12} helper="Visible on careers portal" accent="emerald" active={activeFilter === "published"} onClick={() => handleKpiCardClick("published")} />
        <RecruitmentKpiCard title="Draft" value={draft} icon={ClipboardList} trend={5} helper="Awaiting publication" accent="amber" active={activeFilter === "draft"} onClick={() => handleKpiCardClick("draft")} />
        <RecruitmentKpiCard title="Closed" value={closed} icon={DoorClosed} trend={-2} helper="No longer accepting" accent="rose" active={activeFilter === "closed"} onClick={() => handleKpiCardClick("closed")} />
      </div>


      {canWrite && showForm && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {editingJobId ? "Edit Job Details" : "Create Job Opening"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Basic details */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positions">Positions <span className="text-destructive">*</span></Label>
                  <Input
                    id="positions"
                    name="positions"
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={formData.positions}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Type, Deadline, Experience */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type <span className="text-destructive">*</span></Label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Intern">Intern</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Required Experience</Label>
                  <Input
                    id="experience"
                    name="experience"
                    placeholder="e.g. 3-5 years"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 3: Salary range */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minSalary">Minimum Salary</Label>
                  <Input
                    id="minSalary"
                    name="minSalary"
                    type="number"
                    placeholder="e.g. 50000"
                    value={formData.minSalary}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSalary">Maximum Salary</Label>
                  <Input
                    id="maxSalary"
                    name="maxSalary"
                    type="number"
                    placeholder="e.g. 80000"
                    value={formData.maxSalary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 4: Description & Skills */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Provide a comprehensive job description..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Key Skills & Requirements</Label>
                  <Textarea
                    id="skills"
                    name="skills"
                    rows={4}
                    placeholder="e.g. React, TypeScript, Node.js, Mongoose (comma-separated or bullet points)"
                    value={formData.skills}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit">
                  {editingJobId ? "Update Job Draft" : "Save Job Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingJobId(null);
                    setFormData({
                      jobTitle: "",
                      department: "",
                      positions: "",
                      employmentType: "",
                      deadline: "",
                      description: "",
                      experience: "",
                      skills: "",
                      minSalary: "",
                      maxSalary: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      <Card className="rounded-xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-slate-950/70 shadow-lg shadow-black/5 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-60 h-10">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <Input
                placeholder="Search jobs..."
                className="pl-9 h-10 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs font-semibold rounded-lg w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto min-w-[130px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto min-w-[130px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {rolesOptions.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto min-w-[130px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {deptsOptions.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer w-full sm:w-auto min-w-[130px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationsOptions.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading} className="border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 text-slate-900 dark:text-slate-100 cursor-pointer w-full lg:w-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto p-4 md:p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-10 w-full animate-pulse rounded bg-muted/50" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8">
                <RecruitmentEmptyState
                  title={activeFilter === "all" ? "No job openings yet" : `No ${activeFilter} job openings`}
                  description="Create a draft job, then publish it to start collecting applications."
                  actionLabel={canWrite ? "Create Job" : undefined}
                  onAction={() => setShowForm(true)}
                />
              </div>
            ) : (
              <DataTable columns={columns} data={filteredJobs} searchable={false} defaultPageSize={10} />
            )}
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

              {/* Extra details (Experience, Salary) from first hiring role */}
              {(() => {
                const firstRole = getHiringRoles(selectedJob)[0] || {};
                return (
                  <>
                    {firstRole.experience && (
                      <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                        <div className="text-xs text-muted-foreground">Experience Required</div>
                        <div className="font-medium">{firstRole.experience}</div>
                      </div>
                    )}
                    {(firstRole.minSalary || firstRole.maxSalary) && (
                      <div className="rounded-lg border border-white/10 bg-muted/10 p-3">
                        <div className="text-xs text-muted-foreground">Salary Range</div>
                        <div className="font-medium text-emerald-400">
                          {firstRole.minSalary ? `${firstRole.minSalary.toLocaleString()}` : "N/A"} - {firstRole.maxSalary ? `${firstRole.maxSalary.toLocaleString()}` : "N/A"}
                        </div>
                      </div>
                    )}
                    {selectedJob.description && (
                      <div className="md:col-span-2 rounded-lg border border-white/10 bg-muted/10 p-3">
                        <div className="text-xs text-muted-foreground mb-1">Job Description</div>
                        <div className="text-sm text-foreground whitespace-pre-wrap">{selectedJob.description}</div>
                      </div>
                    )}
                    {firstRole.skills && (
                      <div className="md:col-span-2 rounded-lg border border-white/10 bg-muted/10 p-3">
                        <div className="text-xs text-muted-foreground mb-1">Key Skills & Requirements</div>
                        <div className="text-sm text-foreground whitespace-pre-wrap">{firstRole.skills}</div>
                      </div>
                    )}
                  </>
                );
              })()}

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

