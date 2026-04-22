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

const BalanceCard = ({ leaveType, allocated, used, remaining, carriedForward }) => {
  const pct = allocated + carriedForward > 0
    ? Math.round((used / (allocated + carriedForward)) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {leaveType}
          </p>
          {carriedForward > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              +{carriedForward}d carried forward
            </p>
          )}
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {remaining}
          <span className="text-sm font-normal text-muted-foreground">
            /{allocated + carriedForward}
          </span>
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all",
            pct >= 90
              ? "bg-red-500"
              : pct >= 60
                ? "bg-yellow-500"
                : "bg-emerald-500"
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{used} used</span>
        <span>{remaining} left</span>
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
            <CalendarDays className="w-5 h-5 text-blue-600" />
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
                  : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
  const [policies, setPolicies] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

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
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Leave
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().getFullYear()} · {user?.firstName} {user?.lastName}
          </p>
        </div>
        <Button
          onClick={() => setApplyModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Pending"
          value={pendingCount}
          icon={<Clock className="h-8 w-8" />}
          variant="amber"
        />
        <StatsCard
          title="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-8 w-8" />}
          variant="green"
        />
        <StatsCard
          title="Days Used"
          value={totalUsed}
          icon={<CalendarDays className="h-8 w-8" />}
          variant="blue"
        />
      </div>

      {balances.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Leave Balance — {new Date().getFullYear()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {balances.map((b) => (
              <BalanceCard key={b.leaveType} {...b} />
            ))}
          </div>
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No leave requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => {
                    const sc = statusConfig[leave.status] || statusConfig.Pending;
                    return (
                      <TableRow
                        key={leave._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {leave.leaveType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {leave.totalDays}d
                        </TableCell>
                        <TableCell>
                          <p
                            className="text-sm text-slate-600 dark:text-slate-400 max-w-[180px] truncate"
                            title={leave.reason}
                          >
                            {leave.reason}
                          </p>
                          {leave.status === "Rejected" &&
                            leave.rejectionReason && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                {leave.rejectionReason}
                              </p>
                            )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs border", sc.badge)}
                          >
                            {leave.status}
                          </Badge>
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

const StatsCard = ({ title, value, icon, variant }) => {
  const styles = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    green: {
      card: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    amber: {
      card: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
  };

  const s = styles[variant] || styles.blue;

  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all duration-200 hover:scale-105",
        s.card
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8", s.icon)}>{icon}</div>
      </div>
    </div>
  );
};

export default EmployeeLeaveManagement;