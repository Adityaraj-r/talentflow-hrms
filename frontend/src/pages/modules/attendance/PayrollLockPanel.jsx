import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Unlock, ShieldAlert, Calendar, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const getMonthRange = (offsetMonths = 0) => {
  const target = new Date();
  target.setMonth(target.getMonth() + offsetMonths);
  const start = new Date(target.getFullYear(), target.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const LockStatusBadge = ({ isLocked }) =>
  isLocked ? (
    <Badge className="bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 flex items-center gap-1.5 px-3 py-1">
      <Lock className="w-3.5 h-3.5" />
      Locked for Payroll
    </Badge>
  ) : (
    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5 px-3 py-1">
      <Unlock className="w-3.5 h-3.5" />
      Open for Corrections
    </Badge>
  );

const ConfirmModal = ({ open, onClose, onConfirm, mode, startDate, endDate, loading }) => {
  const isLocking = mode === "lock";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLocking ? (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            ) : (
              <Unlock className="w-5 h-5 text-amber-500" />
            )}
            {isLocking ? "Lock Attendance Period?" : "Unlock Attendance Period?"}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {isLocking ? (
              <>
                This will freeze all attendance records from{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDisplayDate(startDate)}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDisplayDate(endDate)}
                </span>
                . No corrections will be possible for any role after locking.
              </>
            ) : (
              <>
                This will re-open attendance records from{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDisplayDate(startDate)}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDisplayDate(endDate)}
                </span>{" "}
                for corrections. An audit log entry will be created.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLocking && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Ensure all managers have approved attendance before locking. Records locked before
              the 20th deadline may affect payroll accuracy.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              isLocking
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }
          >
            {loading ? "Processing..." : isLocking ? "Yes, Lock Period" : "Yes, Unlock Period"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PayrollLockPanel = ({ onLockChange }) => {
  const { user } = useUser();

  const canUnlock = ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user?.role?.toUpperCase());

  const defaultRange = getMonthRange(0);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [isLocked, setIsLocked] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("lock");

  useEffect(() => {
    const checkStatus = async () => {
      if (!startDate || !endDate) return;
      try {
        setCheckingStatus(true);
        const res = await attendanceService.checkLockStatus(startDate, endDate);
        const locked = res?.data?.isLocked ?? false;
        setIsLocked(locked);
        if (res?.data?.lastAction) setLastAction(res.data.lastAction);
      } catch {
        setIsLocked(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [startDate, endDate]);

  const applyMonthPreset = (offset) => {
    const range = getMonthRange(offset);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const openModal = (mode) => {
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date.");
      return;
    }
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      if (modalMode === "lock") {
        await attendanceService.lockAttendance(startDate, endDate);
        setIsLocked(true);
        setLastAction({ type: "lock", date: new Date().toISOString(), by: user?.email });
        toast.success(`Attendance locked from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}.`);
      } else {
        await attendanceService.unlockAttendance(startDate, endDate);
        setIsLocked(false);
        setLastAction({ type: "unlock", date: new Date().toISOString(), by: user?.email });
        toast.success("Attendance unlocked. Corrections are now allowed for this period.");
      }
      setModalOpen(false);
      onLockChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4 text-slate-500" />
                Payroll Lock Checkpoint
              </CardTitle>
              <CardDescription className="mt-0.5">
                Freeze attendance records for a period before payroll processing.
              </CardDescription>
            </div>
            {checkingStatus ? (
              <div className="h-7 w-36 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
            ) : (
              <LockStatusBadge isLocked={isLocked} />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Period
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "This Month", offset: 0 },
                { label: "Last Month", offset: -1 },
                { label: "2 Months Ago", offset: -2 },
              ].map(({ label, offset }) => {
                const range = getMonthRange(offset);
                const isActive = startDate === range.start && endDate === range.end;
                return (
                  <button
                    key={offset}
                    onClick={() => applyMonthPreset(offset)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {lastAction && (
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
              <span>
                Last action:{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {lastAction.type}
                </span>{" "}
                by{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {lastAction.by}
                </span>{" "}
                on {formatDisplayDate(lastAction.date)}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              onClick={() => openModal("lock")}
              disabled={isLocked || checkingStatus || loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white gap-2"
            >
              <Lock className="w-4 h-4" />
              {isLocked ? "Already Locked" : "Lock Attendance"}
            </Button>

            {canUnlock && (
              <Button
                onClick={() => openModal("unlock")}
                disabled={!isLocked || checkingStatus || loading}
                variant="outline"
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-40 gap-2"
              >
                <Unlock className="w-4 h-4" />
                Emergency Unlock
              </Button>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground border-t border-slate-100 dark:border-slate-800 pt-3">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
            <span>
              Once locked, all attendance corrections return 403 Forbidden for all roles.
              Only Admin can perform an emergency unlock. Every unlock creates an immutable audit log entry.
            </span>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        mode={modalMode}
        startDate={startDate}
        endDate={endDate}
        loading={loading}
      />
    </>
  );
};

export default PayrollLockPanel;