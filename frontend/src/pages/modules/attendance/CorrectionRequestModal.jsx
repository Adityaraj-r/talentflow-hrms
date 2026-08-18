import { useState, useEffect } from "react";
import attendanceService from "@/services/attendanceService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, Info, Lock } from "lucide-react";
import { toast } from "sonner";

const formatTimeForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDisplayTime = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CorrectionRequestModal = ({
  open,
  onClose,
  record,
  usedThisMonth = 0,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestedClockIn: "",
    requestedClockOut: "",
    reason: "",
  });

  const remainingRequests = Math.max(0, 3 - usedThisMonth);
  const isLimitReached = usedThisMonth >= 3;

  useEffect(() => {
    if (record) {
      setFormData({
        requestedClockIn: formatTimeForInput(record.clockIn),
        requestedClockOut: formatTimeForInput(record.clockOut),
        reason: "",
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error("A reason is required for the correction request.");
      return;
    }

    if (!formData.requestedClockIn && !formData.requestedClockOut) {
      toast.error("Please provide at least one corrected time.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        attendanceId: record._id,
        reason: formData.reason.trim(),
      };

      const rawDate = record?.date;
      let dateStr = "";
      if (rawDate) {
        if (typeof rawDate === "string") {
          dateStr = rawDate.split("T")[0];
        } else {
          dateStr = new Date(rawDate).toISOString().split("T")[0];
        }
      } else {
        dateStr = new Date().toISOString().split("T")[0];
      }

      if (formData.requestedClockIn) {
        payload.requestedClockIn = new Date(
          `${dateStr}T${formData.requestedClockIn}`
        ).toISOString();
      }

      if (formData.requestedClockOut) {
        payload.requestedClockOut = new Date(
          `${dateStr}T${formData.requestedClockOut}`
        ).toISOString();
      }

      await attendanceService.submitCorrectionRequest(payload);
      toast.success(
        "Correction request submitted. Your manager will review it."
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit correction request."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Request Attendance Correction
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {record.date}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {record.status}
          </Badge>
        </div>

        {record.isLocked && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              This record is locked for payroll and cannot be corrected.
            </span>
          </div>
        )}

        {!record.isLocked && isLimitReached && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              You have used all 3 correction requests for this month. No more
              requests can be submitted until next month.
            </span>
          </div>
        )}

        {!record.isLocked && !isLimitReached && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm text-purple-700 dark:text-purple-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              You have{" "}
              <span className="font-semibold">{remainingRequests}</span>{" "}
              correction{" "}
              {remainingRequests === 1 ? "request" : "requests"} remaining
              this month.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Current Clock In
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {formatDisplayTime(record.clockIn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Current Clock Out
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {formatDisplayTime(record.clockOut)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Correct Clock In</Label>
              <Input
                type="time"
                name="requestedClockIn"
                value={formData.requestedClockIn}
                onChange={handleChange}
                disabled={record.isLocked || isLimitReached}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Correct Clock Out</Label>
              <Input
                type="time"
                name="requestedClockOut"
                value={formData.requestedClockOut}
                onChange={handleChange}
                disabled={record.isLocked || isLimitReached}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </Label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={record.isLocked || isLimitReached}
              rows={3}
              placeholder="Explain why this correction is needed..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Your request will be sent to your manager for approval. The actual
            record will only be updated after approval.
          </p>

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
              disabled={loading || record.isLocked || isLimitReached}
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

export default CorrectionRequestModal;