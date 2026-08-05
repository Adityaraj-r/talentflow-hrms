import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, Search, MapPin, Building, Clock, ChevronDown, RefreshCcw, Briefcase, IndianRupee, TrendingUp, Users, ArrowRight, Mail } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api"

const Careers = () => {
  const [jobs, setJobs] = useState([])
  const [dark, setDark] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("All")
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All")
  const [locationFilter, setLocationFilter] = useState("All")

  const [companyInfo, setCompanyInfo] = useState({ name: "Company HRMS", email: "careers@company.com", phone: "+1 (800) 123-4567" })

  const navigate = useNavigate()

  useEffect(() => {
    if(dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE}/job-openings/published`)
      setJobs(res.data)
    } catch(error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyInfo = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/settings/company-info`)
      if (data.success) {
        setCompanyInfo({
          name: data.companyName || "Company HRMS",
          email: data.companyEmail || "careers@company.com",
          phone: data.phone || "+1 (800) 123-4567"
        })
      }
    } catch (error) {
      console.log("Failed to fetch company info", error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchCompanyInfo()
  }, [])

  const getHiringRoles = (job) => {
    if (Array.isArray(job.hiringRoles) && job.hiringRoles.length > 0) {
      return job.hiringRoles
    }
    return [{
      _id: "default",
      roleName: job.jobTitle,
      openings: job.positions || 1,
      filled: 0,
      experience: job.minExperience ? `${job.minExperience}-${job.maxExperience || '*'} Years` : "",
      status: job.status === "Closed" ? "Closed" : "Open",
    }]
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    const d = new Date(deadline)
    d.setHours(23, 59, 59, 999)
    return new Date() > d
  }

  const formatDaysAgo = (dateStr) => {
    if (!dateStr) return "Recently"
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Posted today"
    if (diff === 1) return "Posted 1d ago"
    return `Posted ${diff}d ago`
  }

  // Derive filter options
  const departments = ["All", ...new Set(jobs.map(j => j.department).filter(Boolean))]
  const employmentTypes = ["All", ...new Set(jobs.map(j => j.employmentType).filter(Boolean))]
  const locations = ["All", ...new Set(jobs.map(j => j.officeLocation || j.location).filter(Boolean))]

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const jobLoc = job.officeLocation || job.location
      const matchesSearch = job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.primarySkills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesDept = departmentFilter === "All" || job.department === departmentFilter
      const matchesType = employmentTypeFilter === "All" || job.employmentType === employmentTypeFilter
      const matchesLoc = locationFilter === "All" || jobLoc === locationFilter
      return matchesSearch && matchesDept && matchesType && matchesLoc
    })
  }, [jobs, searchTerm, departmentFilter, employmentTypeFilter, locationFilter])

  const clearFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("All")
    setEmploymentTypeFilter("All")
    setLocationFilter("All")
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/careers')}>
            <img src="/hrms-logo.svg" alt="Company Logo" className="w-10 h-10 object-contain" />
            <span className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">{companyInfo.name} Careers</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <h1 className="text-[40px] font-bold text-slate-900 dark:text-white leading-tight">Careers</h1>
          <p className="text-[16px] text-slate-600 dark:text-slate-400">
            Build your future with us. Explore exciting opportunities and grow your career.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 h-[44px] w-full min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search jobs by title, skill, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
            />
          </div>
          
          <div className="relative h-[44px] w-full md:w-[180px]">
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-full appearance-none pl-4 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[14px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer truncate"
            >
              {departments.map(dept => <option key={dept} value={dept}>{dept === "All" ? "Department" : dept}</option>)}
            </select>
            <ChevronDown size={14} className="absolute inset-y-0 right-4 my-auto text-slate-400 pointer-events-none" />
          </div>

          <div className="relative h-[44px] w-full md:w-[190px]">
            <select 
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full h-full appearance-none pl-4 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[14px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer truncate"
            >
              {employmentTypes.map(type => <option key={type} value={type}>{type === "All" ? "Employment Type" : type}</option>)}
            </select>
            <ChevronDown size={14} className="absolute inset-y-0 right-4 my-auto text-slate-400 pointer-events-none" />
          </div>



          <button 
            onClick={clearFilters}
            className="h-[44px] px-2 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            <RefreshCcw size={14} /> Reset
          </button>
        </div>

        {/* Job Cards Container */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 w-full">
            {filteredJobs.map((job) => {
              const roles = getHiringRoles(job)
              const firstRole = roles[0]
              const isSingleRole = roles.length === 1
              const isClosed = firstRole?.status === "Closed" || (Number(firstRole?.openings) - Number(firstRole?.filled) <= 0)
              const deadlinePassed = isDeadlinePassed(job.deadline)
              const inactive = deadlinePassed || isClosed
              const jobLoc = job.officeLocation || job.location || "Remote"
              const jobExp = job.minExperience ? `${job.minExperience}–${job.maxExperience || '*'} Years` : (firstRole?.experience ? firstRole.experience : null)
              
              let jobSalary = null
              if (job.minSalary && job.maxSalary) {
                if (job.currency === 'INR' && job.maxSalary >= 100000) {
                  const minLpa = (job.minSalary / 100000).toFixed(1).replace('.0', '')
                  const maxLpa = (job.maxSalary / 100000).toFixed(1).replace('.0', '')
                  jobSalary = `₹${minLpa}–${maxLpa} LPA`
                } else {
                  const cur = job.currency === 'INR' ? '₹' : job.currency === 'EUR' ? '€' : job.currency === 'GBP' ? '£' : '$'
                  jobSalary = `${cur}${job.minSalary.toLocaleString()} - ${(job.maxSalary).toLocaleString()}`
                }
              }
              
              let statusText = "🟢 Open"
              let statusColor = "text-green-600 dark:text-green-400"
              
              if (deadlinePassed || isClosed) {
                statusText = "⚪ Closed"
                statusColor = "text-slate-500 dark:text-slate-400"
              } else if (job.deadline) {
                const daysLeft = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                if (daysLeft <= 3) {
                  statusText = "🟠 Closing Soon"
                  statusColor = "text-orange-500"
                }
              }

              const rawSkills = Array.isArray(job.primarySkills) && job.primarySkills.length > 0 
                ? job.primarySkills 
                : (job.skills ? job.skills.split(',').map(s => s.trim()) : [])
              
              const techStack = rawSkills.slice(0, 3)
              const remainingTech = rawSkills.length - techStack.length

              return (
                <div 
                  key={job._id}
                  className="group bg-white dark:bg-slate-900 rounded-[16px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 flex flex-col min-h-[260px] h-full"
                >
                  {/* Status & Date */}
                  <div className="flex justify-between items-center mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[12px] font-semibold border border-green-100 dark:border-green-800`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      Open
                    </span>
                    <span className="text-[13px] font-medium text-slate-400">
                      {formatDaysAgo(job.createdAt)}
                    </span>
                  </div>
                  
                  {/* Job Title */}
                  <h3 className="text-[22px] font-bold text-slate-900 dark:text-white line-clamp-1 mb-3">
                    {job.jobTitle}
                  </h3>
                  
                  {/* Metadata Row 1 */}
                  <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    <div className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400"/> <span className="truncate max-w-[140px]">{job.department || "General"}</span></div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> <span className="truncate max-w-[140px]">{jobLoc}</span></div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400"/> <span className="truncate max-w-[100px]">{job.employmentType || "Full-time"}</span></div>
                  </div>

                  {/* Metadata Row 2 */}
                  <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-slate-500 dark:text-slate-400 mb-4 font-medium">
                    {jobExp && <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-slate-400"/> {jobExp.includes("Years") ? jobExp : `${jobExp} Experience`}</div>}
                    {jobExp && jobSalary && <span className="text-slate-300 dark:text-slate-700">•</span>}
                    {jobSalary && <div className="flex items-center gap-1.5"><IndianRupee size={14} className="text-slate-400"/> <span className="font-semibold text-slate-700 dark:text-slate-300">{jobSalary}</span></div>}
                  </div>

                  {/* Tech Stack */}
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {techStack.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12px] font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                          {tech}
                        </span>
                      ))}
                      {remainingTech > 0 && (
                        <span className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-500 text-[12px] font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                          +{remainingTech}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {job.aboutRole || job.description || "Join our team to help build robust and scalable systems. Click apply to learn more about this role's responsibilities."}
                  </p>

                  <div className="flex-grow"></div>

                    {/* Render extra details for single role job */}
                    {isSingleRole && firstRole && (
                      <div className="mt-6 space-y-3 border-t pt-4 border-slate-200 dark:border-slate-800">
                        {firstRole.experience && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            <strong className="text-gray-900 dark:text-white">Experience:</strong> {firstRole.experience}
                          </p>
                        )}
                        {(firstRole.minSalary || firstRole.maxSalary) && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            <strong className="text-gray-900 dark:text-white">Salary:</strong> {firstRole.minSalary ? `$${firstRole.minSalary.toLocaleString()}` : "N/A"} - {firstRole.maxSalary ? `$${firstRole.maxSalary.toLocaleString()}` : "N/A"}
                          </p>
                        )}
                        {job.description && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                            <strong className="text-gray-900 dark:text-white block mb-1">Description:</strong>
                            <div className="whitespace-pre-wrap">{job.description}</div>
                          </div>
                        )}
                        {firstRole.skills && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                            <strong className="text-gray-900 dark:text-white block mb-1">Requirements & Skills:</strong>
                            <div className="whitespace-pre-wrap">{firstRole.skills}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-center pt-4">
                      <button 
                        className="px-10 h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[14px] transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={inactive}
                        onClick={() => {
                          if(!inactive) navigate(`/apply/${job._id}?roleId=${firstRole?._id || ""}`)
                        }}
                      >
                        {inactive ? "Unavailable" : "Apply"}
                      </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No Open Positions</h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              There are currently no openings matching your search. Join our talent pool to receive future opportunities.
            </p>
            <div className="flex gap-4">
              {searchTerm || departmentFilter !== "All" || employmentTypeFilter !== "All" || locationFilter !== "All" ? (
                <button 
                  onClick={clearFilters}
                  className="h-11 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-[14px] transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
              <button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[14px] transition-colors shadow-sm">
                Join Talent Pool
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Enterprise Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-12 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4">{companyInfo.name}</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400">
              Building the future of workforce management with scalable and elegant software solutions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Quick Links</h4>
            <ul className="space-y-2 text-[14px] text-slate-600 dark:text-slate-400">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Careers Home</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Contact HR</h4>
            <ul className="space-y-2 text-[14px] text-slate-600 dark:text-slate-400">
              <li>{companyInfo.email}</li>
              <li>{companyInfo.phone}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center text-[13px] text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Careers
