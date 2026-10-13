import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Calculator, Users, Loader2, Download, RefreshCw, CheckCircle, Zap, AlertCircle, UserX, ChevronDown, ChevronUp, ClipboardList, ShieldCheck, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import { StatsCard } from "@/components/ui/stats-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as payrollService from "@/services/payrollService";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const normalizeRole = (role) => (role || "").toUpperCase().replace(/ /g, "_")
const isPayrollOfficer = (role) => ["PAYROLL_OFFICER", "PAYROLLOFFICER"].includes(normalizeRole(role))
const isHRManager = (role) => ["HR_MANAGER", "HRMANAGER"].includes(normalizeRole(role))
const isFinanceManager = (role) => normalizeRole(role) === "FINANCE_MANAGER"
const isCEO = (role) => normalizeRole(role) === "CEO"
const isAdmin = (role) => ["ADMIN", "SUPER_ADMIN", "SUPERADMIN"].includes(normalizeRole(role))
const isCountryManager = (role) => normalizeRole(role) === "COUNTRY_MANAGER"
const isTeamPayrollViewer = (role) =>
  ["DEPARTMENT_MANAGER", "DIRECT_MANAGER", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(normalizeRole(role))
const isHROrPayroll = (role) =>
  isPayrollOfficer(role) || isHRManager(role) || isFinanceManager(role) ||
  ["HR_OFFICER", "HROFFICER"].includes(normalizeRole(role))
const canProcessPayroll = (role) =>
  isPayrollOfficer(role) || isAdmin(role)
const canViewPayrollLists = (role) =>
  isHROrPayroll(role) || isAdmin(role) || isCEO(role) || isCountryManager(role) || isTeamPayrollViewer(role)
const canViewPayrollAudit = (role) => {
  const n = normalizeRole(role)
  return isAdmin(role) || n === "CEO" || n === "FINANCE_MANAGER" || n === "HR_MANAGER" || n === "HRMANAGER"
}
const canViewCompliance = (role) => {
  const n = normalizeRole(role)
  return (
    isAdmin(role) ||
    n === "CEO" ||
    n === "COUNTRY_MANAGER" ||
    n === "FINANCE_MANAGER" ||
    n === "HR_MANAGER" ||
    n === "HRMANAGER" ||
    n === "PAYROLL_OFFICER" ||
    n === "PAYROLLOFFICER"
  )
}

const PayrollProcessing = () => {
  const { user: authUser } = useAuth()
  const userRole = authUser?.role || ""

  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState("")
  const [salaryData, setSalaryData] = useState(null)
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()])
  const [year, setYear] = useState(new Date().getFullYear())
  const [runKind, setRunKind] = useState("regular")
  const [offCycleLabel, setOffCycleLabel] = useState("")
  const [lopDays, setLopDays] = useState(0)
  const [lopAuto, setLopAuto] = useState(true)
  const [bonus, setBonus] = useState(0)
  const [bonusReason, setBonusReason] = useState("")
  const [overtime, setOvertime] = useState(0)
  const [activeTab, setActiveTab] = useState("run")
  const [serverPreview, setServerPreview] = useState(null)
  const [skipLockCheck, setSkipLockCheck] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [pageRecords, setPageRecords] = useState(1)
  const [compliance, setCompliance] = useState(null)
  const [complianceLoading, setComplianceLoading] = useState(false)
  const [selectedPending, setSelectedPending] = useState(new Set())
  const employeesLoadedRef = useRef(false)
  const payrollTabInitRef = useRef(false)

  useEffect(() => {
    if (!canProcessPayroll(userRole) && activeTab === "run") {
      setActiveTab("pending");
    }
  }, [userRole, activeTab]);

  useEffect(() => {
    if (!authUser?.role || payrollTabInitRef.current) return
    payrollTabInitRef.current = true
    if (!canProcessPayroll(authUser.role)) setActiveTab("records")
  }, [authUser?.role])

  useEffect(() => {
    if (activeTab !== "audit" || !canViewPayrollAudit(userRole)) return
    let cancelled = false
    setAuditLoading(true)
    payrollService.getPayrollAuditLogs({ limit: 150 })
      .then(res => {
        if (!cancelled) setAuditLogs(res.data || [])
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load audit log") })
      .finally(() => { if (!cancelled) setAuditLoading(false) })
    return () => { cancelled = true }
  }, [activeTab, userRole])

  useEffect(() => {
    if (activeTab !== "compliance" || !canViewCompliance(userRole)) return
    let cancelled = false
    setComplianceLoading(true)
    payrollService.getPayrollComplianceSummary(month, year)
      .then(res => {
        if (!cancelled) setCompliance(res.data || null)
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load compliance summary") })
      .finally(() => { if (!cancelled) setComplianceLoading(false) })
    return () => { cancelled = true }
  }, [activeTab, userRole, month, year])

  const refreshPayrollTables = useCallback(async () => {
    try {
      const [recRes, pendRes] = await Promise.all([
        payrollService.getPayrollRecords(month, year),
        payrollService.getPendingPayroll(month, year),
      ])
      setRecords(recRes.data || [])
      setPending(pendRes.data?.pending || [])
    } catch { }
  }, [month, year])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const tasks = [
          payrollService.getPayrollRecords(month, year),
          payrollService.getPendingPayroll(month, year),
        ]
        if (!employeesLoadedRef.current) {
          tasks.unshift(
            apiClient.get("/admin/users", { params: { scope: "payroll" } })
          )
        }
        const out = await Promise.all(tasks)
        if (cancelled) return
        let i = 0
        if (!employeesLoadedRef.current) {
          const empRes = out[i++]
          setEmployees(empRes.users || empRes.data || [])
          employeesLoadedRef.current = true
        }
        setRecords(out[i].data || [])
        setPending(out[i + 1].data?.pending || [])
      } catch {
        if (!cancelled) toast.error("Failed to load payroll data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [month, year])

  useEffect(() => {
    if (!selectedEmp) { setSalaryData(null); return }
    const fetchSalary = async () => {
      try {
        const empUser = employees.find(
          e => String(e._id) === String(selectedEmp)
        )
        if (!empUser?.employeeId) { setSalaryData(null); return }
        const res = await apiClient.get(`/employees/${empUser.employeeId}`)
        const emp = res.data || res
        setSalaryData({
          basic: emp.salary?.basic || 0,
          hra: emp.salary?.allowances?.hra || 0,
          transport: emp.salary?.allowances?.transport || 0,
          medical: emp.salary?.allowances?.medical || 0,
          otherAllowance: emp.salary?.allowances?.other || 0,
          pf: emp.salary?.deductions?.pf || 0,
          tax: emp.salary?.deductions?.tax || 0,
          insurance: emp.salary?.deductions?.insurance || 0,
        })
      } catch { setSalaryData(null) }
    }
    fetchSalary()
  }, [selectedEmp, employees])
  useEffect(() => {
    setLopAuto(true)
    setBonus(0)
    setBonusReason("")
  }, [selectedEmp])
  useEffect(() => {
    if (!selectedEmp || !month || !year) {
      setServerPreview(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await payrollService.calculatePayrollPreview({
          month,
          year,
          userId: selectedEmp,
          adjustments: {
            bonus: Number(bonus) || 0,
            bonusReason: bonusReason || "",
            overtime: Number(overtime) || 0,
            useLopOverride: !lopAuto,
            lopDaysOverride: Number(lopDays) || 0,
          },
        })
        const line = res?.data?.line || null
        setServerPreview(line)
        if (line && lopAuto) {
          setLopDays(line.lopDays ?? 0)
        }
      } catch {
        setServerPreview(null)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [selectedEmp, month, year, bonus, bonusReason, overtime, lopDays, lopAuto])

  const calculatePreview = () => {
    if (!salaryData) return { gross: 0, net: 0, deductions: 0 }
    const basic = Number(salaryData.basic) || 0
    const hra = Number(salaryData.hra) || 0
    const transport = Number(salaryData.transport) || 0
    const medical = Number(salaryData.medical) || 0
    const otherAllow = Number(salaryData.otherAllowance) || 0
    const pf = Number(salaryData.pf) || 0
    const tax = Number(salaryData.tax) || 0
    const insurance = Number(salaryData.insurance) || 0
    const gross = basic + hra + transport + medical + otherAllow + Number(bonus) + Number(overtime)
    const lopDed = (basic / 30) * Number(lopDays)
    const deductions = pf + tax + insurance + lopDed
    return {
      gross: Math.round(gross),
      net: Math.round(gross - deductions),
      deductions: Math.round(deductions),
    }
  }

  const preview = calculatePreview()
  const existingRecordForMonth = records.find(
    r => r.month === month && r.year === year && (r.runKind === "off_cycle" ? false : true)
  )
  const isEditingExisting = !!(
    existingRecordForMonth &&
    selectedEmp &&
    existingRecordForMonth.employees?.some(e => {
      const empUser = employees.find(emp => String(emp._id) === String(selectedEmp))
      return empUser?.employeeId && e.employeeId === empUser.employeeId
    })
  )

  const payrollLockToast = (err, fallback) => {
    let msg = err?.error || err?.message || fallback
    const pl = err?.payrollLock
    if (pl?.sampleUnlockedDates?.length) {
      msg += ` Sample unlocked dates: ${pl.sampleUnlockedDates.slice(0, 5).join(", ")}.`
    }
    return msg
  }

  const handleGenerate = async () => {
    if (!selectedEmp) { toast.error("Please select an employee"); return }
    if (runKind === "off_cycle" && !offCycleLabel.trim()) {
      toast.error("Please enter Off Cycle Label")
      return
    }
    if (!salaryData) { toast.error("No salary structure found for this employee"); return }
    setProcessing(true)
    try {
      await payrollService.generatePayroll({
        month,
        year,
        employeeIds: [selectedEmp],

        runKind,
        offCycleLabel:
          runKind === "off_cycle"
            ? offCycleLabel.trim()
            : undefined,

        replaceExisting: runKind === "regular",

        adjustments: {
          [selectedEmp]: {
            bonus: Number(bonus) || 0,
            bonusReason: bonusReason || "",
            overtime: Number(overtime) || 0,
            useLopOverride: !lopAuto,
            lopDaysOverride: Number(lopDays) || 0,
          },
        },
        requireAttendancePeriodLocked: !skipLockCheck,
        skipAttendanceLockCheck: skipLockCheck,
      })
      toast.success("Payroll generated successfully!")
      setBonus(0)
      setOvertime(0)
      setBonusReason("")
      setSelectedEmp("")
      setLopDays(0)
      setLopAuto(true)

      setRunKind("regular")
      setOffCycleLabel("")
      await refreshPayrollTables()
    } catch (err) {
      toast.error(payrollLockToast(err, "Failed to generate payroll"))
    } finally {
      setProcessing(false)
    }
  }
  const togglePendingSelection = (id) => {
    setSelectedPending(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAllPending = () => {
    setSelectedPending(prev =>
      prev.size === pending.length ? new Set() : new Set(pending.map(e => e._id))
    )
  }

  const handleRunSelected = async () => {
    const idsToProcess = Array.from(selectedPending);

    if (idsToProcess.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    setBulkProcessing(true);

    try {
      await payrollService.generatePayroll({
        month,
        year,

        employeeIds: idsToProcess,

        runKind,

        offCycleLabel:
          runKind === "off_cycle"
            ? (offCycleLabel || `Late Payroll ${month} ${year}`)
            : undefined,

        replaceExisting: runKind === "regular",

        requireAttendancePeriodLocked: !skipLockCheck,
        skipAttendanceLockCheck: skipLockCheck,
      });

      toast.success(
        `Payroll generated for ${idsToProcess.length} selected employee${idsToProcess.length > 1 ? "s" : ""
        }!`
      );

      setSelectedPending(new Set());

      await refreshPayrollTables();

      setActiveTab("records");
    } catch (err) {
      toast.error(payrollLockToast(err, "Payroll run failed"));
    } finally {
      setBulkProcessing(false);
    }
  };
  const handleBulkRun = async () => {
    if (pending.length === 0) {
      toast.error("No pending employees for this month");
      return;
    }

    setBulkProcessing(true);

    try {
      const employeeIds = pending.map(e => e._id);

      await payrollService.generatePayroll({
        month,
        year,

        employeeIds,

        replaceExisting: runKind === "regular",

        runKind,

        offCycleLabel:
          runKind === "off_cycle"
            ? (offCycleLabel || `Late Payroll ${month} ${year}`)
            : undefined,

        requireAttendancePeriodLocked: !skipLockCheck,
        skipAttendanceLockCheck: skipLockCheck,
      });

      toast.success(`Payroll generated for ${employeeIds.length} employees!`);

      await refreshPayrollTables();

      setActiveTab("records");
    } catch (err) {
      toast.error(payrollLockToast(err, "Bulk payroll run failed"));
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleStatusUpdate = async (id, status, extra = {}) => {
    try {
      await payrollService.updatePayrollStatus(id, status, extra)
      toast.success(`Payroll ${status === "HR Approved" ? "approved" : "marked as Paid"}`)
      await refreshPayrollTables()
    } catch (err) {
      toast.error(err?.error || err?.message || "Failed to update status")
    }
  }

  const handleDownload = async (payrollId, employeeId) => {
    try {
      const { blob, filename } = await payrollService.downloadPayslipWithFilename(
        payrollId,
        employeeId
      )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download payslip")
    }
  }
  const processedEmployeeIds = new Set(
    records
      .filter(
        r =>
          r.month === month &&
          Number(r.year) === Number(year)
      )
      .flatMap(r => (r.employees || []).map(e => String(e.employeeId)))
  )
  const availableEmployees =
    runKind === "off_cycle"
      ? employees.filter(emp => !processedEmployeeIds.has(String(emp._id)))
      : employees

  const pendingColumns = useMemo(() => {
    const cols = [];
    if (canProcessPayroll(userRole)) {
      cols.push({
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={pending.length > 0 && selectedPending.size === pending.length}
            onChange={toggleSelectAllPending}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedPending.has(row.original._id)}
            onChange={() => togglePendingSelection(row.original._id)}
          />
        ),
      });
    }

    cols.push({
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-600">
              {emp.firstName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-sm">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-muted-foreground">{emp.email}</p>
            </div>
          </div>
        );
      }
    });

    cols.push({
      accessorKey: "department",
      header: () => <div className="w-full flex justify-center">Department</div>,
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          <span className="text-sm">{row.original.department || "—"}</span>
        </div>
      )
    });

    cols.push({
      accessorKey: "role",
      header: () => <div className="w-full flex justify-center">Role</div>,
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">
            {row.original.role}
          </Badge>
        </div>
      )
    });

    cols.push({
      accessorKey: "employeeCode",
      header: "Employee ID",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
          {row.original.employeeCode || "—"}
        </span>
      )
    });

    return cols;
  }, [userRole, pending.length, selectedPending]);

  const auditColumns = useMemo(() => [
    {
      accessorKey: "createdAt",
      header: "When",
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—"}
        </span>
      )
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <span className="text-xs font-mono">{row.original.action}</span>
      )
    },
    {
      accessorKey: "actorEmail",
      header: "Actor",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.actorEmail || row.original.actorUserId || "—"}</span>
      )
    },
    {
      accessorKey: "entityType",
      header: "Entity",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.entityType} / {String(row.original.entityId || "").slice(0, 12)}…</span>
      )
    }
  ], []);

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Payroll</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            {isTeamPayrollViewer(userRole)
              ? "Team payroll visibility (department / reporting scope)."
              : "Manage and process monthly employee payroll."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">

          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="number"
            className="w-24 p-2 border rounded-md bg-transparent text-sm"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />

          <Select value={runKind} onValueChange={setRunKind}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular Payroll</SelectItem>
              <SelectItem value="off_cycle">Off Cycle Payroll</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard title="Total Records" value={records.length} icon={Users} variant="purple" />
        <StatsCard title="Pending This Month" value={pending.length} icon={AlertCircle} variant="amber" />
        <StatsCard title="Paid This Month" value={records.filter(r => ["Paid", "Disbursed", "Locked"].includes(r.status)).reduce((sum, r) => sum + (r.employees?.length || 0), 0)} icon={CheckCircle} variant="emerald" />
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {[
          { key: "run", label: "Run Payroll", show: canProcessPayroll(userRole) },
          { key: "pending", label: `Pending (${pending.length})`, show: canViewPayrollLists(userRole) },
          { key: "records", label: "Records", show: canViewPayrollLists(userRole) },
          { key: "compliance", label: "Compliance (PF / ESI / TDS)", show: canViewCompliance(userRole) },
          { key: "audit", label: "Audit log", show: canViewPayrollAudit(userRole) },
        ].filter(t => t.show).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "run" && canProcessPayroll(userRole) && (
        <div className="space-y-4">

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={skipLockCheck}
              onChange={e => setSkipLockCheck(e.target.checked)}
            />
            Skip attendance lock check (emergency / dev only)
          </label>

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

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle>Single Employee Payroll</CardTitle>
                  <CardDescription>Process payroll for one employee with custom adjustments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Employee</label>
                    <Select value={selectedEmp} onValueChange={setSelectedEmp} disabled={loading}>
                      <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "-- Choose Employee --"} /></SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map(emp => (
                          <SelectItem key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} — {emp.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {runKind === "off_cycle" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Off Cycle Label
                      </label>

                      <input
                        type="text"
                        className="w-full p-2 border rounded-md bg-transparent"
                        placeholder="Example: Missed Employees / New Joiners / Bonus Payroll"
                        value={offCycleLabel}
                        onChange={(e) => setOffCycleLabel(e.target.value)}
                      />

                      <p className="text-xs text-muted-foreground">
                        This label identifies why this off-cycle payroll is being created.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-red-500">LOP Days</label>
                        {!lopAuto && (
                          <button type="button" onClick={() => setLopAuto(true)}
                            className="text-[11px] text-purple-600 hover:underline">
                            Reset to auto
                          </button>
                        )}
                      </div>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={lopDays}
                        onChange={e => { setLopDays(e.target.value); setLopAuto(false) }} />
                      {lopAuto && (
                        <p className="text-[11px] text-muted-foreground">Auto-calculated from attendance</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-green-600">Extra Bonus (₹)</label>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={bonus} onChange={e => setBonus(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-600">Extra Overtime (₹)</label>
                      <input type="number" min="0"
                        className="w-full p-2 border rounded-md bg-transparent"
                        value={overtime} onChange={e => setOvertime(e.target.value)} />
                    </div>
                  </div>

                  {Number(bonus) > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason for extra bonus</label>
                      <input type="text" maxLength={300}
                        placeholder="e.g. Diwali bonus, spot award, project completion..."
                        className="w-full p-2 border rounded-md bg-transparent text-sm"
                        value={bonusReason} onChange={e => setBonusReason(e.target.value)} />
                    </div>
                  )}

                  {Number(serverPreview?.earnings?.performanceBonus) > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30 px-3 py-2 text-sm">
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Performance bonus (auto, already included in gross):
                      </span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        ₹ {Number(serverPreview.earnings.performanceBonus).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {Number(serverPreview?.earnings?.overtimeAuto) > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/30 px-3 py-2 text-sm">
                      <span className="font-medium text-purple-700 dark:text-purple-400">
                        Auto overtime (from approved attendance hours):
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-400">
                        ₹ {Number(serverPreview.earnings.overtimeAuto).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={
                      processing ||
                      !selectedEmp ||
                      !salaryData ||
                      (runKind === "off_cycle" && availableEmployees.length === 0)
                    }
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
                  >
                    {processing
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      : !salaryData && selectedEmp
                        ? "No Salary Structure Found"
                        : isEditingExisting
                          ? "Update Payslip (Edit Existing)"
                          : "Generate Payslip"
                    }
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-slate-50 dark:bg-slate-900 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salaryData ? (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Engine preview (matches run)</p>
                      {serverPreview ? (
                        <>
                          <PreviewRow label="Basic" value={serverPreview.earnings?.basic} />
                          <PreviewRow label="HRA" value={serverPreview.earnings?.hra} />
                          <PreviewRow label="Allowances" value={serverPreview.earnings?.allowances} />
                          <PreviewRow label="Bonus" value={serverPreview.earnings?.bonus} />
                          <PreviewRow label="OT / reimb. / perf." value={
                            (serverPreview.earnings?.overtime || 0) +
                            (serverPreview.earnings?.reimbursement || 0) +
                            (serverPreview.earnings?.performanceBonus || 0)
                          } />
                          <div className="border-t pt-2">
                            <PreviewRow label="Gross" value={serverPreview.grossPay} bold />
                          </div>
                          <div className="border-t pt-2 space-y-1.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deduction breakdown</p>
                            {Number(serverPreview.deductions?.pf) > 0 && (
                              <PreviewRow label="Provident Fund (PF)" value={serverPreview.deductions.pf} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.esi) > 0 && (
                              <PreviewRow label="ESI" value={serverPreview.deductions.esi} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.pt) > 0 && (
                              <PreviewRow label="Professional Tax" value={serverPreview.deductions.pt} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.tds) > 0 && (
                              <PreviewRow label="TDS" value={serverPreview.deductions.tds} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.insurance) > 0 && (
                              <PreviewRow label="Insurance" value={serverPreview.deductions.insurance} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.other) > 0 && (
                              <PreviewRow label="Other" value={serverPreview.deductions.other} color="text-red-500" prefix="-" />
                            )}
                            {Number(serverPreview.deductions?.lopAmount) > 0 && (
                              <PreviewRow
                                label={`LOP deduction (${serverPreview.lopDays} day${serverPreview.lopDays > 1 ? "s" : ""})`}
                                value={serverPreview.deductions.lopAmount}
                                color="text-red-500"
                                prefix="-"
                              />
                            )}
                            {Number(serverPreview.deductions?.advanceTotal) > 0 && (
                              <PreviewRow label="Salary advance recovery" value={serverPreview.deductions.advanceTotal} color="text-red-500" prefix="-" />
                            )}
                          </div>
                          <PreviewRow label="Total deductions" value={serverPreview.totalDeductions} color="text-red-500" prefix="-" bold />
                          <div className="mt-4 p-4 bg-purple-600 rounded-xl text-white text-center">
                            <p className="text-xs uppercase tracking-widest opacity-80">Net Payable</p>
                            <h2 className="text-3xl font-black mt-1">₹ {Number(serverPreview.netPay).toLocaleString()}</h2>
                          </div>
                        </>
                      ) : (
                        <>
                          <PreviewRow label="Basic" value={salaryData.basic} />
                          <PreviewRow label="HRA" value={salaryData.hra} />
                          <PreviewRow label="Transport" value={salaryData.transport} />
                          <PreviewRow label="Medical" value={salaryData.medical} />
                          <PreviewRow label="Bonus+OT" value={Number(bonus) + Number(overtime)} color="text-green-600" prefix="+" />
                          <div className="border-t pt-2">
                            <PreviewRow label="Gross (local est.)" value={preview.gross} bold />
                          </div>
                          <PreviewRow label="Deductions (local est.)" value={preview.deductions} color="text-red-500" prefix="-" />
                          <div className="mt-4 p-4 bg-slate-200 dark:bg-slate-800 rounded-xl text-center text-muted-foreground text-sm">
                            Loading engine preview…
                          </div>
                        </>
                      )}
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

      {activeTab === "pending" && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payroll</CardTitle>
              <CardDescription>
                Employees with salary structure but no payroll processed for {month} {year}
              </CardDescription>
            </div>
            {canProcessPayroll(userRole) && pending.length > 0 && (
              <div className="flex gap-2">
                {selectedPending.size > 0 && (
                  <Button
                    onClick={handleRunSelected}
                    disabled={bulkProcessing}
                    variant="outline"
                    className="border-purple-500 text-purple-600"
                  >
                    {bulkProcessing
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      : <>Run Selected ({selectedPending.size})</>
                    }
                  </Button>
                )}
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
              </div>
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
              <DataTable
                columns={pendingColumns}
                data={pending}
                searchable={false}
                defaultPageSize={10}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "records" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Payroll Records</h2>
              <p className="text-sm text-muted-foreground">{month} {year}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshPayrollTables()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {records.length === 0 ? (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserX className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No payroll records for {month} {year}.</p>
              </CardContent>
            </Card>
          ) : (
            records.slice((pageRecords - 1) * 10, pageRecords * 10).map(record => (
              <RecordCard
                key={record._id}
                record={record}
                employees={employees}
                userRole={userRole}
                onStatusUpdate={handleStatusUpdate}
                onDownload={handleDownload}
                onRefresh={() => void refreshPayrollTables()}
              />
            ))
          )}
          {records.length > 0 && (
            <Pagination
              currentPage={pageRecords}
              totalPages={Math.ceil(records.length / 10)}
              totalItems={records.length}
              itemsPerPage={10}
              onPageChange={setPageRecords}
            />
          )}
        </div>
      )}

      {activeTab === "compliance" && canViewCompliance(userRole) && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Statutory summary ({month} {year})
            </CardTitle>
            <CardDescription>
              Aggregated PF, ESI, TDS, and professional tax from payroll lines for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complianceLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : compliance?.totals ? (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <p>Runs: <span className="font-semibold">{compliance.runs}</span></p>
                <p>Employee lines: <span className="font-semibold">{compliance.employeeLines}</span></p>
                <p>PF: <span className="font-medium">₹ {Number(compliance.totals.pf || 0).toLocaleString()}</span></p>
                <p>ESI: <span className="font-medium">₹ {Number(compliance.totals.esi || 0).toLocaleString()}</span></p>
                <p>TDS: <span className="font-medium">₹ {Number(compliance.totals.tds || 0).toLocaleString()}</span></p>
                <p>PT: <span className="font-medium">₹ {Number(compliance.totals.pt || 0).toLocaleString()}</span></p>
                <p className="sm:col-span-2 pt-2 border-t font-semibold">
                  Total statutory: ₹ {Number(compliance.totals.statutory || 0).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No compliance data for this period.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "audit" && canViewPayrollAudit(userRole) && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Payroll audit trail
            </CardTitle>
            <CardDescription>Payroll runs, workflow steps, settings changes, and bank exports.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <DataTable
                columns={auditColumns}
                data={auditLogs}
                searchable={false}
                defaultPageSize={10}
              />
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}

const RecordCard = ({ record, employees, userRole, onStatusUpdate, onDownload, onRefresh }) => {
  const [expanded, setExpanded] = useState(false)
  const [payRef, setPayRef] = useState("")
  const [confirmTok, setConfirmTok] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)

  const statusStyle = {
    Generated:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40",

    Verified:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",

    HR_Approved:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40",

    CEO_Approved:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40",

    Disbursed:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40",

    Locked:
      "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600",

    "HR Approved":
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40",

    Paid:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40",
  }

  const runWorkflow = async (action, body = {}, headers = {}) => {
    try {
      await payrollService.patchPayrollWorkflow(record._id, { action, ...body }, { headers })
      toast.success("Payroll updated")
      onRefresh?.()
    } catch (e) {
      toast.error(e?.error || e?.message || "Workflow action failed")
    }
  }
  const handleRegenerate = async (rec) => {
    if (isRegenerating) return

    setIsRegenerating(true)

    try {
      const employeeIds = [
        ...new Set(
          rec.employees.map(emp => String(emp.employeeId))
        )
      ]

      await payrollService.generatePayroll({
        month: rec.month,
        year: rec.year,
        employeeIds,
        replaceExisting: true,
      })

      toast.success("Payroll regenerated")
      onRefresh?.()
    } catch (e) {
      toast.error(e?.error || e?.message || "Regenerate failed")
    } finally {
      setIsRegenerating(false)
    }
  }
  const exportBank = async (e) => {
    e.stopPropagation()
    try {
      const blob = await payrollService.exportPayrollBankCsv(record._id)
      const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]))
      const a = document.createElement("a")
      a.href = url
      a.download = `payroll-bank-${record._id}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Bank CSV downloaded")
      onRefresh?.()
    } catch (e) {
      toast.error(e?.error || e?.message || "Export failed")
    }
  }

  const empCount = record.employees?.length || 0
  const totalNet = record.employees?.reduce((s, e) => s + (e.netPay || 0), 0) || 0
  const st = record.status
  const displayStatus = record.rejectionReason ? "Rejected" : st
  return (
    <Card className="overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30">

      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
            expanded
              ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600"
              : "bg-muted text-muted-foreground"
          )}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-sm">{record.month} {record.year}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {empCount} employee{empCount !== 1 ? "s" : ""} · {record.runKind === "off_cycle" ? "Off-cycle" : "Regular"}
              {record.ceoApprovalRequired && (
                <span className="ml-2 text-orange-600 font-medium">CEO gate</span>
              )}
              {record.financeApprovalRequired && (
                <span className="ml-2 text-purple-600 font-medium">Finance gate</span>
              )}
            </p>
            {record.rejectionReason && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-red-600">
                  Rejected at {record.rejectedAtStage} by {record.rejectedBy}: "{record.rejectionReason}"
                </p>

                {isPayrollOfficer(userRole) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                    disabled={isRegenerating}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRegenerate(record)
                    }}
                  >
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="text-right hidden sm:block mr-2">
            <p className="text-xs text-muted-foreground">Total Net</p>
            <p className="text-sm font-bold text-green-600">₹ {totalNet.toLocaleString()}</p>
          </div>

          <Badge
            variant="outline"
            className={
              record.rejectionReason
                ? "bg-red-100 text-red-700 border-red-200"
                : statusStyle[st] || ""
            }
          >
            {displayStatus}
          </Badge>
          {record.rejectionReason && (
            <p className="text-xs text-red-600 mt-1">
              Rejected during <b>{record.rejectedAtStage}</b>
            </p>
          )}

          <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {(isFinanceManager(userRole) || isAdmin(userRole)) &&
              st === "Generated" &&
              !record.rejectionReason && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => runWorkflow("verify")}>
                    Verify
                  </Button>
                  <input
                    className="h-8 w-64 px-2 text-xs border rounded"
                    placeholder="Reject reason"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <Button size="sm" variant="destructive" className="text-xs h-8"
                    disabled={!rejectReason.trim()}
                    onClick={() => runWorkflow("reject", { reason: rejectReason })}> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                </>
              )}
            {(isHRManager(userRole) || isAdmin(userRole)) &&
              !record.rejectionReason &&
              (
                st === "Verified" ||
                (st === "Generated" && !record.financeApprovalRequired)
              ) && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => runWorkflow("hr_approve")}>
                    HR Approve
                  </Button>
                  <input
                    className="h-8 w-64 px-2 text-xs border rounded"
                    placeholder="Reject reason"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <Button size="sm" variant="destructive" className="text-xs h-8"
                    disabled={!rejectReason.trim()}
                    onClick={() => runWorkflow("reject", { reason: rejectReason })}> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                </>
              )}
            {(isCEO(userRole) || isAdmin(userRole)) &&
              !record.rejectionReason &&
              st === "HR_Approved" && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => runWorkflow("ceo_approve")}>
                    CEO Approve
                  </Button>
                  <input
                    className="h-8 w-64 px-2 text-xs border rounded"
                    placeholder="Reject reason"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <Button size="sm" variant="destructive" className="text-xs h-8"
                    disabled={!rejectReason.trim()}
                    onClick={() => runWorkflow("reject", { reason: rejectReason })}> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                </>
              )}
            {(isPayrollOfficer(userRole) || isAdmin(userRole)) && st === "CEO_Approved" && (
              <>
                <input
                  className="h-8 w-28 px-2 text-xs border rounded"
                  placeholder="UTR / ref"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                />
                <input
                  className="h-8 w-28 px-2 text-xs border rounded"
                  placeholder="2FA token"
                  value={confirmTok}
                  onChange={e => setConfirmTok(e.target.value)}
                />
                <Button
                  size="sm"
                  className="text-xs h-8 bg-green-600"
                  onClick={() =>
                    runWorkflow(
                      "disburse",
                      { paymentReference: payRef },
                      confirmTok ? { "x-payroll-disburse-confirmation": confirmTok } : {}
                    )
                  }
                >
                  Disburse
                </Button>
              </>
            )}
            {(isFinanceManager(userRole) || isAdmin(userRole)) && (st === "Disbursed" || st === "Paid") && (
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => runWorkflow("lock")}>
                Lock
              </Button>
            )}
            {(isFinanceManager(userRole) || isPayrollOfficer(userRole) || isAdmin(userRole)) &&
              (isPayrollOfficer(userRole) || isAdmin(userRole)) &&
              ["Generated", "Verified", "HR_Approved", "CEO_Approved", "Disbursed", "HR Approved"].includes(st) && (
                <Button size="sm" variant="secondary" className="text-xs h-8" onClick={exportBank}>
                  Bank CSV
                </Button>
              )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t animate-in fade-in slide-in-from-top-1 duration-200">

          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-4">Employee</div>
            <div className="col-span-2 text-right">Basic</div>
            <div className="col-span-2 text-right">Gross</div>
            <div className="col-span-2 text-right">Deductions</div>
            <div className="col-span-1 text-right">Net</div>
            <div className="col-span-1 text-right">Slip</div>
          </div>

          {record.employees?.map((emp, idx) => {
            const userInfo = employees.find(e => String(e._id) === String(emp.employeeId))
            const name = userInfo
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : "Unknown"
            const initial = name[0]?.toUpperCase() || "?"

            return (
              <div
                key={emp.employeeId}
                className={cn(
                  "grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm border-b last:border-b-0 transition-colors duration-200 cursor-pointer hover:bg-primary/5",
                  idx % 2 === 0
                    ? "bg-white dark:bg-transparent"
                    : "bg-muted/10"
                )}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
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

                <div className="col-span-2 text-right text-muted-foreground text-sm">
                  ₹ {(emp.earnings?.basic ?? emp.basic ?? 0).toLocaleString()}
                </div>

                <div className="col-span-2 text-right font-medium text-sm">
                  ₹ {(emp.grossPay || 0).toLocaleString()}
                </div>

                <div className="col-span-2 text-right text-red-500 text-sm">
                  - ₹ {(emp.totalDeductions ?? emp.deductions ?? 0).toLocaleString()}
                </div>

                <div className="col-span-1 text-right font-bold text-green-600 text-sm">
                  ₹ {(emp.netPay || 0).toLocaleString()}
                </div>

                <div className="col-span-1 flex justify-end">
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600"
                    onClick={() => onDownload(record._id, emp.employeeId)}
                    title={`Download payslip — ${name}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}

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

const PreviewRow = ({ label, value, color, prefix = "", bold = false }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium", bold && "font-bold", color)}>
      {prefix} ₹ {Number(value || 0).toLocaleString()}
    </span>
  </div>
)

export default PayrollProcessing
