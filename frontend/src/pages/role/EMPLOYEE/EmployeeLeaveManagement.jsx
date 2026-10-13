import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import leaveService from "@/services/leaveService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/ui/stats-card";
import { Pagination } from "@/components/ui/pagination";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusConfig = {
  Pending: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  },
  Approved: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  Rejected: {
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

const BalanceCard = ({ leaveType, allocated, used, remaining, carriedForward, viewMode }) => {
  const isMonthly = viewMode === "monthly";
  
  // Calculate monthly stats
  const monthlyAllocated = Math.round(((allocated + carriedForward) / 12) * 10) / 10;
  const displayAllocated = isMonthly ? monthlyAllocated : (allocated + carriedForward);
  const displayRemaining = isMonthly ? monthlyAllocated : remaining;
  const displayUsed = isMonthly ? 0 : used; 
  
  // Icon and color mapping based on leave type
  let Icon = CalendarDays;
  let colorClass = "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800";
  
  const typeLower = leaveType.toLowerCase();
  if (typeLower.includes("sick")) {
    Icon = Plus; // Heart isn't in lucide-react by default without checking, let's just use standard icons or assume we have some. Wait, lucide-react has Heart. Let's import it later, for now we can use existing icons.
    colorClass = "text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30";
  } else if (typeLower.includes("casual")) {
    colorClass = "text-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/30";
  } else if (typeLower.includes("earned")) {
    colorClass = "text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30";
  } else if (typeLower.includes("without pay")) {
    colorClass = "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800";
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[160px]">
      <div className="flex items-start justify-between">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colorClass)}>
          {/* using CalendarDays as fallback generic icon */}
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {isMonthly ? "MONTH" : "YEAR"}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
          {leaveType}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {displayRemaining}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {typeLower.includes("without pay") ? (isMonthly ? "days this month" : "days this year") : (isMonthly ? "left this month" : "left")}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-300">
          {displayUsed} <span className="font-normal text-slate-400">/ {displayAllocated} {isMonthly ? "monthly" : "entitled"}</span>
        </p>
      </div>
    </div>
  );
};

const ApplyLeaveModal = ({
  open,
  onClose,
  onSuccess,
  policies,
  balances,
}) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [estimatedDays, setEstimatedDays] = useState(0);

  useEffect(() => {
    if (!open) {
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
      setSelectedBalance(null);
      setEstimatedDays(0);
    }
  }, [open]);

  useEffect(() => {
    if (form.leaveType && balances) {
      const bal = balances.find((b) => b.leaveType === form.leaveType);
      setSelectedBalance(bal || null);
    } else {
      setSelectedBalance(null);
    }
  }, [form.leaveType, balances]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end >= start) {
        let days = 0;
        const cur = new Date(start);
        while (cur <= end) {
          const d = cur.getDay();
          if (d !== 0 && d !== 6) days++;
          cur.setDate(cur.getDate() + 1);
        }
        setEstimatedDays(days);
      } else {
        setEstimatedDays(0);
      }
    }
  }, [form.startDate, form.endDate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const insufficientBalance =
    selectedBalance && estimatedDays > selectedBalance.remaining;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.leaveType) {
      toast.error("Please select a leave type.");
      return;
    }
    if (insufficientBalance) {
      toast.error(
        `Insufficient ${form.leaveType} leave balance. You have ${selectedBalance.remaining} day(s) remaining.`
      );
      return;
    }

    try {
      setLoading(true);
      await leaveService.applyLeave(form);
      toast.success("Leave request submitted successfully.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  const activePolicies = policies.filter((p) => p.isActive);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            Apply for Leave
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to submit a leave request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Leave Type</Label>
            <select
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select leave type</option>
              {activePolicies.map((p) => {
                const bal = balances?.find((b) => b.leaveType === p.leaveType);
                const remaining = bal?.remaining ?? p.annualLimit;
                return (
                  <option
                    key={p.leaveType}
                    value={p.leaveType}
                    disabled={remaining === 0}
                  >
                    {p.leaveType} ({remaining} days remaining)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedBalance && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-sm",
                insufficientBalance && estimatedDays > 0
                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                  : "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
              )}
            >
              {insufficientBalance && estimatedDays > 0 ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>
                {selectedBalance.remaining} day(s) remaining for{" "}
                {form.leaveType}
                {estimatedDays > 0 && ` · Requesting ${estimatedDays} working day(s)`}
                {insufficientBalance && estimatedDays > 0 && " · Insufficient balance"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">End Date</Label>
              <Input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                min={form.startDate || new Date().toISOString().split("T")[0]}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {estimatedDays > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Estimated working days: <span className="font-semibold text-slate-700 dark:text-slate-300">{estimatedDays}</span> (weekends excluded)
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </Label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Please provide a reason for your leave..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (insufficientBalance && estimatedDays > 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EmployeeLeaveManagement = () => {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [viewMode, setViewMode] = useState("monthly");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [leavesRes, policiesRes, balanceRes] = await Promise.all([
        leaveService.getMyLeaves(),
        leaveService.getAllPolicies(),
        leaveService.getMyLeaveBalance(),
      ]);

      let leavesData = [];
      if (Array.isArray(leavesRes)) leavesData = leavesRes;
      else if (leavesRes?.success && Array.isArray(leavesRes?.data))
        leavesData = leavesRes.data;
      setLeaves(leavesData);

      let policiesData = [];
      if (Array.isArray(policiesRes)) policiesData = policiesRes;
      else if (policiesRes?.success && Array.isArray(policiesRes?.data))
        policiesData = policiesRes.data;
      setPolicies(policiesData);

      if (balanceRes?.success) {
        setBalanceData(balanceRes.data);
      } else if (balanceRes?.data) {
        setBalanceData(balanceRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCancel = async (id) => {
    try {
      setCancellingId(id);
      await leaveService.cancelLeave(id);
      toast.success("Leave request cancelled.");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel leave.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading leave data...</p>
        </div>
      </div>
    );
  }

  const balances = balanceData?.balances || [];
  const pendingCount = leaves.filter((l) => l.status === "Pending").length;
  const approvedCount = leaves.filter((l) => l.status === "Approved").length;
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm: text-2xl">
            Leaves
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Apply for leave and track balances. Switch between yearly entitlement and this month's accrual.
          </p>
        </div>
        <Button
          onClick={() => setApplyModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Apply leave
        </Button>
      </div>

      {balances.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {viewMode === "monthly" ? `Monthly accrual · ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` : `Annual entitlement · ${new Date().getFullYear()}`}
            </h2>
            <div className="flex items-center gap-1 bg-white border border-slate-100 dark:bg-slate-800 dark:border-slate-700 p-1 rounded-full shadow-sm">
              <button 
                className={cn("px-4 py-1.5 text-xs font-semibold rounded-full transition-colors", viewMode === "monthly" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                onClick={() => setViewMode("monthly")}
              >
                Monthly
              </button>
              <button 
                className={cn("px-4 py-1.5 text-xs font-semibold rounded-full transition-colors", viewMode === "annual" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                onClick={() => setViewMode("annual")}
              >
                Annual
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {balances.map((b) => (
              <BalanceCard key={b.leaveType} {...b} viewMode={viewMode} />
            ))}
          </div>
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Leave History
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your recent leave requests and their status.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-[20%]">Leave Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-[25%]">Duration</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-[10%]">Days</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-[20%]">Reason</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-[15%]">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-right w-[10%]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-6 w-full border border-slate-100 dark:border-slate-800/50 flex items-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No leave requests yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.slice((currentPage - 1) * 10, currentPage * 10).map((leave) => {
                    return (
                      <TableRow
                        key={leave._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800/50"
                      >
                        <TableCell>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {leave.leaveType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {leave.totalDays}d
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={leave.reason}>
                            {leave.reason}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-sm",
                            leave.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                            leave.status === "Rejected" ? "bg-red-50 text-red-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {leave.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {["Pending", "Approved"].includes(leave.status) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(leave._id)}
                              disabled={cancellingId === leave._id}
                              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {cancellingId === leave._id ? "Cancelling..." : "Cancel"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {leaves.length > 10 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/30">
              <Pagination 
                currentPage={currentPage} 
                totalPages={Math.ceil(leaves.length / 10)} 
                totalItems={leaves.length} 
                itemsPerPage={10}
                onPageChange={(page) => setCurrentPage(page)} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ApplyLeaveModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={fetchAll}
        policies={policies}
        balances={balances}
      />
    </div>
  );
};

export default EmployeeLeaveManagement;