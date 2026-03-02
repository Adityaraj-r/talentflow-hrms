import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Mail, Building, Phone, Calendar,
  User, Shield, CheckCircle2, XCircle
} from "lucide-react"
import adminService from "@/services/adminService"
import { cn } from "@/lib/utils"

const EmployeeProfileView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await adminService.getAllEmployees()
        const users = response.data?.users || response.data || []
        const found = Array.isArray(users) ? users.find(u => u._id === id) : null
        setEmployee(found || null)
      } catch (err) {
        console.error("Failed to fetch employee", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployee()
  }, [id])

  const getFullName = (emp) => {
    if (!emp) return "—"
    if (emp.name) return emp.name
    if (emp.firstName || emp.lastName)
      return `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
    return "—"
  }

  const getInitial = (emp) => {
    const name = getFullName(emp)
    return name !== "—" ? name.charAt(0).toUpperCase() : "?"
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className="text-sm">Loading employee profile...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500 dark:text-gray-400">
        <XCircle className="h-12 w-12 opacity-30" />
        <p className="text-lg font-semibold">Employee not found</p>
        <Button variant="outline" onClick={() => navigate("/employee-center/all-employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Employees
        </Button>
      </div>
    )
  }

  const fullName = getFullName(employee)
  const isActive = employee.isActive

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate("/employee-center/all-employees")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Employees
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Profile</h1>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border-2 border-primary/20 flex-shrink-0">
              {getInitial(employee)}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{employee.email}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {employee.role?.replace(/_/g, " ") || "No Role"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  isActive
                    ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
                    : "bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-green-500" : "bg-orange-500")} />
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Personal Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoRow icon={User} label="Full Name" value={fullName} />
              <InfoRow icon={Mail} label="Email Address" value={employee.email} />
              <InfoRow icon={Phone} label="Phone Number" value={employee.phoneNumber || employee.mobile} />
              <InfoRow icon={User} label="Gender" value={
                employee.gender && employee.gender !== "N/A" ? employee.gender : null
              } />
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Work Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoRow icon={Building} label="Department" value={employee.department} />
              <InfoRow icon={Shield} label="Access Role" value={employee.role?.replace(/_/g, " ")} />
              <InfoRow
                icon={CheckCircle2}
                label="Account Status"
                value={isActive ? "Active" : "Inactive"}
                valueClassName={isActive ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}
              />
              <InfoRow icon={Calendar} label="Joined On" value={formatDate(employee.createdAt)} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("text-sm font-semibold mt-0.5 text-gray-900 dark:text-white", valueClassName)}>
        {value || "—"}
      </p>
    </div>
  </div>
)

export default EmployeeProfileView
