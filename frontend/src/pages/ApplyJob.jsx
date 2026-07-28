import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { Briefcase, Building, Clock, MapPin, ArrowLeft } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api"

const ApplyJob = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const roleId = searchParams.get("roleId") || ""
  const navigate = useNavigate()

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    d.setHours(23, 59, 59, 999);
    const today = new Date();
    return today > d;
  };

  const [job, setJob] = useState(null)
  const [loadingJob, setLoadingJob] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState(null)
  const [resume, setResume] = useState(null)
  const [error, setError] = useState("")
  const selectedRole = job?.hiringRoles?.find((role) => String(role._id) === String(roleId)) || null

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/job-openings/published`)
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
  }, [id])

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    setPhone(val)
    if (val && !/^[6-9]/.test(val)) {
      setPhoneError("Phone number must start with 6, 7, 8, or 9.")
    } else if (val.length > 0 && val.length < 10) {
      setPhoneError("Phone number must be exactly 10 digits.")
    } else {
      setPhoneError("")
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

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("jobId", id)
      formData.append("hiringRoleId", roleId)
      formData.append("name", name)
      formData.append("email", email)
      formData.append("phone", phone)
      formData.append("resume", resume)

      const res = await axios.post(
        `${API_BASE}/applications/apply`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      const created = res.data
      setApplicationId(created?._id || created?.id || null)
      setSuccess(true)

      setName("")
      setEmail("")
      setPhone("")
      setResume(null)

    } catch (error) {
      setError(error.response?.data?.message || "Could not submit your application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading job details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Careers
        </button>

        <div className="grid lg:grid-cols-5 gap-10">
          
          {/* Left Column: Job Details */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-slate-800">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {job?.jobTitle || "Role not specified"}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                  <Building size={16} className="text-blue-500" />
                  <span>{job?.department || "General"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                  <Clock size={16} className="text-green-500" />
                  <span>{job?.employmentType || "Full-time"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                  <Briefcase size={16} className="text-purple-500" />
                  <span>{job?.positions || 1} Openings</span>
                </div>
              </div>

              <div className="prose prose-blue dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description</h3>
                
                <div className="mb-4 text-gray-800 dark:text-gray-200">
                  <strong className="text-gray-900 dark:text-white">Role: </strong> 
                  {selectedRole?.roleName || job?.jobTitle || "Not specified"}
                </div>

                {selectedRole && (
                  <>
                    <div className="mb-4 text-gray-800 dark:text-gray-200">
                      <strong className="text-gray-900 dark:text-white">Openings: </strong>
                      {Math.max(0, (Number(selectedRole.openings) || 0) - (Number(selectedRole.filled) || 0))}
                    </div>
                    {(selectedRole.minSalary || selectedRole.maxSalary) ? (
                      <div className="mb-4 text-gray-800 dark:text-gray-200">
                        <strong className="text-gray-900 dark:text-white">Salary Range: </strong>
                        {selectedRole.minSalary || 0} - {selectedRole.maxSalary || 0}
                      </div>
                    ) : (
                      job?.salaryRange && (
                        <div className="mb-4 text-gray-800 dark:text-gray-200">
                          <strong className="text-gray-900 dark:text-white">Salary Range: </strong>
                          {job.salaryRange}
                        </div>
                      )
                    )}
                    {selectedRole.experience && (
                      <div className="mb-4 text-gray-800 dark:text-gray-200">
                        <strong className="text-gray-900 dark:text-white">Experience: </strong>
                        {selectedRole.experience}
                      </div>
                    )}
                    {selectedRole.skills && (
                      <div className="mb-4 text-gray-800 dark:text-gray-200">
                        <strong className="text-gray-900 dark:text-white">Skills/Requirements: </strong>
                        {selectedRole.skills}
                      </div>
                    )}
                  </>
                )}

                <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job?.description ? job.description : (
                    <>
                      <p className="mb-4">
                        We are looking for a highly motivated and talented professional to join our fast-growing team. 
                      </p>
                      <p className="mb-4">
                        In this role, you will be at the forefront of innovation, working alongside a diverse group of passionate individuals to solve complex problems and deliver impactful solutions. You will have the opportunity to take ownership of key initiatives, continuously learn and grow, and shape the future of our products.
                      </p>
                      <p>
                        If you are driven by excellence, thrive in a collaborative environment, and are eager to make a tangible difference, we would love to welcome you aboard!
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl p-8 sticky top-10 border border-gray-200 dark:border-slate-800">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                Apply Now
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                Submit your application for {selectedRole?.roleName || "this position"}.
              </p>

              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl mb-6 text-sm space-y-2">
                  <p className="font-medium">Application submitted successfully!</p>
                  {applicationId && (
                    <p className="font-mono text-xs break-all mt-2">
                      Application ID: <strong className="text-green-800 dark:text-green-300">{applicationId}</strong>
                    </p>
                  )}
                  <p className="text-xs mt-1 opacity-90">
                    Use this ID to track your application status.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {isDeadlinePassed(job?.deadline) ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-2xl text-center space-y-3">
                  <p className="font-semibold text-lg">Applications Closed</p>
                  <p className="text-sm">
                    The deadline for this job opening has passed ({new Date(job.deadline).toLocaleDateString()}). New applications are no longer being accepted.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 7896675734"
                      pattern="[6-9][0-9]{9}"
                      title="Please enter exactly 10 digits starting with 6, 7, 8, or 9"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      maxLength={10}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    {phoneError && <p className="text-red-500 dark:text-red-400 text-sm mt-1.5 font-medium">{phoneError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Upload Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setResume(e.target.files[0])}
                      required
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl px-4 py-2.5 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!phoneError || phone.length !== 10}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition duration-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
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
