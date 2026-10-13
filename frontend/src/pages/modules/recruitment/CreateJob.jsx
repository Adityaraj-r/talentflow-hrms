import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import apiClient from "@/services/apiClient"
import { toast } from "sonner"
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, Save, Globe, 
  Trash2, X, AlertCircle, Calendar as CalendarIcon, Briefcase, 
  MapPin, Building, GraduationCap, DollarSign, Eye, Loader2, ChevronDown, Check, Plus, Zap
} from "lucide-react"
import WorkflowBuilder from "@/components/recruitment/WorkflowBuilder"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api"
const DRAFT_KEY = "hr_job_draft"

const SKILL_SUGGESTIONS = [
  "React.js", "Angular", "Vue.js", "Node.js", "Java", "Spring Boot", 
  "Python", "Django", ".NET", "PHP", "Laravel", "C#", "SQL", "MongoDB", 
  "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", 
  "Azure", "GCP", "Git", "REST API", "GraphQL"
]

const TagInput = ({ tags, setTags, suggestions, placeholder, error, onChange }) => {
  const [input, setInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      if (onChange) onChange()
    }
    setInput("")
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
    if (onChange) onChange()
  }

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-2 items-center p-2 min-h-[44px] border ${error ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-300 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-purple-500/20'} rounded-xl bg-white dark:bg-slate-900 focus-within:ring-2 transition-all`}>
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(input.trim())
            }
          }}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder-slate-400 py-1 px-2"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
      
      {showSuggestions && suggestions && input && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {suggestions
            .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
            .map(s => (
              <div 
                key={s} 
                className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between group"
                onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
              >
                {s}
                <Plus size={14} className="opacity-0 group-hover:opacity-100 text-purple-500" />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default function CreateJob() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    jobTitle: "",
    jobCode: "",
    department: "",
    designation: "",
    positions: "",
    employmentType: "Full-time",
    workMode: "Remote",
    officeLocation: "",
    minExperience: "",
    maxExperience: "",
    educationRequired: "",
    minSalary: "",
    maxSalary: "",
    currency: "INR",
    aboutRole: "",
    keyResponsibilities: "",
    requiredSkills: "",
    preferredSkills: "",
    qualifications: "",
    benefitsPerks: "",
    hiringManager: "",
    recruiter: "",
    vacancyType: "New Position",
    priority: "Medium",
    replaceEmployee: "",
    replacementReason: "",
    expectedJoiningDate: "",
    deadline: "",
    internalNotes: ""
  })

  const [primarySkills, setPrimarySkills] = useState([])
  const [secondarySkills, setSecondarySkills] = useState([])
  const [customTags, setCustomTags] = useState([])

  const [uploadJd, setUploadJd] = useState(null)
  const [supportingDocuments, setSupportingDocuments] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState({})

  const [workflowStages, setWorkflowStages] = useState([])
  const [scoringFormula, setScoringFormula] = useState('weighted_average')
  const [autoProgressionEnabled, setAutoProgressionEnabled] = useState(false)

  const [hasAssignment, setHasAssignment] = useState(true)
  const [assignmentName, setAssignmentName] = useState("Technical Assignment")
  const [interviewRounds, setInterviewRounds] = useState(["Round 1 - Technical", "Round 2 - HR"])
  const [newRoundInput, setNewRoundInput] = useState("")

  const [departmentsList, setDepartmentsList] = useState([])
  const [usersList, setUsersList] = useState([])

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const [deptRes, usersRes] = await Promise.all([
          apiClient.get("/departments"),
          apiClient.get("/users")
        ])
        
        const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.data || [])
        setDepartmentsList(depts)
        
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : 
                         (Array.isArray(usersRes.data?.data) ? usersRes.data.data : 
                         (Array.isArray(usersRes.data?.users) ? usersRes.data.users : []))
        setUsersList(allUsers)
      } catch (err) {
        console.error("Failed to fetch dynamic data for dropdowns:", err)
      }
    }
    fetchDynamicData()
  }, [])

  const formatUserName = (u) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`
    if (u.firstName) return u.firstName
    return u.name || u.email || "Unknown User"
  }

  // Load Draft
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData(parsed.formData)
        setPrimarySkills(parsed.primarySkills || [])
        setSecondarySkills(parsed.secondarySkills || [])
        setCustomTags(parsed.customTags || [])
      } catch (e) {
        console.error("Draft parsing failed", e)
      }
    }
  }, [])

  // Auto-save and Unsaved Changes Warning
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, primarySkills, secondarySkills, customTags }))
        toast.success("Draft auto-saved", { position: "bottom-right", duration: 1500 })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [formData, primarySkills, secondarySkills, customTags, hasChanges])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.jobTitle) newErrors.jobTitle = "Job Title is required"
    if (!formData.department) newErrors.department = "Department is required"
    if (!formData.designation) newErrors.designation = "Designation is required"
    if (!formData.positions) newErrors.positions = "Number of openings is required"
    if (!formData.minExperience) newErrors.minExperience = "Min experience is required"
    if (!formData.deadline) newErrors.deadline = "Application deadline is required"
    if (!formData.hiringManager) newErrors.hiringManager = "Hiring Manager is required"
    if (primarySkills.length === 0) newErrors.primarySkills = "At least one primary skill is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Multi-select Tag Component (moved outside)

  const handleFileUpload = (e, setFileState) => {
    if (e.target.files && e.target.files[0]) {
      setFileState(e.target.files[0])
      setHasChanges(true)
    }
  }

  const handleSubmit = async (status = "Draft") => {
    if (status === "Published" && !validateForm()) {
      toast.error("Please fill in all required fields correctly.")
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-400')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (status === "Published") setPublishLoading(true)
    else setLoading(true)

    try {
      const payload = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "") {
          payload.append(key, formData[key])
        }
      })
      payload.append("status", status)
      
      primarySkills.forEach(skill => payload.append("primarySkills", skill))
      secondarySkills.forEach(skill => payload.append("secondarySkills", skill))
      customTags.forEach(tag => payload.append("customTags", tag))

      payload.append("hasAssignment", hasAssignment)
      payload.append("assignmentName", assignmentName)
      interviewRounds.forEach(round => payload.append("interviewRounds", round))

      if (uploadJd) payload.append("uploadJd", uploadJd)
      if (supportingDocuments) payload.append("supportingDocuments", supportingDocuments)

      const workflow = {
        stages: workflowStages,
        scoringFormula,
        autoProgressionEnabled,
      };
      payload.append("workflow", JSON.stringify(workflow))

      await apiClient.post(`/job-openings`, payload)

      localStorage.removeItem(DRAFT_KEY)
      setHasChanges(false)
      
      if (status === "Published") {
        toast.success("Job published successfully!", { icon: <CheckCircle className="text-green-500" /> })
      } else {
        toast.success("Draft saved securely.")
      }

      setTimeout(() => {
        navigate('/dashboard/job-openings')
      }, 1000)

    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
      toast.error(`Error: ${errorMsg} | Status: ${err.response?.status}`)
    } finally {
      setLoading(false)
      setPublishLoading(false)
    }
  }

  // Base input classes for UI consistency
  const inputBase = "w-full h-11 px-3 bg-white dark:bg-slate-900 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder-slate-400 shadow-sm"

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-950 p-6 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Create Job Opening</h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Create and publish a new job opening for candidates.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-6 space-y-5">
        
        {/* Basic Information */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="text-purple-500" size={20} /> Basic Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Job Title <span className="text-red-500">*</span></label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className={`${inputBase} ${errors.jobTitle ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 dark:border-slate-700'}`} placeholder="e.g. Senior React Developer" />
              {errors.jobTitle && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.jobTitle}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Job Code</label>
              <input type="text" name="jobCode" value={formData.jobCode} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} placeholder="Auto-generated if left blank" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1.5">Department <span className="text-red-500">*</span></label>
              <div className="relative">
                <Select value={formData.department} onValueChange={(val) => handleInputChange({ target: { name: 'department', value: val } })}>
                  <SelectTrigger className={`${inputBase} ${errors.department ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsList.map(d => (
                      <SelectItem key={d._id || d.id || d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.department && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Designation <span className="text-red-500">*</span></label>
              <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className={`${inputBase} ${errors.designation ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} placeholder="e.g. SDE II" />
              {errors.designation && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.designation}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Number of Openings <span className="text-red-500">*</span></label>
              <input type="number" name="positions" min="1" value={formData.positions} onChange={handleInputChange} className={`${inputBase} ${errors.positions ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} placeholder="1" />
              {errors.positions && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.positions}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Employment Type</label>
                <div className="relative">
                  <Select value={formData.employmentType} onValueChange={(val) => handleInputChange({ target: { name: 'employmentType', value: val } })}>
                    <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                      <SelectValue placeholder="Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Work Mode</label>
                <div className="relative">
                  <Select value={formData.workMode} onValueChange={(val) => handleInputChange({ target: { name: 'workMode', value: val } })}>
                    <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                      <SelectValue placeholder="Work Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="On-site">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1.5">Office Location <span className="text-red-500">*</span></label>
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><MapPin size={16} /></div>
                <input type="text" name="officeLocation" value={formData.officeLocation} onChange={handleInputChange} className={`${inputBase} pl-10 border-slate-300 dark:border-slate-700`} placeholder="e.g. San Francisco, CA or Remote" />
              </div>
            </div>
          </div>
        </section>

        {/* Experience & Compensation */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={20} /> Experience & Compensation
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Min Experience (Yrs) <span className="text-red-500">*</span></label>
              <input type="number" name="minExperience" min="0" step="0.5" value={formData.minExperience} onChange={handleInputChange} className={`${inputBase} ${errors.minExperience ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Max Experience (Yrs)</label>
              <input type="number" name="maxExperience" min="0" step="0.5" value={formData.maxExperience} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Education Required</label>
              <input type="text" name="educationRequired" value={formData.educationRequired} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} placeholder="e.g. Bachelor's in CS" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1.5">Min Salary</label>
              <input type="number" name="minSalary" value={formData.minSalary} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} placeholder="e.g. 80000" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Max Salary</label>
              <input type="number" name="maxSalary" value={formData.maxSalary} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} placeholder="e.g. 120000" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Currency</label>
              <div className="relative">
                <Select value={formData.currency} onValueChange={(val) => handleInputChange({ target: { name: 'currency', value: val } })}>
                  <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack & Skills */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building className="text-purple-500" size={20} /> Technology Stack & Skills
            </h2>
            <p className="text-sm text-slate-500 mb-2">Type a skill and press Enter to add. You can choose from suggestions or create custom tags.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Primary Skills <span className="text-red-500">*</span></label>
              <TagInput tags={primarySkills} setTags={setPrimarySkills} suggestions={SKILL_SUGGESTIONS} placeholder="e.g. React, Node.js" error={errors.primarySkills} onChange={() => setHasChanges(true)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Secondary Skills</label>
              <TagInput tags={secondarySkills} setTags={setSecondarySkills} suggestions={SKILL_SUGGESTIONS} placeholder="e.g. Docker, AWS" onChange={() => setHasChanges(true)} />
            </div>
            <div className="lg:col-span-2 max-w-2xl">
              <label className="block text-sm font-semibold mb-1.5">Custom Tags</label>
              <TagInput tags={customTags} setTags={setCustomTags} suggestions={[]} placeholder="Add custom tags..." onChange={() => setHasChanges(true)} />
            </div>
          </div>
        </section>

        {/* Job Description (Pseudo-Rich Text) */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="text-primary" size={20} /> Job Description
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-6">
            {[
              { name: "aboutRole", label: "About the Role", rows: 3, placeholder: "Describe the role and its impact..." },
              { name: "keyResponsibilities", label: "Key Responsibilities", rows: 3, placeholder: "- Write scalable code\n- Mentor junior developers..." },
              { name: "benefitsPerks", label: "Benefits & Perks", rows: 3, placeholder: "Health insurance, remote work options..." },
            ].map(field => (
              <div key={field.name} className={field.name === "keyResponsibilities" ? "lg:row-span-2" : ""}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold">{field.label}</label>
                  <span className="text-xs text-slate-400 font-medium">{formData[field.name].length} chars</span>
                </div>
                <textarea
                  name={field.name}
                  rows={field.rows}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y shadow-sm"
                ></textarea>
              </div>
            ))}
          </div>
        </section>

        {/* Hiring Details */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon className="text-pink-500" size={20} /> Hiring Details
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Hiring Manager <span className="text-red-500">*</span></label>
              <div className="relative">
                <Select required value={formData.hiringManager} onValueChange={(val) => handleInputChange({ target: { name: 'hiringManager', value: val } })}>
                  <SelectTrigger className={`${inputBase} ${errors.hiringManager ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}>
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList
                      .filter(u => u.role && u.role.toUpperCase().includes("MANAGER"))
                      .map(u => (
                      <SelectItem key={u._id} value={formatUserName(u)}>{formatUserName(u)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Recruiter</label>
              <div className="relative">
                <Select value={formData.recruiter} onValueChange={(val) => handleInputChange({ target: { name: 'recruiter', value: val } })}>
                  <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                    <SelectValue placeholder="Select Recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList
                      .filter(u => u.role && u.role.toUpperCase().includes("HR"))
                      .map(u => (
                      <SelectItem key={u._id} value={formatUserName(u)}>{formatUserName(u)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1.5">Priority</label>
              <div className="relative">
                <Select value={formData.priority} onValueChange={(val) => handleInputChange({ target: { name: 'priority', value: val } })}>
                  <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Vacancy Type</label>
              <div className="relative">
                <Select value={formData.vacancyType} onValueChange={(val) => handleInputChange({ target: { name: 'vacancyType', value: val } })}>
                  <SelectTrigger className={`${inputBase} border-slate-300 dark:border-slate-700`}>
                    <SelectValue placeholder="Vacancy Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Position">New Position</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditional Replacement Fields */}
          {formData.vacancyType === "Replacement" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl mb-6">
              <div>
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1.5">Replacing Employee</label>
                <input type="text" name="replaceEmployee" value={formData.replaceEmployee} onChange={handleInputChange} className={`${inputBase} border-amber-300 dark:border-amber-700`} placeholder="Name of employee leaving" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1.5">Replacement Reason</label>
                <input type="text" name="replacementReason" value={formData.replacementReason} onChange={handleInputChange} className={`${inputBase} border-amber-300 dark:border-amber-700`} placeholder="Resignation, Termination, Transfer..." />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Application Deadline <span className="text-red-500">*</span></label>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className={`${inputBase} ${errors.deadline ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Expected Joining Date</label>
              <input type="date" name="expectedJoiningDate" value={formData.expectedJoiningDate} onChange={handleInputChange} className={`${inputBase} border-slate-300 dark:border-slate-700`} />
            </div>
          </div>
        </section>

        {/* Post-Hiring Process & Interview Rounds Setup */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="text-purple-500" size={20} /> Post-Hiring & Interview Process Setup
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure whether candidates need a practical assignment and set up the interview rounds for this job.</p>
          </div>

          <div className="space-y-6">
            {/* Assignment Setup */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAssignment}
                      onChange={(e) => setHasAssignment(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-purple-500"
                    />
                    Requires Practical Assignment / Assessment Task
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-6">
                    Candidates must clear this assignment before final interview selection.
                  </p>
                </div>
              </div>

              {hasAssignment && (
                <div className="pl-6 pt-2">
                  <label className="block text-xs font-semibold mb-1">Assignment Title / Name</label>
                  <input
                    type="text"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="e.g. Frontend Coding Challenge or Case Study"
                    className="max-w-md h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            {/* Interview Rounds Setup */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Interview Rounds for this Role</label>
              <div className="flex flex-wrap gap-2 items-center min-h-[44px] p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                {interviewRounds.map((round, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-primary text-xs font-semibold rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-xs">
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full">{idx + 1}</span>
                    {round}
                    <button type="button" onClick={() => setInterviewRounds(interviewRounds.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 ml-1">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoundInput}
                  onChange={(e) => setNewRoundInput(e.target.value)}
                  placeholder="Type new round name (e.g. System Design Round)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newRoundInput.trim()) {
                        setInterviewRounds([...interviewRounds, newRoundInput.trim()])
                        setNewRoundInput("")
                      }
                    }
                  }}
                  className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRoundInput.trim()) {
                      setInterviewRounds([...interviewRounds, newRoundInput.trim()])
                      setNewRoundInput("")
                    }
                  }}
                  className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  + Add Round
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-400 mr-1">Quick Add:</span>
                {["Round 1 - Technical", "Round 2 - Live Coding", "Round 3 - System Design", "HR Final Round"].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!interviewRounds.includes(preset)) {
                        setInterviewRounds([...interviewRounds, preset])
                      }
                    }}
                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Attachments & Notes */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UploadCloud className="text-teal-500" size={20} /> Attachments & Notes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Job Description (PDF)</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors min-h-[100px]">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, setUploadJd)} />
                  {uploadJd ? (
                    <div className="flex flex-col items-center">
                      <FileText className="text-purple-500 mb-2" size={24} />
                      <p className="text-sm font-semibold truncate max-w-[150px]">{uploadJd.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="text-slate-400 mb-2" size={24} />
                      <p className="text-sm font-medium text-primary">Browse Files</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Supporting Documents</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors min-h-[100px]">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.zip" onChange={(e) => handleFileUpload(e, setSupportingDocuments)} />
                  {supportingDocuments ? (
                    <div className="flex flex-col items-center">
                      <FileText className="text-purple-500 mb-2" size={24} />
                      <p className="text-sm font-semibold truncate max-w-[150px]">{supportingDocuments.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="text-slate-400 mb-2" size={24} />
                      <p className="text-sm font-medium text-primary">Browse Files</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-1.5">Internal HR Notes</label>
              <p className="text-xs text-slate-500 mb-2">Visible only to HR/Admin. Use this for budget tracking or approval notes.</p>
              <textarea
                name="internalNotes"
                rows={5}
                value={formData.internalNotes}
                onChange={handleInputChange}
                placeholder="Type your private notes here..."
                className="w-full p-4 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none shadow-sm"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Hiring Workflow Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Hiring Workflow Configuration
          </h2>
          <p className="text-sm text-slate-500">Configure the hiring pipeline for this job role. Select a template or build a custom workflow.</p>
          <WorkflowBuilder
            stages={workflowStages}
            scoringFormula={scoringFormula}
            autoProgressionEnabled={autoProgressionEnabled}
            onChange={({ stages, scoringFormula: sf, autoProgressionEnabled: ap }) => {
              setWorkflowStages(stages)
              if (sf !== undefined) setScoringFormula(sf)
              if (ap !== undefined) setAutoProgressionEnabled(ap)
              setHasChanges(true)
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            className="w-full md:w-auto px-6 h-11 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            onClick={() => navigate('/dashboard/job-openings')}
          >
            Cancel
          </button>
          <div className="flex w-full md:w-auto items-center gap-4">

            <button 
              type="button"
              className="flex-1 md:flex-none px-8 h-11 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              onClick={() => handleSubmit("Published")}
              disabled={loading || publishLoading}
            >
              {publishLoading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
              Publish Job
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
