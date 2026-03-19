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
import { Lock, Clock, User, Calendar } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  "Present",
  "Late",
  "Half Day",
  "Absent",
  "Leave",
  "Holiday",
  "Weekend",
];

const formatTimeForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const EditAttendanceModal = ({ open, onClose, record, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clockIn: "",
    clockOut: "",
    status: "",
    breakMinutes: 0,
    notes: "",
  });

  useEffect(() => {
    if (record) {
      setFormData({
        clockIn: formatTimeForInput(record.clockIn),
        clockOut: formatTimeForInput(record.clockOut),
        status: record.status || "",
        breakMinutes: record.totalBreakMinutes || 0,
        notes: record.notes || "",
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.status) {
      toast.error("Status is required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        status: formData.status,
        notes: formData.notes,
        breakMinutes: Number(formData.breakMinutes),
      };

      if (formData.clockIn && record?.date) {
        payload.clockIn = new Date(
          `${record.date}T${formData.clockIn}`
        ).toISOString();
      }

      if (formData.clockOut && record?.date) {
        payload.clockOut = new Date(
          `${record.date}T${formData.clockOut}`
        ).toISOString();
      }

      await attendanceService.correctAttendance(record._id, payload);
      toast.success("Attendance record updated successfully.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update record."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  const employeeName = record.userId
    ? `${record.userId.firstName} ${record.userId.lastName}`
    : "Employee";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Edit Attendance Record
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium">{employeeName}</span>
            <span className="text-muted-foreground text-xs">
              {record.userId?.email}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{record.date}</span>
          </div>
        </div>

        {record.isLocked && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              This record is locked for payroll. Contact Admin to unlock
              before editing.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Clock In</Label>
              <Input
                type="time"
                name="clockIn"
                value={formData.clockIn}
                onChange={handleChange}
                disabled={record.isLocked}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Clock Out</Label>
              <Input
                type="time"
                name="clockOut"
                value={formData.clockOut}
                onChange={handleChange}
                disabled={record.isLocked}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={record.isLocked}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Break (minutes)</Label>
              <Input
                type="number"
                name="breakMinutes"
                min="0"
                value={formData.breakMinutes}
                onChange={handleChange}
                disabled={record.isLocked}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Notes</Label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={record.isLocked}
              rows={3}
              placeholder="Reason for correction..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Current status:</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {record.status}
            </Badge>
            {record.totalHours != null && (
              <>
                <span className="ml-1">Hours on record:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {record.totalHours}h
                </span>
              </>
            )}
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
              disabled={loading || record.isLocked}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAttendanceModal;