import { useState, useEffect } from "react"
import { Download, Loader2, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import * as payrollService from "@/services/payrollService"
import apiClient from "@/services/apiClient"

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"]

const STATUS_COLORS = {
  Generated:     "bg-blue-100 text-blue-700",
  Verified:      "bg-amber-100 text-amber-800",
  HR_Approved:   "bg-purple-100 text-purple-700",
  "HR Approved": "bg-purple-100 text-purple-700",
  CEO_Approved:  "bg-indigo-100 text-indigo-700",
  Disbursed:     "bg-green-100 text-green-700",
  Locked:        "bg-slate-200 text-slate-800",
  Paid:          "bg-green-100 text-green-700",
}

function normRole(role) {
  const r = typeof role === "string" ? role : role?.name
  return (r || "").toUpperCase().replace(/ /g, "_")
}

const STAFF_SLIP_ROLES = new Set([
  "HR_MANAGER", "HR_OFFICER", "PAYROLL_OFFICER", "FINANCE_MANAGER",
  "ADMIN", "SUPER_ADMIN", "SUPERADMIN", "CEO", "COUNTRY_MANAGER",
  "DEPARTMENT_MANAGER", "DIRECT_MANAGER", "OPERATIONS_MANAGER", "PROJECT_MANAGER",
])

const SalarySlip = () => {
  const { user } = useAuth()
  const isStaff = STAFF_SLIP_ROLES.has(normRole(user?.role))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salary Slips</h1>
        <p className="text-muted-foreground">
          {isStaff ? "View and download employee salary slips." : "View and download your monthly salary slips."}
        </p>
      </div>
      {isStaff ? <HRSlipView /> : <EmployeeSlipView userId={user?._id || user?.id} />}
    </div>
  )
}

const HRSlipView = () => {
  const [employees, setEmployees]   = useState([])
  const [selectedUser, setSelectedUser] = useState("")
  const [month, setMonth]           = useState(MONTHS[new Date().getMonth()])
  const [year, setYear]             = useState(new Date().getFullYear())
  const [slip, setSlip]             = useState(null)
  const [payrollId, setPayrollId]   = useState(null)
  const [loading, setLoading]       = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    apiClient.get("/admin/users", { params: { scope: "payroll" } })
      .then(res => setEmployees(res.data || res.users || []))
      .catch(() => toast.error("Failed to load employees"))
  }, [])

  const handleFetch = async () => {
    if (!selectedUser) { toast.error("Please select an employee"); return }
    setLoading(true)
    setSlip(null)
    setPayrollId(null)
    try {
      const recordsRes = await payrollService.getPayrollRecords(month, year)
      const records    = recordsRes.data || []

      const record = records.find(r =>
        r.employees?.some(e => String(e.employeeId) === String(selectedUser))
      )

      if (!record)
        return void toast.error(`No payroll found for ${month} ${year}`)

      const slipRes = await payrollService.getSalarySlip(record._id, selectedUser)
      const inner = slipRes.data || slipRes
      if (!inner?.slip || !inner?.payroll)
        return void toast.error("Could not load slip for this period")

      setSlip({
        ...inner.slip,
        month: inner.payroll.month,
        year: inner.payroll.year,
        status: inner.payroll.status,
      })
      setPayrollId(record._id)

      // Trigger download immediately
      toast.info("Downloading PDF...")
      try {
        const { blob, filename } = await payrollService.downloadPayslipWithFilename(
          record._id,
          selectedUser
        )
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.setAttribute("download", filename)
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Payslip downloaded")
      } catch (err) {
        toast.error("Failed to download PDF")
      }
    } catch {
      toast.error("Failed to fetch salary slip")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!payrollId || !selectedUser) return
    setDownloading(true)
    try {
      const { blob, filename } = await payrollService.downloadPayslipWithFilename(
        payrollId,
        selectedUser
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.setAttribute("download", filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Payslip downloaded")
    } catch {
      toast.error("Failed to download payslip")
    } finally {
      setDownloading(false)
    }
  }

  const selectedEmp = employees.find(e => String(e._id) === String(selectedUser))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Salary Slip</CardTitle>
          <CardDescription>Select employee and period to view their payslip.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e._id} value={String(e._id)}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Month</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Year</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md bg-transparent text-sm"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            onClick={handleFetch}
            disabled={loading || !selectedUser}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
              : <><FileText className="mr-2 h-4 w-4" /> View Slip</>}
          </Button>
        </CardContent>
      </Card>

      {slip && (
        <SlipCard
          slip={slip}
          employeeName={
            selectedEmp
              ? `${selectedEmp.firstName} ${selectedEmp.lastName}`
              : "Employee"
          }
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  )
}

const EmployeeSlipView = ({ userId }) => {
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeSlip, setActiveSlip] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [openingPayrollId, setOpeningPayrollId] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchRecords = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const res = await payrollService.getEmployeePayrollHistory(userId)
        const rows = res.data ?? []
        setRecords(Array.isArray(rows) ? rows : [])
      } catch {
        toast.error("Failed to load your salary slips")
      } finally {
        setLoading(false)
      }
    }
    void fetchRecords()
  }, [userId])

  const openSlip = async (row) => {
    const pid = String(row.payrollId)
    if (activeSlip?.payrollId === pid) {
      setActiveSlip(null)
      return
    }
    setOpeningPayrollId(pid)
    try {
      const res = await payrollService.getSalarySlip(pid, userId)
      const inner = res.data || res
      if (!inner?.slip || !inner?.payroll) {
        toast.error("Could not load slip details")
        return
      }
      setActiveSlip({
        ...inner.slip,
        month: inner.payroll.month,
        year: inner.payroll.year,
        status: inner.payroll.status,
        payrollId: pid,
      })
    } catch {
      toast.error("Could not load slip details")
    } finally {
      setOpeningPayrollId(null)
    }
  }

  const handleDownload = async (payrollPk) => {
    setDownloading(true)
    try {
      const { blob, filename } = await payrollService.downloadPayslipWithFilename(
        payrollPk,
        userId
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.setAttribute("download", filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Payslip downloaded")
    } catch {
      toast.error("Failed to download payslip")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <Card><CardContent className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </CardContent></Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Salary Slips</CardTitle>
          <CardDescription>Slips appear after payroll has been paid or locked.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No salary slips found yet.
                  </TableCell>
                </TableRow>
              ) : records.map(r => (
                <TableRow key={String(r.payrollId)}>
                  <TableCell className="font-medium">{r.month} {r.year}</TableCell>
                  <TableCell className="font-bold text-green-600">
                    Rs. {Number(r.netPay || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => void openSlip(r)}
                        disabled={openingPayrollId !== null && openingPayrollId !== String(r.payrollId)}
                      >
                        {openingPayrollId === String(r.payrollId)
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <><FileText className="w-3 h-3 mr-1" />
                            {activeSlip?.payrollId === String(r.payrollId) ? "Hide" : "View"}</>}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => void handleDownload(String(r.payrollId))}
                        disabled={downloading}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        {downloading
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3 mr-1" />}
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activeSlip && (
        <SlipCard
          slip={activeSlip}
          employeeName={`${user?.firstName} ${user?.lastName}`}
          onDownload={() => void handleDownload(activeSlip.payrollId)}
          downloading={downloading}
        />
      )}
    </div>
  )
}

function slipEarnings(slip) {
  const e = slip.earnings || {}
  return {
    basic: Number(e.basic ?? slip.basic ?? 0),
    hra: Number(e.hra ?? slip.hra ?? 0),
    allowances: Number(e.allowances ?? slip.allowances ?? 0),
    bonus: Number(e.bonus ?? slip.bonus ?? 0),
    overtime: Number(e.overtime ?? 0),
    reimbursement: Number(e.reimbursement ?? 0),
    performanceBonus: Number(e.performanceBonus ?? 0),
  }
}

function slipDeductionRows(slip) {
  const d = slip.deductions
  if (d != null && typeof d === "number") {
    return { mode: "legacy", rows: [{ label: "Deductions", amount: d }] }
  }
  if (!d || typeof d !== "object") {
    return { mode: "detail", rows: [] }
  }
  const rows = [
    { label: "Provident Fund", amount: Number(d.pf) || 0 },
    { label: "ESI", amount: Number(d.esi) || 0 },
    { label: "Professional Tax", amount: Number(d.pt) || 0 },
    { label: "TDS", amount: Number(d.tds) || 0 },
    { label: "Insurance", amount: Number(d.insurance) || 0 },
    { label: "Other", amount: Number(d.other) || 0 },
    { label: "LOP", amount: Number(d.lopAmount) || 0 },
    { label: "Salary advance", amount: Number(d.advanceTotal) || 0 },
  ].filter((r) => r.amount > 0)
  return { mode: "detail", rows }
}

const SlipCard = ({ slip, employeeName, onDownload, downloading }) => {
  const eg = slipEarnings(slip)
  const gross = Number(slip.grossPay) > 0
    ? Number(slip.grossPay)
    : eg.basic + eg.hra + eg.allowances + eg.bonus + eg.overtime + eg.reimbursement + eg.performanceBonus
  const deductions = Number(slip.totalDeductions ?? slip.deductions ?? 0)
  const dedMeta = slipDeductionRows(slip)

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader className="bg-blue-50 dark:bg-blue-950 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{employeeName}</CardTitle>
            <CardDescription className="text-base mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {slip.month} {slip.year}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={STATUS_COLORS[slip.status] || ""}>
              {slip.status}
            </Badge>
            <Button
              onClick={onDownload}
              disabled={downloading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Download className="w-4 h-4 mr-1" /> Download PDF</>}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                <span className="text-muted-foreground shrink-0">Basic Salary</span>
                <span className="font-medium font-mono tabular-nums text-right">Rs. {eg.basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                <span className="text-muted-foreground shrink-0">HRA</span>
                <span className="font-medium font-mono tabular-nums text-right">Rs. {eg.hra.toLocaleString()}</span>
              </div>
              {eg.allowances > 0 && (
                <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                  <span className="text-muted-foreground shrink-0">Other Allowances</span>
                  <span className="font-medium font-mono tabular-nums text-right">Rs. {eg.allowances.toLocaleString()}</span>
                </div>
              )}
              {eg.bonus > 0 && (
                <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem] text-green-600">
                  <span className="shrink-0">Bonus</span>
                  <span className="font-medium font-mono tabular-nums text-right">Rs. {eg.bonus.toLocaleString()}</span>
                </div>
              )}
              {eg.overtime > 0 && (
                <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                  <span className="text-muted-foreground shrink-0">Overtime</span>
                  <span className="font-medium font-mono tabular-nums text-right">Rs. {eg.overtime.toLocaleString()}</span>
                </div>
              )}
              {(eg.reimbursement + eg.performanceBonus) > 0 && (
                <div className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                  <span className="text-muted-foreground shrink-0">Reimbursement / performance</span>
                  <span className="font-medium font-mono tabular-nums text-right">Rs. {(eg.reimbursement + eg.performanceBonus).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center gap-4 text-sm font-bold min-h-[1.5rem]">
                <span>Gross Salary</span>
                <span className="font-mono tabular-nums text-right">Rs. {Math.round(gross).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Deductions
            </h3>
            <div className="space-y-2">
              {dedMeta.mode === "detail" && dedMeta.rows.length > 0 && dedMeta.rows.map((r) => (
                <div key={r.label} className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                  <span className="text-muted-foreground shrink-0">{r.label}</span>
                  <span className="font-medium font-mono tabular-nums text-right text-red-600/90">
                    − Rs. {r.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              {dedMeta.mode === "legacy" && dedMeta.rows.map((r) => (
                <div key={r.label} className="flex justify-between items-center gap-4 text-sm min-h-[1.5rem]">
                  <span className="text-muted-foreground shrink-0">{r.label}</span>
                  <span className="font-medium font-mono tabular-nums text-right text-red-600/90">
                    − Rs. {Number(r.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center gap-4 text-sm font-bold text-red-600 min-h-[1.5rem]">
                <span>Total</span>
                <span className="font-mono tabular-nums text-right">− Rs. {deductions.toLocaleString()}</span>
              </div>
              {slip.lopDays > 0 && (
                <div className="flex justify-between items-center gap-4 text-sm text-orange-600 min-h-[1.5rem]">
                  <span>LOP Days</span>
                  <span className="font-mono tabular-nums">{slip.lopDays} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white text-center">
          <p className="text-sm uppercase tracking-widest opacity-80">Net Pay</p>
          <h2 className="text-4xl font-bold mt-1">Rs. {Number(slip.netPay || 0).toLocaleString()}</h2>
          <p className="text-sm opacity-70 mt-1">{slip.month} {slip.year}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalarySlip
