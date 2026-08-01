import { useState, useEffect } from "react";
import { Calculator, Check, X, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as payrollService from "@/services/payrollService";
import apiClient from "@/services/apiClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronsUpDown, Check as CheckIcon } from "lucide-react";
import { Eye } from "lucide-react";


const normStaffRole = (user) => {
  const r = typeof user?.role === "string" ? user.role : user?.role?.name;
  return (r || "").toUpperCase().replace(/[\s_-]/g, "");
};

const canManageIndemnity = (user) => {
  const n = normStaffRole(user);
  return new Set(["PAYROLLOFFICER", "ADMIN", "SUPERADMIN"]).has(n);
};

const canApproveIndemnity = (user) => {
  const n = normStaffRole(user);
  return new Set([
    "HRMANAGER", "HROFFICER", "PAYROLLOFFICER", "FINANCEMANAGER", "CEO",
    "ADMIN", "SUPERADMIN",
  ]).has(n);
};

const STATUS_COLORS = {
  Pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Paid:     "bg-blue-100 text-blue-700 border-blue-200",
};

/** Small reusable icon button with a hover tooltip. */
const ViewButton = ({ onClick, label = "View details" }) => (
  <Button size="icon" variant="ghost" onClick={onClick} title={label}>
    <Eye className="h-4 w-4" />
  </Button>
);


const Indemnity = () => {
  const { user } = useAuth();
  const isStaff = canManageIndemnity(user);
  const canApprove = canApproveIndemnity(user);
  const defaultTab = isStaff ? "calculator" : canApprove ? "pending" : "history";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indemnity Management</h1>
        <p className="text-muted-foreground">Calculate and manage gratuity payments under Indian labour law.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {isStaff && <TabsTrigger value="calculator">Calculator</TabsTrigger>}
          {canApprove && <TabsTrigger value="pending">Pending approvals</TabsTrigger>}
          <TabsTrigger value="history">All indemnities</TabsTrigger>
        </TabsList>

        {isStaff && (
          <TabsContent value="calculator" className="mt-4">
            <IndemnityCalculator />
          </TabsContent>
        )}
        {canApprove && (
          <TabsContent value="pending" className="mt-4">
            <PendingIndemnities />
          </TabsContent>
        )}
        <TabsContent value="history" className="mt-4">
          <IndemnityHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const IndemnityCalculator = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [form, setForm] = useState({
    employeeId: "", employeeName: "",
    joiningDate: "", lastWorkingDate: "",
    basicSalary: "", da: "", reason: "", notes: "",
  });

  useEffect(() => {
    apiClient.get("/admin/users?limit=1000").then(res => {
      setEmployees(res.users || res.data || []);
    }).catch(() => {});
  }, []);

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setResult(null);
  };

 const handleEmployeeChange = async (id) => {
    const emp = employees.find(e => e._id === id);
    setForm(p => ({
      ...p,
      employeeId: id,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      basicSalary: "",
      da: "",
    }));
    setResult(null);
    if (emp?.employeeId) {
      try {
        const res = await apiClient.get(`/employees/${emp.employeeId}`);
        const empDetails = res.data || res;
        setForm(p => ({
          ...p,
          basicSalary: empDetails?.salary?.basic ? String(Math.round(empDetails.salary.basic / 12)) : "",
          da: empDetails?.salary?.da ? String(Math.round(empDetails.salary.da / 12)) : "",
        }));
      } catch {
        toast.error("Could not load salary details for this employee");
      }
    }
  };

  const handleCalculate = async () => {
    if (!form.basicSalary || !form.joiningDate || !form.lastWorkingDate || !form.reason) {
      toast.error("Reason, basic monthly salary, joining date and last working date are required");
      return;
    }
    setCalculating(true);
    try {
      const res = await payrollService.calculateIndemnity({
        basicSalary: Number(form.basicSalary),
        da: Number(form.da) || 0,
        joiningDate: form.joiningDate,
        lastWorkingDate: form.lastWorkingDate,
        reason: form.reason,
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employeeId || !form.reason || !result) {
      toast.error("Please select employee, reason and calculate first");
      return;
    }
    setSubmitting(true);
    try {
      await payrollService.createIndemnity({
        ...form,
        basicSalary: Number(form.basicSalary),
        da: Number(form.da) || 0,
        yearsOfService: result.yearsOfService,
        roundedYearsOfService: result.roundedYearsOfService,
        calculatedAmount: result.calculatedAmount,
      });
      toast.success("Indemnity request submitted for approval");
      setForm({
        employeeId: "", employeeName: "",
        joiningDate: "", lastWorkingDate: "",
        basicSalary: "", da: "", reason: "", notes: "",
      });
      setResult(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageIndemnity(user)) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          You don't have permission to create indemnity requests.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Gratuity Calculator</CardTitle>
            <CardDescription>
              Calculate gratuity under the Payment of Gratuity Act, 1972.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Employee <span className="text-red-500">*</span></Label>
                <Popover open={employeePickerOpen} onOpenChange={(open) => {
                  setEmployeePickerOpen(open);
                  if (!open) setEmployeeSearch("");
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeePickerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.employeeName || "Select employee"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search employee..."
                        value={employeeSearch}
                        onChange={e => setEmployeeSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {employees
                        .filter(e =>
                          `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase())
                        )
                        .map(e => (
                          <button
                            key={e._id}
                            type="button"
                            onClick={() => {
                              handleEmployeeChange(e._id);
                              setEmployeePickerOpen(false);
                              setEmployeeSearch("");
                            }}
                            className="flex w-full items-center px-3 py-2 text-sm text-left hover:bg-muted"
                          >
                            <CheckIcon
                              className={`mr-2 h-4 w-4 ${form.employeeId === e._id ? "opacity-100" : "opacity-0"}`}
                            />
                            {e.firstName} {e.lastName}
                          </button>
                        ))}
                      {employees.filter(e =>
                        `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="px-3 py-4 text-sm text-center text-muted-foreground">No employee found.</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Reason <span className="text-red-500">*</span></Label>
                <Select value={form.reason} onValueChange={v => set("reason", v)}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="end-of-contract">End of Contract</SelectItem>
                    <SelectItem value="retrenchment">Retrenchment</SelectItem>
                    <SelectItem value="death">Death (bypasses 5-year rule)</SelectItem>
                    <SelectItem value="permanent-disablement">Permanent disablement (bypasses 5-year rule)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Joining Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.joiningDate}
                  onChange={e => set("joiningDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Last Working Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.lastWorkingDate}
                  onChange={e => set("lastWorkingDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Basic Monthly Salary (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" placeholder="Select an employee to auto-fill"
                  value={form.basicSalary} readOnly disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Sourced from payroll records — not editable.</p>
              </div>

              <div className="space-y-2">
                <Label>Dearness Allowance (₹)</Label>
                <Input type="number" min="0" placeholder="Select an employee to auto-fill"
                  value={form.da} readOnly disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Sourced from payroll records — not editable.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." rows={3}
                  value={form.notes} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCalculate} disabled={calculating}>
              {calculating
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</>
                : <><Calculator className="mr-2 h-4 w-4" /> Calculate Gratuity</>}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !result}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                : "Submit for Approval"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Gratuity Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/* Final amount — the focal point, shown first */}
                <div className="p-5 bg-white dark:bg-black rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Gratuity Amount</p>
                  <h2 className="text-4xl font-bold text-blue-600 mt-1">
                    ₹ {result.calculatedAmount.toLocaleString("en-IN")}
                  </h2>
                  {result.breakdown.cappedAtCeiling && (
                    <p className="text-xs text-amber-600 mt-2">
                      Capped at the statutory ceiling of ₹20,00,000
                    </p>
                  )}
                  {result.roundedYearsOfService < 5 && !["death", "permanent-disablement"].includes(form.reason) && (
                    <p className="text-xs text-red-500 mt-2">
                      Not eligible — under 5 years of continuous service
                    </p>
                  )}
                </div>

                {/* Inputs used, grouped in one card */}
                <div className="rounded-lg border divide-y">
                  <div className="flex justify-between items-center px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Service Duration</span>
                    <span className="font-medium">
                      {(result.yearsOfService.years + result.yearsOfService.months / 12 + result.yearsOfService.days / 365.25).toFixed(2)} yrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Years Used for Calculation</span>
                    <span className="font-medium">{result.roundedYearsOfService} yrs</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Basic Monthly Salary</span>
                    <span className="font-medium">₹ {Number(form.basicSalary).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Dearness Allowance</span>
                    <span className="font-medium">₹ {Number(form.da || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Formula — de-emphasized, reference-only */}
                <div className="px-1">
                  <p className="text-xs text-muted-foreground">
                    Formula: <span className="font-mono">{result.breakdown.formula}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-60">
                <Calculator className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center text-sm">Fill in the details and click Calculate to see EOSB.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const STAGE_LABELS = {
  PENDING_FINANCE: "Awaiting Finance Manager",
  PENDING_HR: "Awaiting HR Manager",
  PENDING_CEO: "Awaiting CEO",
  APPROVED: "Approved — awaiting payment",
  REJECTED_RESUBMIT: "Rejected — needs resubmission",
};

const IndemnityDetailDialog = ({ record, onClose }) => {
  if (!record) return null;
  return (
    <Dialog open={!!record} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record.employeeName} — Indemnity Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div><span className="text-muted-foreground">Reason</span><p className="font-medium capitalize">{record.reason}</p></div>
            <div><span className="text-muted-foreground">Status</span><p className="font-medium">{record.status}</p></div>
            <div><span className="text-muted-foreground">Joining Date</span><p className="font-medium">{new Date(record.joiningDate).toLocaleDateString()}</p></div>
            <div><span className="text-muted-foreground">Last Working Date</span><p className="font-medium">{new Date(record.lastWorkingDate).toLocaleDateString()}</p></div>
            <div><span className="text-muted-foreground">Years of Service</span><p className="font-medium">{record.roundedYearsOfService ?? record.yearsOfService} yrs</p></div>
            <div><span className="text-muted-foreground">Basic Monthly Salary</span><p className="font-medium">₹ {Number(record.basicSalary).toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Dearness Allowance</span><p className="font-medium">₹ {Number(record.da || 0).toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Gratuity Amount</span><p className="font-bold text-blue-600">₹ {Number(record.calculatedAmount).toLocaleString("en-IN")}</p></div>
          </div>
          {record.notes && (
            <div><span className="text-muted-foreground">Notes</span><p className="font-medium">{record.notes}</p></div>
          )}
          <div className="border-t pt-3 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Approval Trail</p>
            <p>Requested by {record.requestedBy}</p>
            {record.financeApprovedBy && <p>Finance approved by {record.financeApprovedBy} on {new Date(record.financeApprovedAt).toLocaleDateString()}</p>}
            {record.hrApprovedBy && <p>HR approved by {record.hrApprovedBy} on {new Date(record.hrApprovedAt).toLocaleDateString()}</p>}
            {record.approvedBy && <p>CEO approved by {record.approvedBy} on {new Date(record.approvalDate).toLocaleDateString()}</p>}
            {record.paymentDate && <p>Paid on {new Date(record.paymentDate).toLocaleDateString()}</p>}
            {record.rejectedAtStage && (
              <p className="text-red-500">
                Rejected at {STAGE_LABELS[record.rejectedAtStage] || record.rejectedAtStage} by {record.rejectedBy}
                {record.rejectionReason ? `: ${record.rejectionReason}` : " (no reason given)"}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PendingIndemnities = () => {
  const { user } = useAuth();
  const role = normStaffRole(user);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ joiningDate: "", lastWorkingDate: "", reason: "", notes: "" });
  const [viewingRecord, setViewingRecord] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await payrollService.getIndemnities({}); // no status filter — need Pending + Approved
      const all = res.data || [];
      setRecords(all.filter(r => r.status === "Pending" || r.status === "Approved"));
    } catch {
      toast.error("Failed to load pending indemnities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPending(); }, []);

  const canActOnStage = (stage) => {
    if (["ADMIN", "SUPERADMIN"].includes(role)) return true;
    if (stage === "PENDING_FINANCE") return role === "FINANCEMANAGER";
    if (stage === "PENDING_HR") return role === "HRMANAGER";
    if (stage === "PENDING_CEO") return role === "CEO";
    if (stage === "APPROVED") return role === "PAYROLLOFFICER";
    if (stage === "REJECTED_RESUBMIT") return role === "PAYROLLOFFICER";
    return false;
  };

  const actionForStage = (stage) => {
    if (stage === "PENDING_FINANCE") return "finance_approve";
    if (stage === "PENDING_HR") return "hr_approve";
    if (stage === "PENDING_CEO") return "ceo_approve";
    if (stage === "APPROVED") return "mark_paid";
    if (stage === "REJECTED_RESUBMIT") return "resubmit";
    return null;
  };

  const handleApprove = async (record) => {
    const action = actionForStage(record.workflowStage);
    if (!action) return;
    try {
      await payrollService.updateIndemnityStatus(record._id, action);
      toast.success(action === "mark_paid" ? "Marked as paid" : "Approved and moved to next stage");
      fetchPending();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed");
    }
  };

  const handleReject = async (record) => {
    try {
      await payrollService.updateIndemnityStatus(record._id, "reject", rejectReason.trim() || undefined);
      toast.success("Rejected — sent back to Payroll Officer");
      setRejectingId(null);
      setRejectReason("");
      fetchPending();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Rejection failed");
    }
  };
  const startEditing = (record) => {
    setEditingId(record._id);
    setEditForm({
      joiningDate: record.joiningDate?.slice(0, 10) || "",
      lastWorkingDate: record.lastWorkingDate?.slice(0, 10) || "",
      reason: record.reason || "",
      notes: record.notes || "",
    });
  };

  const handleEditResubmit = async (record) => {
    try {
      await payrollService.editAndResubmitIndemnity(record._id, editForm);
      toast.success("Updated and resubmitted to Finance Manager");
      setEditingId(null);
      fetchPending();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Resubmit failed");
    }
  };

  if (loading) return (
    <Card><CardContent className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Indemnity Approvals</CardTitle>
        <CardDescription>{records.length} request(s) in the approval pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Employee ID</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Gratuity Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>View</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No pending indemnity requests.
                </TableCell>
              </TableRow>
            ) : records.map(r => {
              const myTurn = canActOnStage(r.workflowStage);
              return (
                <TableRow key={r._id}>
                  <TableCell className="font-medium min-w-[160px]">
                    {r.employeeName}
                    {r.rejectedAtStage && r.status !== "Rejected" && (
                      <p className="text-xs text-red-500 font-normal mt-1 leading-snug">
                        Rejected by {STAGE_LABELS[r.rejectedAtStage]?.replace("Awaiting ", "") || r.rejectedAtStage}
                        {r.rejectionReason ? `: ${r.rejectionReason}` : " — no reason given"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{r.roundedYearsOfService ?? r.yearsOfService} yrs</TableCell>
                  <TableCell className="font-bold text-blue-600">
                    ₹ {Number(r.calculatedAmount).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="capitalize">{r.reason}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <Badge variant="outline" className="whitespace-nowrap">{STAGE_LABELS[r.workflowStage] || r.workflowStage}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ViewButton onClick={() => setViewingRecord(r)} />
                  </TableCell>
                  <TableCell>
                    {!myTurn ? (
                      <span className="text-xs text-muted-foreground">Not your turn</span>
                    ) : r.workflowStage === "REJECTED_RESUBMIT" ? (
                      <Button size="sm" variant="outline" onClick={() => startEditing(r)}>
                        Edit & Resubmit
                      </Button>
                    ) : rejectingId === r._id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Textarea
                          placeholder="Reason (optional)"
                          rows={2}
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => handleReject(r)}>Confirm reject</Button>
                          <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApprove(r)}>
                          <Check className="h-4 w-4 mr-1" />
                          {r.workflowStage === "APPROVED" ? "Mark Paid" : "Approve"}
                        </Button>
                        {r.workflowStage !== "APPROVED" && (
                          <Button size="sm" variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setRejectingId(r._id)}>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit & Resubmit Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Joining Date</Label>
              <Input type="date" value={editForm.joiningDate}
                onChange={e => setEditForm(p => ({ ...p, joiningDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Last Working Date</Label>
              <Input type="date" value={editForm.lastWorkingDate}
                onChange={e => setEditForm(p => ({ ...p, lastWorkingDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Select value={editForm.reason} onValueChange={v => setEditForm(p => ({ ...p, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="resignation">Resignation</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="end-of-contract">End of Contract</SelectItem>
                  <SelectItem value="retrenchment">Retrenchment</SelectItem>
                  <SelectItem value="death">Death</SelectItem>
                  <SelectItem value="permanent-disablement">Permanent disablement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={3} value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={() => handleEditResubmit(records.find(r => r._id === editingId))}>
              Save & Resubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <IndemnityDetailDialog record={viewingRecord} onClose={() => setViewingRecord(null)} />
    </Card>
  );
};

const IndemnityHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [viewingRecord, setViewingRecord] = useState(null);

  useEffect(() => {
    payrollService.getIndemnities().then(res => {
      setRecords(res.data || []);
    }).catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    const searchLower = search.toLowerCase();
    const nameMatch = r.employeeName?.toLowerCase().includes(searchLower);
    const reasonMatch = r.reason?.toLowerCase().includes(searchLower);
    const emailMatch = r.userId?.email?.toLowerCase().includes(searchLower);
    const deptMatch = r.userId?.department?.toLowerCase().includes(searchLower);
    const empCodeMatch = r.userId?.employeeCode?.toLowerCase().includes(searchLower);

    return nameMatch || reasonMatch || emailMatch || deptMatch || empCodeMatch;
  });

  if (loading) return (
    <Card><CardContent className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>All indemnities</CardTitle>
          <CardDescription>All EOSB requests and their status</CardDescription>
        </div>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Name, ID, Dept, Email..." className="pl-8"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Employee ID</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>EOSB Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r._id}>
                <TableCell className="align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.employeeName}</span>
                    <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
                      {r.employeeCode || "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground align-middle">
                  {r.employeeCode || "-"}
                </TableCell>
                <TableCell className="align-middle">{r.yearsOfService} yrs</TableCell>
                <TableCell className="font-bold text-blue-600 align-middle">
                  ₹ {Number(r.calculatedAmount).toLocaleString()}
                </TableCell>
                <TableCell className="capitalize align-middle">{r.reason}</TableCell>
                <TableCell className="align-middle">
                  <Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>
                    {r.status === "Pending" && STAGE_LABELS[r.workflowStage]
                      ? STAGE_LABELS[r.workflowStage]
                      : r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground align-middle whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="align-middle">
                  <ViewButton onClick={() => setViewingRecord(r)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <IndemnityDetailDialog record={viewingRecord} onClose={() => setViewingRecord(null)} />
    </Card>
  );
};

export default Indemnity;
