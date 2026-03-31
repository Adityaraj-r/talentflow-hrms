import { useState, useEffect } from "react"
import { Download, Loader2, FileText, Calendar, Building, User } from "lucide-react"
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

const HR_ROLES = ["HRMANAGER", "HROFFICER", "PAYROLLOFFICER", "ADMIN", "SUPERADMIN"]

const SalarySlip = () => {
  const { user } = useAuth()
  const userRole = (typeof user?.role === "string" ? user.role : user?.role?.name)?.toUpperCase()
  const isHR     = HR_ROLES.includes(userRole)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salary Slips</h1>
        <p className="text-muted-foreground">
          {isHR ? "View and download employee salary slips." : "View and download your monthly salary slips."}
        </p>
      </div>
      {isHR ? <HRSlipView /> : <EmployeeSlipView userId={user?._id || user?.id} />}
    </div>
  )
}

// ─── HR VIEW — search any employee's slip ───────────────────────────────────
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
    apiClient.get("/admin/users")
      .then(res => setEmployees(res.users || res.data || []))
      .catch(() => toast.error("Failed to load employees"))
  }, [])

  const handleFetch = async () => {
    if (!selectedUser) { toast.error("Please select an employee"); return }
    setLoading(true)
    setSlip(null)
    try {
      // Find payroll record for this month/year
      const recordsRes = await payrollService.getPayrollRecords(month, year)
      const records    = recordsRes.data || []

      // Find the record that contains this employee
      const record = records.find(r =>
        r.employees?.some(e => e.employeeId === selectedUser)
      )

      if (!record)
        return toast.error(`No payroll found for ${month} ${year}`)

      const empSlip = record.employees.find(e => e.employeeId === selectedUser)
      setSlip({ ...empSlip, month: record.month, year: record.year, status: record.status })
      setPayrollId(record._id)
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
      const res = await payrollService.downloadPayslip(payrollId, selectedUser)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement("a")
      a.href    = url
      a.setAttribute("download", `payslip-${selectedUser}-${month}-${year}.pdf`)
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success("Payslip downloaded")
    } catch {
      toast.error("Failed to download payslip")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
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
                    <SelectItem key={e._id} value={e._id}>
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

      {/* Slip Display */}
      {slip && (
        <SlipCard
          slip={slip}
          employeeName={
            employees.find(e => e._id === selectedUser)
              ? `${employees.find(e => e._id === selectedUser).firstName} ${employees.find(e => e._id === selectedUser).lastName}`
              : "Employee"
          }
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  )
}

// ─── EMPLOYEE VIEW — own slips only ─────────────────────────────────────────
const EmployeeSlipView = ({ userId }) => {
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeSlip, setActiveSlip] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await payrollService.getPayrollRecords()
        const all = res.data || []
        // Filter only records that contain this employee
        const myRecords = all.filter(r =>
          r.employees?.some(e => e.employeeId === userId)
        ).map(r => ({
          ...r,
          mySlip: r.employees.find(e => e.employeeId === userId)
        }))
        setRecords(myRecords)
      } catch {
        toast.error("Failed to load your salary slips")
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchRecords()
  }, [userId])

  const handleDownload = async (payrollId) => {
    setDownloading(true)
    try {
      const res = await payrollService.downloadPayslip(payrollId, userId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement("a")
      a.href    = url
      const record = records.find(r => r._id === payrollId)
      a.setAttribute("download", `payslip-${record?.month}-${record?.year}.pdf`)
      document.body.appendChild(a)
      a.click()
      a.remove()
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
      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Salary Slips</CardTitle>
          <CardDescription>Click View to see the detailed breakdown.</CardDescription>
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
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.month} {r.year}</TableCell>
                  <TableCell className="font-bold text-green-600">
                    ₹ {r.mySlip?.netPay?.toLocaleString()}
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
                        onClick={() => setActiveSlip(
                          activeSlip?._id === r._id ? null :
                          { ...r.mySlip, month: r.month, year: r.year, status: r.status, _id: r._id }
                        )}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {activeSlip?._id === r._id ? "Hide" : "View"}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDownload(r._id)}
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

      {/* Expanded Slip */}
      {activeSlip && (
        <SlipCard
          slip={activeSlip}
          employeeName={`${user?.firstName} ${user?.lastName}`}
          onDownload={() => handleDownload(activeSlip._id)}
          downloading={downloading}
        />
      )}
    </div>
  )
}

// ─── SHARED SLIP CARD ────────────────────────────────────────────────────────
const SlipCard = ({ slip, employeeName, onDownload, downloading }) => {
  const gross = slip.basic + slip.hra + (slip.allowances || 0) + (slip.bonus || 0)

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
          {/* Earnings */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Basic Salary</span>
                <span className="font-medium">₹ {slip.basic?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>HRA</span>
                <span className="font-medium">₹ {slip.hra?.toLocaleString()}</span>
              </div>
              {slip.allowances > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Allowances</span>
                  <span className="font-medium">₹ {slip.allowances?.toLocaleString()}</span>
                </div>
              )}
              {slip.bonus > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Bonus</span>
                  <span className="font-medium">₹ {slip.bonus?.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Gross Salary</span>
                <span>₹ {gross?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Deductions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-red-500">
                <span>Total Deductions</span>
                <span className="font-medium">- ₹ {slip.deductions?.toLocaleString()}</span>
              </div>
              {slip.lopDays > 0 && (
                <div className="flex justify-between text-sm text-orange-500">
                  <span>LOP Days</span>
                  <span>{slip.lopDays} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white text-center">
          <p className="text-sm uppercase tracking-widest opacity-80">Net Pay</p>
          <h2 className="text-4xl font-bold mt-1">₹ {slip.netPay?.toLocaleString()}</h2>
          <p className="text-sm opacity-70 mt-1">{slip.month} {slip.year}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalarySlip
