import { useState, useEffect } from "react"
import axios from "axios"
import { Mail, Search, Moon, Sun, Briefcase, Hash } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api"

const ApplicationStatus = () => {
  const [email, setEmail] = useState("")
  const [applicationId, setApplicationId] = useState("")
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  const checkStatus = async () => {
    setError("")
    if (!email.trim() || !applicationId.trim()) {
      setError("Enter the email you applied with and your application ID (shown after you submitted).")
      return
    }

    try {
      setLoading(true)
      const res = await axios.get(
        `${API_BASE}/applications/public-status/${applicationId.trim()}`,
        { params: { email: email.trim() } }
      )
      const data = Array.isArray(res.data) ? res.data : []
      setApplications(data)
      if (data.length === 0) {
        setError("No application found. Check your application ID and email.")
      }
    } catch (err) {
      setApplications([])
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load application status."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
      case "Under Review":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
      case "HR Screening":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
      case "Assessment":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
      case "Interview Round 1":
      case "Interview Round 2":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
      case "Hiring Manager Review":
      case "Approved":
        return "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300"
      case "Offer Sent":
        return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300"
      case "Offer Accepted":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
      case "Background Verification":
        return "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300"
      case "Hired":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
      case "Rejected":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const timelineSteps = [
    "Applied",
    "HR Screening",
    "Interview Round 1",
    "Offer Accepted",
    "Background Verification",
    "Hired"
  ]

  const getActiveIndex = (status) => {
    if (status === "Under Review" || status === "Applied") return 0
    if (status === "HR Screening" || status === "Assessment") return 1
    if (status === "Interview Round 1" || status === "Interview Round 2" || status === "Hiring Manager Review" || status === "Approved" || status === "Offer Sent") return 2
    if (status === "Offer Accepted") return 3
    if (status === "Background Verification") return 4
    if (status === "Hired") return 5
    return -1
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Track Your Application Status
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Use the application ID from your confirmation screen together with your email.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="p-3 rounded-xl bg-gray-200 dark:bg-slate-800"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-xl px-4">
              <Mail className="text-gray-400 mr-2 shrink-0" size={18} />
              <input
                type="email"
                placeholder="Email used on your application"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 bg-transparent outline-none text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-xl px-4">
              <Hash className="text-gray-400 mr-2 shrink-0" size={18} />
              <input
                type="text"
                placeholder="Application ID (MongoDB id from confirmation)"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className="w-full py-3 bg-transparent outline-none text-gray-800 dark:text-white font-mono text-sm"
              />
            </div>
            <button
              type="button"
              onClick={checkStatus}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              <Search size={18} />
              {loading ? "Checking..." : "Check Status"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="space-y-8">
          {applications.map((app) => {
            const activeIdx = getActiveIndex(app.status)
            return (
              <div
                key={app._id}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-blue-500" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {app.jobId?.jobTitle ?? "Job application"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-medium ${statusColor(app.status)}`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-6 border-b border-gray-100 dark:border-slate-800 pb-6 overflow-x-auto gap-4">
                  {timelineSteps.map((step, index) => {
                    const active = activeIdx >= index
                    return (
                      <div key={step} className="flex-1 min-w-[80px] flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            active ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-700"
                          }`}
                        />
                        <span className="text-[10px] md:text-xs mt-2 text-gray-500 dark:text-slate-400 text-center font-medium">
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {app.status === "Hired" && (
                  <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm space-y-3">
                    <p className="font-bold text-lg text-emerald-400 flex items-center gap-2">🎉 Background Verification Passed!</p>
                    <p>Your application has been selected. Our HR team will contact you regarding the next steps and onboarding documents.</p>
                    <a 
                      href="/careers"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition"
                    >
                      Return to Careers Portal
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ApplicationStatus
