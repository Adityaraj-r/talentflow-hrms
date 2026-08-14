import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { 
  Briefcase, Building, Clock, MapPin, ArrowLeft, 
  UploadCloud, FileText, CheckCircle, Share2, 
  Users, Calendar, ChevronDown, ChevronUp,
  User, Mail, Phone, Map, BookOpen, Search, Link, Github,
  HelpCircle, Trash2, Sparkles, UserCheck
} from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api"



const ApplyJob = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const roleId = searchParams.get("roleId") || ""
  const referralToken = searchParams.get("referralToken") || ""
  const navigate = useNavigate()

  const [referredByInfo, setReferredByInfo] = useState(null)

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    d.setHours(23, 59, 59, 999);
    return new Date() > d;
  };

  const [job, setJob] = useState(null)
  const [loadingJob, setLoadingJob] = useState(true)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentLocation: "",
    yearsOfExperience: "",
    currentCompany: "",
    currentDesignation: "",
    highestEducation: "",
    noticePeriod: "",
    employmentTypePreference: "Full-time",
    currentCtc: "",
    expectedCtc: "",
    linkedin: "",
    portfolio: "",
    githubProfile: "",
    coverLetter: ""
  })

  const [phoneError, setPhoneError] = useState("")
  
  // Files and Consents
  const [resume, setResume] = useState(null)
  const [additionalDocuments, setAdditionalDocuments] = useState(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [termsConsent, setTermsConsent] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState(null)
  const [error, setError] = useState("")

  const [resumeDragActive, setResumeDragActive] = useState(false)
  const [addDocDragActive, setAddDocDragActive] = useState(false)
  const resumeInputRef = useRef(null)
  const addDocInputRef = useRef(null)

  const selectedRole = job?.hiringRoles?.find((role) => String(role._id) === String(roleId)) || null
  const DRAFT_KEY = `job_app_draft_${id}_${roleId}`

  useEffect(() => {
    // Verify Referral Token if present
    if (referralToken) {
      axios.get(`${API_BASE}/referrals/verify-token?token=${referralToken}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      })
        .then(res => {
          if (res.data?.success && res.data?.data) {
            const refData = res.data.data;
            setReferredByInfo(refData.referredBy);
            setFormData(prev => ({
              ...prev,
              name: prev.name || refData.candidateName || "",
              email: prev.email || refData.candidateEmail || "",
              phone: prev.phone || refData.candidatePhone || ""
            }));
          }
        })
        .catch(err => {
          console.warn("Referral token verification warning:", err.response?.data?.error);
        });
    }

    // Load Draft
    const draft = localStorage.getItem(DRAFT_KEY)
    if(draft) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(draft) }))
      } catch(e) { console.error("Could not load draft") }
    }

    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/job-openings/published`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        })
        const foundJob = res.data.find(j => j._id === id || j.id === id)
        if (foundJob) {
          setJob(foundJob)
        } else {
          setError("Job not found.")
        }
      } catch (err) {
        setError("Failed to load job details.")
      } finally {
        setLoadingJob(false)
      }
    }
    fetchJob()
  }, [id, roleId, referralToken, DRAFT_KEY])

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
    }, 1000)
    return () => clearTimeout(timer)
  }, [formData, DRAFT_KEY])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === "phone") {
      const val = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, phone: val }))
      if (val && !/^[6-9]/.test(val)) {
        setPhoneError("Phone number must start with 6, 7, 8, or 9.")
      } else if (val.length > 0 && val.length < 10) {
        setPhoneError("Phone number must be exactly 10 digits.")
      } else {
        setPhoneError("")
      }
    }
  }

  // File Handlers
  const handleDrag = (e, setDragActive) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e, setDragActive, setFileState) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], setFileState);
    }
  };

  const handleChangeFile = (e, setFileState) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], setFileState);
    }
  };

  const handleFile = (file, setFileState) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (file && validTypes.includes(file.type)) {
      if(file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.")
      } else {
        setFileState(file)
        setError("")
      }
    } else {
      setError("Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (job?.deadline && isDeadlinePassed(job.deadline)) {
      setError("Applications for this position are closed.");
      return;
    }

    if (!resume) {
      setError("Please upload your resume before submitting the application.")
      return;
    }

    if (!privacyConsent || !termsConsent) {
      setError("You must agree to the Privacy Policy and Terms & Conditions.")
      return;
    }

    try {
      setLoading(true)

      const formPayload = new FormData()
      formPayload.append("jobId", id)
      formPayload.append("hiringRoleId", roleId)
      if (referralToken) {
        formPayload.append("referralToken", referralToken)
      }
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key])
      })

      // Append files
      formPayload.append("resume", resume)
      if (additionalDocuments) {
        formPayload.append("additionalDocuments", additionalDocuments)
      }

      const res = await axios.post(
        `${API_BASE}/applications/apply`,
        formPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "ngrok-skip-browser-warning": "true"
          }
        }
      )

      const created = res.data
      setApplicationId(created?._id || created?.id || null)
      setSuccess(true)
      localStorage.removeItem(DRAFT_KEY) // Clear draft on success
      window.scrollTo(0, 0)

    } catch (error) {
      setError(error.response?.data?.message || "Could not submit your application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Navbar / Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/careers')}
            className="flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Careers
          </button>
          <div className="text-sm font-medium text-slate-500 hidden md:block">
            {job?.jobTitle} Application
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 md:mt-12">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
          
          {/* Left Column: Job Details (55%) */}
          <div className="lg:w-[55%]">
            {referredByInfo && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:to-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-slate-800 dark:text-slate-200 flex items-center gap-3 shadow-sm">
                <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div className="text-xs md:text-sm font-medium">
                  <span className="font-bold text-slate-900 dark:text-white">Referred Opportunity:</span> You were referred for this position by <strong className="underline text-cyan-700 dark:text-cyan-300">{referredByInfo.name}</strong>. Referral credit will be automatically attached upon submission.
                </div>
              </div>
            )}

            <div className="mb-8">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-4 border border-slate-200 dark:border-slate-700">
                {job?.department || "General"}
              </span>
              <h1 className="text-2xl md:text-2xl font-bold tracking-tight mb-4">
                {selectedRole?.roleName || job?.jobTitle || "Role not specified"}
              </h1>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-400 mb-8">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> <span>{job?.location || "Remote / On-site"}</span></div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /> <span>{job?.employmentType || "Full-time"}</span></div>
                <div className="flex items-center gap-2"><Briefcase size={16} className="text-slate-400" /> <span>{selectedRole?.experience || "Experience required"}</span></div>
                {job?.deadline && (
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> <span>Apply by {new Date(job.deadline).toLocaleDateString()}</span></div>
                )}
              </div>
            </div>

            <div className="space-y-8 text-slate-700 dark:text-slate-300">
              
              {/* About the Role */}
              <section>
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4">About the Role</h3>
                
                {/* Tech Stack Tags */}
                {(job?.primarySkills?.length > 0 || job?.secondarySkills?.length > 0) && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {job?.primarySkills?.map((skill, idx) => (
                      <span key={`primary-${idx}`} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-md border border-blue-100 dark:border-blue-800">
                        {skill}
                      </span>
                    ))}
                    {job?.secondarySkills?.map((skill, idx) => (
                      <span key={`secondary-${idx}`} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {job?.aboutRole || job?.description || "Join our team to make an impact."}
                </div>
              </section>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Key Responsibilities */}
              {job?.keyResponsibilities && (
                <>
                  <section>
                    <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4">Key Responsibilities</h3>
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {job.keyResponsibilities}
                    </div>
                  </section>
                  <hr className="border-slate-200 dark:border-slate-800" />
                </>
              )}

              {/* Requirements & Qualifications */}
              {(job?.requiredSkills || job?.preferredSkills || job?.qualifications) && (
                <>
                  <section>
                    <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4">Requirements & Qualifications</h3>
                    
                    {job?.requiredSkills && (
                      <div className="mb-5">
                        <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">Required Skills</h4>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {job.requiredSkills}
                        </div>
                      </div>
                    )}
                    
                    {job?.preferredSkills && (
                      <div className="mb-5">
                        <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">Preferred Skills</h4>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {job.preferredSkills}
                        </div>
                      </div>
                    )}
                    
                    {job?.qualifications && (
                      <div>
                        <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">Qualifications</h4>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {job.qualifications}
                        </div>
                      </div>
                    )}
                  </section>
                  <hr className="border-slate-200 dark:border-slate-800" />
                </>
              )}

              {/* Benefits & Perks */}
              {job?.benefitsPerks && (
                <section>
                  <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4">Benefits & Perks</h3>
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {job.benefitsPerks}
                  </div>
                </section>
              )}

            </div>
          </div>

          {/* Right Column: Application Form (45%) */}
          <div className="lg:w-[45%]">
            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              
              {success ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                    Thank you for applying. Our hiring team will review your application and get back to you within 3-5 business days.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50 mb-8 inline-block text-left">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Application ID</p>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{applicationId}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/careers')}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl transition-all"
                  >
                    Return to Careers
                  </button>
                </div>
              ) : isDeadlinePassed(job?.deadline) ? (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 p-6 rounded-xl text-center">
                  <p className="font-semibold mb-2">Applications Closed</p>
                  <p className="text-sm">The deadline for this job opening has passed. We are no longer accepting applications.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  <div>
                    <h2 className="text-xl font-bold mb-1">Submit your application</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Fields marked with an asterisk (*) are required.</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
                      <HelpCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Personal Information</h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                        <input
                          type="text" required name="name" value={formData.name} onChange={handleInputChange}
                          className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                          placeholder="e.g. Jane Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail size={16} /></div>
                          <input
                            type="email" required name="email" value={formData.email} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="jane@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Phone size={16} /></div>
                          <input
                            type="tel" required name="phone" maxLength={10} value={formData.phone} onChange={handleInputChange}
                            className={`w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border ${phoneError ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400`}
                            placeholder="9876543210"
                          />
                        </div>
                        {phoneError && <p className="text-red-500 text-xs mt-1 font-medium">{phoneError}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Location *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Map size={16} /></div>
                        <input
                          type="text" required name="currentLocation" value={formData.currentLocation} onChange={handleInputChange}
                          className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                          placeholder="City, State, Country"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Professional Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Highest Education *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><BookOpen size={16} /></div>
                          <select
                            required name="highestEducation" value={formData.highestEducation} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-8 appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">Select Education</option>
                            <option value="High School">High School</option>
                            <option value="Associate Degree">Associate Degree</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="Ph.D.">Ph.D.</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Years of Experience *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase size={16} /></div>
                          <input
                            type="number" required min="0" step="0.5" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="e.g. 5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Company <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Building size={16} /></div>
                          <input
                            type="text" name="currentCompany" value={formData.currentCompany} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="Company Name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Designation <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                          <input
                            type="text" name="currentDesignation" value={formData.currentDesignation} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="Job Title"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 group">
                          Notice Period * 
                          <div className="relative cursor-help text-slate-400 hover:text-blue-500"><HelpCircle size={14} />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg text-center z-10 shadow-lg">Time required to join after offer acceptance.</span>
                          </div>
                        </label>
                        <div className="relative">
                          <select
                            required name="noticePeriod" value={formData.noticePeriod} onChange={handleInputChange}
                            className="w-full h-11 pl-4 pr-8 appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">Select Notice Period</option>
                            <option value="Immediate">Immediate</option>
                            <option value="15 Days">15 Days</option>
                            <option value="30 Days">30 Days</option>
                            <option value="60 Days">60 Days</option>
                            <option value="90 Days">90 Days</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Employment Type Pref. *</label>
                        <div className="relative">
                          <select
                            required name="employmentTypePreference" value={formData.employmentTypePreference} onChange={handleInputChange}
                            className="w-full h-11 pl-4 pr-8 appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compensation */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Compensation (Optional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current CTC</label>
                        <input
                          type="text" name="currentCtc" value={formData.currentCtc} onChange={handleInputChange}
                          className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                          placeholder="e.g. $80,000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Expected CTC</label>
                        <input
                          type="text" name="expectedCtc" value={formData.expectedCtc} onChange={handleInputChange}
                          className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                          placeholder="e.g. $100,000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Online Profiles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Online Profiles (Optional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">LinkedIn Profile</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500"><Link size={16} /></div>
                          <input
                            type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GitHub Profile</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700 dark:text-slate-300"><Github size={16} /></div>
                          <input
                            type="url" name="githubProfile" value={formData.githubProfile} onChange={handleInputChange}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio Website</label>
                      <input
                        type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Documents</h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Resume / CV *</label>
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${resumeDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        onDragEnter={(e) => handleDrag(e, setResumeDragActive)}
                        onDragLeave={(e) => handleDrag(e, setResumeDragActive)}
                        onDragOver={(e) => handleDrag(e, setResumeDragActive)}
                        onDrop={(e) => handleDrop(e, setResumeDragActive, setResume)}
                        onClick={() => resumeInputRef.current?.click()}
                      >
                        <input 
                          ref={resumeInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                          onChange={(e) => handleChangeFile(e, setResume)}
                        />
                        {resume ? (
                          <div className="flex flex-col items-center">
                            <FileText size={28} className="text-blue-500 mb-2" />
                            <p className="text-sm font-semibold truncate max-w-[250px]">{resume.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button 
                              type="button" 
                              className="mt-3 text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1"
                              onClick={(e) => { e.stopPropagation(); setResume(null) }}
                            >
                              <Trash2 size={12}/> Replace File
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud size={28} className="text-slate-400 mb-2" />
                            <p className="text-sm font-semibold mb-1 text-blue-600 dark:text-blue-400">Click to upload <span className="text-slate-600 dark:text-slate-400 font-normal">or drag and drop</span></p>
                            <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Additional Documents <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${addDocDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        onDragEnter={(e) => handleDrag(e, setAddDocDragActive)}
                        onDragLeave={(e) => handleDrag(e, setAddDocDragActive)}
                        onDragOver={(e) => handleDrag(e, setAddDocDragActive)}
                        onDrop={(e) => handleDrop(e, setAddDocDragActive, setAdditionalDocuments)}
                        onClick={() => addDocInputRef.current?.click()}
                      >
                        <input 
                          ref={addDocInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                          onChange={(e) => handleChangeFile(e, setAdditionalDocuments)}
                        />
                        {additionalDocuments ? (
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-slate-500" />
                            <div className="text-left">
                              <p className="text-sm font-semibold truncate max-w-[200px]">{additionalDocuments.name}</p>
                              <button 
                                type="button" 
                                className="text-xs font-medium text-red-500 hover:text-red-700"
                                onClick={(e) => { e.stopPropagation(); setAdditionalDocuments(null) }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <UploadCloud size={16} /> <span>Upload certifications or references</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Cover Letter <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <span className="text-[10px] font-medium text-slate-400">{formData.coverLetter.length} / 1000</span>
                      </div>
                      <textarea
                        rows="4" name="coverLetter" maxLength={1000} value={formData.coverLetter} onChange={handleInputChange}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder-slate-400"
                        placeholder="Why are you a great fit for this role?..."
                      ></textarea>
                    </div>
                  </div>

                  {/* Consents */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      <input
                        id="privacyConsent" type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-600 transition-all cursor-pointer"
                      />
                      <label htmlFor="privacyConsent" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
                        I acknowledge that I have read and agree to the <a href="#" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Privacy Policy</a> and consent to the processing of my personal data. *
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        id="termsConsent" type="checkbox" checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-600 transition-all cursor-pointer"
                      />
                      <label htmlFor="termsConsent" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
                        I agree to the <a href="#" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Terms & Conditions</a> regarding background checks and employment verification. *
                      </label>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !!phoneError || formData.phone.length !== 10 || !resume || !privacyConsent || !termsConsent}
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 dark:shadow-none"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : "Submit Application"}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
                      By submitting, you confirm that all information provided is accurate and true.
                    </p>
                  </div>

                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ApplyJob
