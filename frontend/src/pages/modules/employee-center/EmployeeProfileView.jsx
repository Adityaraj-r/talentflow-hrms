import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Mail, Building, Phone, Calendar,
  User, Shield, CheckCircle2, XCircle, DollarSign,
  Loader2, Save, TrendingUp, TrendingDown, Hash,
  UserMinus
} from "lucide-react"
import adminService from "@/services/adminService"
import apiClient from "@/services/apiClient"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import InitiateSeparationModal from "@/components/modals/InitiateSeparationModal" // <-- IMPORTED HERE

const HR_ROLES = ["HRMANAGER", "HR_MANAGER", "HROFFICER", "HR_OFFICER", "PAYROLLOFFICER", "PAYROLL_OFFICER", "ADMIN", "SUPER ADMIN", "SUPERADMIN"]
const INITIATOR_ROLES = ["HR_MANAGER"]
const TABS = ["Overview", "Salary Structure"]

const EmployeeProfileView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Overview")
  const [showOffboardModal, setShowOffboardModal] = useState(false)

  const userRole = (typeof authUser?.role === "string"
    ? authUser.role
    : authUser?.role?.name || ""
  ).toUpperCase().replace(/ /g, "_")

  const isHR = HR_ROLES.includes(userRole) || HR_ROLES.includes(userRole.replace(/_/g, ""))
  const canInitiateOffboarding = INITIATOR_ROLES.includes(userRole)

  const fetchEmployee = async () => {
    try {
      const response = await adminService.getAllEmployees()
      const users = response.data?.users || response.data || []
      const found = Array.isArray(users) 
        ? users.find(u => u._id === id || u.employeeCode === id) 
        : null
      setEmployee(found || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployee()
  }, [id])

  const getFullName = (emp) => {
    if (!emp) return "—"
    if (emp.name) return emp.name
    if (emp.firstName || emp.lastName) return `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
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
        <XCircle className="h-12 w-12 opacity-30 text-red-500" />
        <h2 className="text-xl font-semibold text-foreground">Employee Not Found</h2>
        <p className="text-sm text-center max-w-md">
          The employee record you are trying to view no longer exists or has been permanently deleted from the database.
        </p>
        <Button variant="outline" className="mt-2" onClick={() => navigate("/employee-center/all-employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Employees
        </Button>
      </div>
    )
  }

  const fullName = getFullName(employee)
  const status = employee.status || 'Active'
  const isActive = status === 'Active'
  const visibleTabs = isHR ? TABS : ["Overview"]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          onClick={() => navigate("/employee-center/all-employees")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Employees
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Profile</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border-2 border-primary/20 flex-shrink-0">
                {getInitial(employee)}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{employee.email}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {employee.employeeCode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                      <Hash className="h-3 w-3" />
                      {employee.employeeCode}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {employee.role?.replace(/_/g, " ") || "No Role"}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                    status === 'Active'
                      ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
                      : status?.startsWith('Pending')
                      ? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                      : status === 'On Notice Period'
                      ? "bg-yellow-50 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30"
                      : "bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
                  )}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full", 
                      status === 'Active' ? "bg-green-500" : status?.startsWith('Pending') ? "bg-blue-500" : status === 'On Notice Period' ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    {status}
                  </span>
                </div>
              </div>
            </div>
            {canInitiateOffboarding && isActive && (
              <Button 
                variant="destructive" 
                className="shrink-0 shadow-sm cursor-pointer"
                onClick={() => setShowOffboardModal(true)}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Initiate Separation
              </Button>
            )}
          </div>
        </div>

        {visibleTabs.length > 1 && (
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
            {visibleTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="grid gap-4 md:grid-cols-2">
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
                <InfoRow icon={User} label="Gender" value={employee.gender && employee.gender !== "N/A" ? employee.gender : null} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Work Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <InfoRow
                  icon={Hash}
                  label="Employee ID"
                  value={employee.employeeCode || "Not assigned"}
                  valueClassName={employee.employeeCode ? "text-blue-600 dark:text-blue-400 font-mono" : "text-gray-400 italic"}
                />
                <InfoRow icon={Building} label="Department" value={employee.department} />
                <InfoRow icon={Shield} label="Access Role" value={employee.role?.replace(/_/g, " ")} />
                <InfoRow
                  icon={CheckCircle2}
                  label="Account Status"
                  value={status}
                  valueClassName={
                    status === 'Active' ? "text-green-600 dark:text-green-400" :
                    status?.startsWith('Pending') ? "text-blue-600 dark:text-blue-400" :
                    status === 'On Notice Period' ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  }
                />
                {status === 'On Notice Period' && employee.exitDate && (
                  <InfoRow 
                    icon={Calendar} 
                    label="Last Working Day (LWD)" 
                    value={formatDate(employee.exitDate)} 
                    valueClassName="text-yellow-600 dark:text-yellow-400 font-semibold"
                  />
                )}
                <InfoRow icon={Calendar} label="Joined On" value={formatDate(employee.createdAt)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Salary Structure" && isHR && (
          <SalaryTab userId={id} employeeName={fullName} />
        )}

      </div>
      <InitiateSeparationModal 
        isOpen={showOffboardModal} 
        onClose={() => setShowOffboardModal(false)} 
        preSelectedEmployee={employee} 
        onSuccess={() => {
          navigate("/employee-center/all-employees") 
        }}
      />

    </div>
  )
}

const EMPTY_SALARY = {
  basic: "", hra: "", transport: "", medical: "", otherAllowance: "",
  pf: "", tax: "", insurance: "",
}

const SalaryTab = ({ userId, employeeName }) => {
  const [form, setForm] = useState(EMPTY_SALARY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const res = await apiClient.get(`/salary-structure/${userId}`)
        const d = res.data?.data || res.data || res

        setForm({
          basic: d.basic || "",
          hra: d.hra || "",
          transport: d.transport || "",
          medical: d.medical || "",
          otherAllowance: d.otherAllowance || "",
          pf: d.pf || "",
          tax: d.tax || "",
          insurance: d.insurance || "",
        })
        setHasExisting(Number(d.basic) > 0)
      } catch (err) {
        if (err?.response?.status === 404) {
          setHasExisting(false)
        } else {
          toast.error("Failed to load salary data")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSalary()
  }, [userId])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const grossAnnual = [form.basic, form.hra, form.transport, form.medical, form.otherAllowance]
    .reduce((sum, v) => sum + (Number(v) || 0), 0)

  const deductionsAnnual = [form.pf, form.tax, form.insurance]
    .reduce((sum, v) => sum + (Number(v) || 0), 0)

  const netAnnual = grossAnnual - deductionsAnnual

  const toMonthly = (val) => Math.round((Number(val) || 0) / 12)
  const grossMonthly = toMonthly(grossAnnual)
  const deductionsMonthly = toMonthly(deductionsAnnual)
  const netMonthly = grossMonthly - deductionsMonthly

  const handleSave = async () => {
    if (!form.basic || Number(form.basic) <= 0) {
      toast.error("Basic annual salary is required and must be greater than 0")
      return
    }
    setSaving(true)
    try {
      await apiClient.put(`/salary-structure/${userId}`, {
        basic: Number(form.basic),
        hra: Number(form.hra || 0),
        transport: Number(form.transport || 0),
        medical: Number(form.medical || 0),
        otherAllowance: Number(form.otherAllowance || 0),
        pf: Number(form.pf || 0),
        tax: Number(form.tax || 0),
        insurance: Number(form.insurance || 0),
      })
      toast.success(`Salary structure ${hasExisting ? "updated" : "created"} for ${employeeName}`)
      setHasExisting(true)
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save salary structure")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {!hasExisting && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          No salary structure found for <strong>{employeeName}</strong>. Fill in the details below to create one.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Earnings
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SalaryField label="Basic Annual Salary" value={form.basic} onChange={v => set("basic", v)} required />
              <SalaryField label="HRA (House Rent Allowance)" value={form.hra} onChange={v => set("hra", v)} />
              <SalaryField label="Transport Allowance" value={form.transport} onChange={v => set("transport", v)} />
              <SalaryField label="Medical Allowance" value={form.medical} onChange={v => set("medical", v)} />
              <SalaryField label="Other Allowance" value={form.otherAllowance} onChange={v => set("otherAllowance", v)} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Deductions
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SalaryField label="PF (Provident Fund)" value={form.pf} onChange={v => set("pf", v)} />
              <SalaryField label="Income Tax" value={form.tax} onChange={v => set("tax", v)} />
              <SalaryField label="Insurance" value={form.insurance} onChange={v => set("insurance", v)} />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {saving
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              : <><Save className="mr-2 h-4 w-4" /> {hasExisting ? "Update Salary Structure" : "Create Salary Structure"}</>
            }
          </Button>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Annual Summary
              </h3>
            </div>
            <div className="p-6 space-y-3 pb-4">
              <PreviewRow label="Basic" value={form.basic} color="text-gray-900 dark:text-white" />
              <PreviewRow label="HRA" value={form.hra} color="text-gray-700 dark:text-gray-300" />
              <PreviewRow label="Transport" value={form.transport} color="text-gray-700 dark:text-gray-300" />
              <PreviewRow label="Medical" value={form.medical} color="text-gray-700 dark:text-gray-300" />
              <PreviewRow label="Other Allowance" value={form.otherAllowance} color="text-gray-700 dark:text-gray-300" />

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <PreviewRow label="Gross Salary" value={grossAnnual} color="font-bold text-gray-900 dark:text-white" />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                <PreviewRow label="PF" value={form.pf} color="text-red-500" prefix="−" />
                <PreviewRow label="Tax" value={form.tax} color="text-red-500" prefix="−" />
                <PreviewRow label="Insurance" value={form.insurance} color="text-red-500" prefix="−" />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <PreviewRow label="Total Deductions" value={deductionsAnnual} color="font-semibold text-red-500" prefix="−" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <Calendar className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Monthly Breakdown
              </h3>
            </div>
            <div className="p-6 space-y-3 pt-4">
              <PreviewRow label="Basic" value={toMonthly(form.basic)} color="text-gray-900 dark:text-white" />
              <PreviewRow label="HRA" value={toMonthly(form.hra)} color="text-gray-700 dark:text-gray-300" />
              <PreviewRow label="Allowances" value={toMonthly(form.transport) + toMonthly(form.medical) + toMonthly(form.otherAllowance)} color="text-gray-700 dark:text-gray-300" />
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <PreviewRow label="Gross Monthly" value={grossMonthly} color="font-bold text-gray-900 dark:text-white" />
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                <PreviewRow label="Total Deductions" value={deductionsMonthly} color="font-semibold text-red-500" prefix="−" />
              </div>

              <div className="mt-4 p-4 bg-green-600 rounded-xl text-white text-center shadow-md">
                <p className="text-xs uppercase tracking-widest opacity-90">Net Monthly Pay</p>
                <h2 className="text-3xl font-black mt-1">
                  ₹ {netMonthly > 0 ? netMonthly.toLocaleString() : "0"}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const SalaryField = ({ label, value, onChange, required }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
      <Input
        type="number"
        min="0"
        placeholder="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-7"
      />
    </div>
  </div>
)

const PreviewRow = ({ label, value, color, prefix = "" }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className={cn("font-medium", color)}>
      {prefix} ₹ {Number(value || 0).toLocaleString()}
    </span>
  </div>
)

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