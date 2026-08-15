import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building,
  Calendar,
  Briefcase,
  Users,
  MapPin,
  CircleDollarSign,
  Rocket,
  Archive,
  Trash2,
  Edit3,
  CheckCircle,
  FileText,
  FileCheck
} from "lucide-react"
import { RecruitmentStatusBadge } from "@/components/recruitment/RecruitmentUI"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = ["HR_OFFICER", "HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canPublish = user?.can?.("recruitment", "write") && ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
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
    workMode: "On-site",
    officeLocation: "",
    aboutRole: "",
    keyResponsibilities: "",
    requiredSkills: "",
    qualifications: "",
    benefitsPerks: "",
    hiringManager: "",
    recruiter: "",
  })

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/jobs/${id}`)
      const data = response?.data?.data || response?.data || response
      setJob(data)
      
      // Populate edit form data
      setFormData({
        jobTitle: data.jobTitle || "",
        department: data.department || "",
        positions: data.positions || "",
        employmentType: data.employmentType || "",
        deadline: data.deadline ? data.deadline.slice(0, 10) : "",
        description: data.description || "",
        experience: data.experience || "",
        skills: data.skills || "",
        minSalary: data.minSalary || "",
        maxSalary: data.maxSalary || "",
        workMode: data.workMode || "On-site",
        officeLocation: data.officeLocation || "",
        aboutRole: data.aboutRole || "",
        keyResponsibilities: data.keyResponsibilities || "",
        requiredSkills: data.requiredSkills || "",
        qualifications: data.qualifications || "",
        benefitsPerks: data.benefitsPerks || "",
        hiringManager: data.hiringManager || "",
        recruiter: data.recruiter || "",
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load job details")
      navigate("/dashboard/job-openings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchJobDetails()
    }
  }, [id])

  const handleAction = async (actionType) => {
    try {
      if (actionType === "publish") {
        await apiClient.put(`/jobs/${id}/publish`)
        toast.success("Job opening published successfully!")
      } else if (actionType === "close") {
        await apiClient.put(`/jobs/${id}/close`)
        toast.success("Job opening marked as Closed")
      } else if (actionType === "delete") {
        await apiClient.delete(`/jobs/${id}`)
        toast.success("Job opening deleted successfully")
        navigate("/dashboard/job-openings")
        return
      }
      fetchJobDetails()
    } catch (error) {
      toast.error(error?.response?.data?.message || `Action failed`)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await apiClient.put(`/jobs/${id}`, formData)
      toast.success("Job details updated successfully!")
      setShowEditForm(false)
      fetchJobDetails()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update job details")
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-800 dark:border-t-cyan-400"></div>
        <p className="text-sm font-semibold text-slate-500">Loading job specifications...</p>
      </div>
    )
  }

  if (!job) return null

  const isOpen = job.status === "Open" || (job.status === "Published" && !job.deadline)

  return (
    <div className="space-y-6 max-w-full pb-10">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/80 dark:border-white/10 p-5 rounded-xl">
        <div className="space-y-1.5">
          <button
            onClick={() => navigate("/dashboard/job-openings")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Job list
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">{job.jobTitle}</h1>
            <RecruitmentStatusBadge status={isOpen ? "Open" : job.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">Job Code: {job.jobCode}</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && !showEditForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Edit details
            </Button>
          )}

          {job.status === "Draft" && canPublish && (
            <Button
              size="sm"
              onClick={() => handleAction("publish")}
              className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white cursor-pointer"
            >
              <Rocket className="mr-2 h-4 w-4" /> Publish Opening
            </Button>
          )}

          {(job.status === "Published" || job.status === "Open") && canPublish && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("close")}
              className="border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:text-white cursor-pointer"
            >
              <Archive className="mr-2 h-4 w-4 text-amber-500" /> Close Opening
            </Button>
          )}

          {job.status === "Draft" && canWrite && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this job draft?")) {
                  handleAction("delete")
                }
              }}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
            </Button>
          )}

          {job.status === "Closed" && canWrite && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to remove this closed job opening?")) {
                  handleAction("delete")
                }
              }}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove Job
            </Button>
          )}
        </div>
      </div>

      {showEditForm ? (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Job Information</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditForm(false)} className="cursor-pointer">Cancel</Button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleFormChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" value={formData.department} onChange={handleFormChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positions">Positions</Label>
                  <Input id="positions" name="positions" type="number" min="1" value={formData.positions} onChange={handleFormChange} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select required value={formData.employmentType} onValueChange={(val) => handleFormChange({ target: { name: 'employmentType', value: val } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workMode">Work Mode</Label>
                  <Select required value={formData.workMode} onValueChange={(val) => handleFormChange({ target: { name: 'workMode', value: val } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Work Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeLocation">Office Location</Label>
                  <Input id="officeLocation" name="officeLocation" value={formData.officeLocation} onChange={handleFormChange} placeholder="e.g. London, UK" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="experience">Required Experience</Label>
                  <Input id="experience" name="experience" value={formData.experience} onChange={handleFormChange} placeholder="e.g. 3-5 years" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSalary">Min Salary</Label>
                  <Input id="minSalary" name="minSalary" type="number" value={formData.minSalary} onChange={handleFormChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSalary">Max Salary</Label>
                  <Input id="maxSalary" name="maxSalary" type="number" value={formData.maxSalary} onChange={handleFormChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hiringManager">Hiring Manager</Label>
                  <Input id="hiringManager" name="hiringManager" value={formData.hiringManager} onChange={handleFormChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recruiter">Assigned Recruiter</Label>
                  <Input id="recruiter" name="recruiter" value={formData.recruiter} onChange={handleFormChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutRole">About the Role / Description</Label>
                <Textarea id="aboutRole" name="aboutRole" rows={3} value={formData.aboutRole || formData.description} onChange={handleFormChange} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyResponsibilities">Key Responsibilities</Label>
                  <Textarea id="keyResponsibilities" name="keyResponsibilities" rows={4} value={formData.keyResponsibilities} onChange={handleFormChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredSkills">Required Skills</Label>
                  <Textarea id="requiredSkills" name="requiredSkills" rows={4} value={formData.requiredSkills || formData.skills} onChange={handleFormChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Textarea id="qualifications" name="qualifications" rows={3} value={formData.qualifications} onChange={handleFormChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benefitsPerks">Benefits & Perks</Label>
                  <Textarea id="benefitsPerks" name="benefitsPerks" rows={3} value={formData.benefitsPerks} onChange={handleFormChange} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="cursor-pointer">Update Specifications</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditForm(false)} className="cursor-pointer">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Job Details panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    About the Role
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                    {job.aboutRole || job.description || "No job description provided."}
                  </p>
                </div>

                {job.keyResponsibilities && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-3">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Key Responsibilities
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                      {job.keyResponsibilities}
                    </p>
                  </div>
                )}

                {(job.requiredSkills || job.skills) && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Required Skills & Qualifications
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                      {job.requiredSkills || job.skills}
                    </p>
                  </div>
                )}

                {job.benefitsPerks && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Benefits & Perks
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                      {job.benefitsPerks}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Hiring Roles Grid breakdown if multiple roles are linked */}
            {Array.isArray(job.hiringRoles) && job.hiringRoles.length > 0 && (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Hiring Roles Details</h2>
                <div className="overflow-x-auto">
                  <DataTable
                    columns={[
                      { accessorKey: "roleName", header: "Role Name", cell: ({ row }) => <span className="font-semibold">{row.original.roleName}</span> },
                      { accessorKey: "openings", header: "Openings" },
                      { accessorKey: "filled", header: "Filled" },
                      {
                        id: "targetRange",
                        header: () => <div className="text-right">Target Range</div>,
                        cell: ({ row }) => {
                          const r = row.original;
                          return <div className="text-right font-semibold">{r.minSalary && r.maxSalary ? `$${r.minSalary} - $${r.maxSalary}` : "N/A"}</div>
                        }
                      }
                    ]}
                    data={job.hiringRoles}
                    searchable={false}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Quick Specifications Right sidebar */}
          <div className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Quick Specifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.department}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Location & Mode</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.officeLocation || "Head Office"} ({job.workMode || "On-site"})</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Job Category / Type</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.employmentType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Open Positions</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.positions} vacancies</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CircleDollarSign className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Salary Package Target</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {job.minSalary && job.maxSalary ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}` : "Not declared"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Application Deadline</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline set"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Staffing ownership details */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Staffing Ownership</h2>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase block mb-0.5 text-[10px]">Hiring Manager</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.hiringManager || "Not assigned"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase block mb-0.5 text-[10px]">Staffing Recruiter</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.recruiter || "Not assigned"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail
