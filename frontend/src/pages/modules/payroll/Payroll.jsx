import { useState, useEffect } from "react";
import {
  Calculator, Users, Loader2, Download, RefreshCw,
  CheckCircle, Zap, AlertCircle, UserX, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import * as payrollService from "@/services/payrollService";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";


const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// ── Role helpers ──────────────────────────────────────────────────────────────
const normalizeRole = (role) => (role || "").toUpperCase().replace(/ /g, "_")
const isPayrollOfficer = (role) => ["PAYROLL_OFFICER","PAYROLLOFFICER"].includes(normalizeRole(role))
const isHRManager      = (role) => ["HR_MANAGER","HRMANAGER"].includes(normalizeRole(role))
const isHROrPayroll    = (role) =>
  isPayrollOfficer(role) || isHRManager(role) ||
  ["HR_OFFICER","HROFFICER"].includes(normalizeRole(role))


// ─────────────────────────────────────────────────────────────────────────────

const PayrollProcessing = () => {
  const { user: authUser } = useAuth()
  const userRole = authUser?.role || ""

  const [employees, setEmployees]           = useState([])
  const [records, setRecords]               = useState([])
  const [pending, setPending]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [processing, setProcessing]         = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [selectedEmp, setSelectedEmp]       = useState("")
  const [salaryData, setSalaryData]         = useState(null)
  const [month, setMonth]                   = useState(MONTHS[new Date().getMonth()])
  const [year, setYear]                     = useState(new Date().getFullYear())
  const [lopDays, setLopDays]               = useState(0)
  const [bonus, setBonus]                   = useState(0)
  const [overtime, setOvertime]             = useState(0)
  const [activeTab, setActiveTab]           = useState("run")

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchEmployees()
    fetchRecords()
    fetchPending()
  }, [])

  useEffect(() => {
    fetchRecords()
    fetchPending()
  }, [month, year])

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get("/admin/users")
      setEmployees(res.users || res.data || [])
    } catch {
      toast.error("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    try {
      const res = await payrollService.getPayrollRecords(month, year)
      setRecords(res.data || [])
    } catch { /* silent */ }
  }

  const fetchPending = async () => {
    try {
      const res = await payrollService.getPendingPayroll(month, year)
      setPending(res.data?.pending || [])
    } catch { /* silent */ }
  }

  // ── Salary preview ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedEmp) { setSalaryData(null); return }
    const fetchSalary = async () => {
      try {
        const empUser = employees.find(e => e._id === selectedEmp)
        if (!empUser?.employeeId) { setSalaryData(null); return }
        const res = await apiClient.get(`/employees/${empUser.employeeId}`)
        const emp = res.data || res
        setSalaryData({
          basic:          emp.salary?.basic                 || 0,
          hra:            emp.salary?.allowances?.hra       || 0,
          transport:      emp.salary?.allowances?.transport || 0,
          medical:        emp.salary?.allowances?.medical   || 0,
          otherAllowance: emp.salary?.allowances?.other     || 0,
          pf:             emp.salary?.deductions?.pf        || 0,
          tax:            emp.salary?.deductions?.tax       || 0,
          insurance:      emp.salary?.deductions?.insurance || 0,
        })
      } catch { setSalaryData(null) }
    }
    fetchSalary()
  }, [selectedEmp, employees])

  const calculatePreview = () => {
    if (!salaryData) return { gross: 0, net: 0, deductions: 0 }
    const basic      = Number(salaryData.basic)          || 0
    const hra        = Number(salaryData.hra)             || 0
    const transport  = Number(salaryData.transport)       || 0
    const medical    = Number(salaryData.medical)         || 0
    const otherAllow = Number(salaryData.otherAllowance)  || 0
    const pf         = Number(salaryData.pf)              || 0
    const tax        = Number(salaryData.tax)             || 0
    const insurance  = Number(salaryData.insurance)       || 0
    const gross      = basic + hra + transport + medical + otherAllow + Number(bonus) + Number(overtime)
    const lopDed     = (basic / 30) * Number(lopDays)
    const deductions = pf + tax + insurance + lopDed
    return {
      gross:      Math.round(gross),
      net:        Math.round(gross - deductions),
      deductions: Math.round(deductions),
    }
  }

  const preview = calculatePreview()

  // ── Single generate ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedEmp) { toast.error("Please select an employee"); return }
    if (!salaryData)  { toast.error("No salary structure found for this employee"); return }
    setProcessing(true)
    try {
      await payrollService.generatePayroll({ month, year, employeeIds: [selectedEmp] })
      toast.success("Payroll generated successfully!")
      setBonus(0); setOvertime(0); setLopDays(0); setSelectedEmp("")
      fetchRecords(); fetchPending()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate payroll")
    } finally {
      setProcessing(false)
    }
  }

  // ── Bulk run ────────────────────────────────────────────────────────────────
  const handleBulkRun = async () => {
    if (pending.length === 0) { toast.error("No pending employees for this month"); return }
    setBulkProcessing(true)
    try {
      const employeeIds = pending.map(e => e._id)
      await payrollService.generatePayroll({ month, year, employeeIds })
      toast.success(`Payroll generated for ${pending.length} employees!`)
      fetchRecords(); fetchPending()
      setActiveTab("records")
    } catch (err) {
      toast.error(err?.response?.data?.error || "Bulk payroll run failed")
    } finally {
      setBulkProcessing(false)
    }
  }

  // ── Status update ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, status) => {
    try {
      await payrollService.updatePayrollStatus(id, status)
      toast.success(`Payroll ${status === "HR Approved" ? "approved" : "marked as Paid"}`)
      fetchRecords()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update status")
    }
  }

  // ── Download payslip ────────────────────────────────────────────────────────
  const handleDownload = async (payrollId, employeeId) => {
    try {
      const blob = await payrollService.downloadPayslip(payrollId, employeeId)
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href  = url
      link.setAttribute("download", `payslip-${employeeId}-${month}-${year}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download payslip")
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Manage and process monthly employee payroll.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="p-2 border rounded-md bg-transparent text-sm"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="number"
            className="w-20 p-2 border rounded-md bg-transparent text-sm"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Total Records</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{records.length}</p>
        </div>
        <div className="rounded-xl border bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Pending This Month</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{pending.length}</p>
        </div>
        <div className="rounded-xl border bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Paid This Month</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
            {records.filter(r => r.status === "Paid").reduce((sum, r) => sum + (r.employees?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {[
          { key: "run",     label: "Run Payroll",               show: isPayrollOfficer(userRole) },
          { key: "pending", label: `Pending (${pending.length})`, show: isHROrPayroll(userRole) },
          { key: "records", label: "Records",                   show: isHROrPayroll(userRole) },
        ].filter(t => t.show).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Run Payroll ───────────────────────────────────────────────── */}
      {activeTab === "run" && isPayrollOfficer(userRole) && (
        <div className="space-y-4">

          {/* Bulk Banner */}
          {pending.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30 px-5 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    {pending.length} employee{pending.length > 1 ? "s" : ""} pending payroll for {month} {year}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                    Run bulk payroll to process all at once
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBulkRun}
                disabled={bulkProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
              >
                {bulkProcessing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  : <><Zap className="mr-2 h-4 w-4" /> Run Bulk Payroll</>
                }
              </Button>
            </div>
          )}

          {/* Single Employee Form */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Single Employee Payroll</CardTitle>
                  <CardDescription>Process payroll for one employee with custom adjustments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Employee</label>
                    <select
                      className="w-full p-2 border rounded-md bg-transparent"
                      value={selectedEmp}
                      onChange={e => setSelectedEmp(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">{loading ? "Loading..." : "-- Choose Employee --"}</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} — {emp.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-red-500">LOP Days</label>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={lopDays} onChange={e => setLopDays(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-green-600">Bonus (₹)</label>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={bonus} onChange={e => setBonus(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-600">Overtime (₹)</label>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={overtime} onChange={e => setOvertime(e.target.value)} />
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={processing || !selectedEmp || !salaryData}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                  >
                    {processing
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      : !salaryData && selectedEmp
                        ? "No Salary Structure Found"
                        : "Generate Payslip"
                    }
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-50 dark:bg-slate-900 border-dashed h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salaryData ? (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <PreviewRow label="Basic"     value={salaryData.basic} />
                      <PreviewRow label="HRA"       value={salaryData.hra} />
                      <PreviewRow label="Transport" value={salaryData.transport} />
                      <PreviewRow label="Medical"   value={salaryData.medical} />
                      <PreviewRow label="Bonus+OT"  value={Number(bonus) + Number(overtime)} color="text-green-600" prefix="+" />
                      <div className="border-t pt-2">
                        <PreviewRow label="Gross" value={preview.gross} bold />
                      </div>
                      <PreviewRow label="Deductions" value={preview.deductions} color="text-red-500" prefix="-" />
                      <div className="mt-4 p-4 bg-blue-600 rounded-xl text-white text-center">
                        <p className="text-xs uppercase tracking-widest opacity-80">Net Payable</p>
                        <h2 className="text-3xl font-black mt-1">₹ {preview.net.toLocaleString()}</h2>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                      <Users className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-center text-sm">Select an employee to preview.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Pending ───────────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payroll</CardTitle>
              <CardDescription>
                Employees with salary structure but no payroll processed for {month} {year}
              </CardDescription>
            </div>
            {isPayrollOfficer(userRole) && pending.length > 0 && (
              <Button
                onClick={handleBulkRun}
                disabled={bulkProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {bulkProcessing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  : <><Zap className="mr-2 h-4 w-4" /> Run All ({pending.length})</>
                }
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3 opacity-60" />
                <p className="font-semibold">All employees processed for {month} {year}</p>
                <p className="text-sm mt-1">Nothing pending this month.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">Employee</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold">Employee ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map(emp => (
                    <TableRow key={emp._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-600">
                            {emp.firstName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{emp.department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">
                          {emp.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-blue-600 dark:text-blue-400">
                        {emp.employeeCode || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Records ───────────────────────────────────────────────────── */}
      {activeTab === "records" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Payroll Records</h2>
              <p className="text-sm text-muted-foreground">{month} {year}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecords}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {records.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserX className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No payroll records for {month} {year}.</p>
              </CardContent>
            </Card>
          ) : (
            records.map(record => (
              <RecordCard
                key={record._id}
                record={record}
                employees={employees}
                userRole={userRole}
                onStatusUpdate={handleStatusUpdate}
                onDownload={handleDownload}
              />
            ))
          )}
        </div>
      )}

    </div>
  )
}

// ── RecordCard — expandable payroll record ────────────────────────────────────
const RecordCard = ({ record, employees, userRole, onStatusUpdate, onDownload }) => {
  const [expanded, setExpanded] = useState(false)

  const statusStyle = {
    Generated:     "bg-blue-100 text-blue-700 border-blue-200",
    "HR Approved": "bg-purple-100 text-purple-700 border-purple-200",
    Paid:          "bg-green-100 text-green-700 border-green-200",
  }

  const empCount = record.employees?.length || 0
  const totalNet = record.employees?.reduce((s, e) => s + (e.netPay || 0), 0) || 0

  return (
    <Card className="overflow-hidden">

      {/* ── Summary header row ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
            expanded
              ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600"
              : "bg-muted text-muted-foreground"
          )}>
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </div>
          <div>
            <p className="font-semibold text-sm">{record.month} {record.year}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {empCount} employee{empCount !== 1 ? "s" : ""} · Generated {new Date(record.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Total payout */}
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Total Net Payout</p>
            <p className="text-sm font-bold text-green-600">₹ {totalNet.toLocaleString()}</p>
          </div>

          {/* Status */}
          <Badge variant="outline" className={statusStyle[record.status] || ""}>
            {record.status}
          </Badge>

          {/* Action buttons — stop propagation so click doesn't toggle expand */}
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {record.status === "Generated" && isHRManager(userRole) && (
              <Button size="sm" variant="outline"
                onClick={() => onStatusUpdate(record._id, "HR Approved")}
                className="text-purple-600 border-purple-300 hover:bg-purple-50 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Approve
              </Button>
            )}
            {record.status === "HR Approved" && isPayrollOfficer(userRole) && (
              <Button size="sm" variant="outline"
                onClick={() => onStatusUpdate(record._id, "Paid")}
                className="text-green-600 border-green-300 hover:bg-green-50 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Mark Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded employee breakdown ── */}
      {expanded && (
        <div className="border-t animate-in fade-in slide-in-from-top-1 duration-200">

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-4">Employee</div>
            <div className="col-span-2 text-right">Basic</div>
            <div className="col-span-2 text-right">Gross</div>
            <div className="col-span-2 text-right">Deductions</div>
            <div className="col-span-1 text-right">Net</div>
            <div className="col-span-1 text-right">Slip</div>
          </div>

          {/* Employee rows */}
          {record.employees?.map((emp, idx) => {
            const userInfo = employees.find(e => e._id === emp.employeeId)
            const name     = userInfo
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : "Unknown"
            const initial  = name[0]?.toUpperCase() || "?"

            return (
              <div
                key={emp.employeeId}
                className={cn(
                  "grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm border-b last:border-b-0 transition-colors hover:bg-muted/10",
                  idx % 2 === 0
                    ? "bg-white dark:bg-transparent"
                    : "bg-muted/10"
                )}
              >
                {/* Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    {emp.lopDays > 0 && (
                      <span className="text-[10px] text-red-500 font-semibold">
                        LOP: {emp.lopDays} day{emp.lopDays > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Basic */}
                <div className="col-span-2 text-right text-muted-foreground text-sm">
                  ₹ {(emp.basic || 0).toLocaleString()}
                </div>

                {/* Gross */}
                <div className="col-span-2 text-right font-medium text-sm">
                  ₹ {(emp.grossPay || 0).toLocaleString()}
                </div>

                {/* Deductions */}
                <div className="col-span-2 text-right text-red-500 text-sm">
                  - ₹ {(emp.deductions || 0).toLocaleString()}
                </div>

                {/* Net */}
                <div className="col-span-1 text-right font-bold text-green-600 text-sm">
                  ₹ {(emp.netPay || 0).toLocaleString()}
                </div>

                {/* Download */}
                <div className="col-span-1 flex justify-end">
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600"
                    onClick={() => onDownload(record._id, emp.employeeId)}
                    title={`Download payslip — ${name}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Footer total */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted/30 text-sm font-bold border-t">
            <div className="col-span-4 text-muted-foreground">
              {empCount} employee{empCount !== 1 ? "s" : ""} total
            </div>
            <div className="col-span-2" />
            <div className="col-span-2" />
            <div className="col-span-2" />
            <div className="col-span-1 text-right text-green-600">
              ₹ {totalNet.toLocaleString()}
            </div>
            <div className="col-span-1" />
          </div>
        </div>
      )}
    </Card>
  )
}

// ── PreviewRow ────────────────────────────────────────────────────────────────
const PreviewRow = ({ label, value, color, prefix = "", bold = false }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium", bold && "font-bold", color)}>
      {prefix} ₹ {Number(value || 0).toLocaleString()}
    </span>
  </div>
)

export default PayrollProcessing
