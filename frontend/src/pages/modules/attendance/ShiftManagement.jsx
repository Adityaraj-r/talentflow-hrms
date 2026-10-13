import { useState, useEffect } from "react";
import shiftService from "@/services/shiftService";
import AssignShiftModal from "@/components/dashboard/AssignShiftModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Shield, Briefcase, AlertCircle, Users, Timer, Pencil, X, Check, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/contexts/ConfirmContext";

const TimeSelect = ({ value, name, onChange }) => {
  let h12 = "", m = "", ampm = "AM";
  if (value) {
    let [hh, mm] = value.split(":");
    let hInt = parseInt(hh, 10);
    ampm = hInt >= 12 ? "PM" : "AM";
    hInt = hInt % 12 || 12;
    h12 = hInt.toString().padStart(2, "0");
    m = mm;
  }

  const updateTime = (newH12, newM, newAmpm) => {
    if (!newH12) newH12 = "09";
    if (!newM) newM = "00";
    let h24 = parseInt(newH12, 10);
    if (newAmpm === "PM" && h24 !== 12) h24 += 12;
    if (newAmpm === "AM" && h24 === 12) h24 = 0;
    const out = `${h24.toString().padStart(2, "0")}:${newM}`;
    onChange({ target: { name, value: out } });
  };

  return (
    <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden transition-colors shadow-sm">
      <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
      <div className="flex flex-1 items-center justify-between gap-1">
        <Select value={h12} onValueChange={(val) => updateTime(val, m || "00", ampm)}>
          <SelectTrigger className="w-[60px] h-8 border-none shadow-none focus:ring-0 p-1 text-center font-medium bg-transparent">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="font-bold text-muted-foreground mb-0.5">:</span>

        <Select value={m} onValueChange={(val) => updateTime(h12 || "09", val, ampm)}>
          <SelectTrigger className="w-[60px] h-8 border-none shadow-none focus:ring-0 p-1 text-center font-medium bg-transparent">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((min) => (
              <SelectItem key={min} value={min}>{min}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border mx-1"></div>

        <Select value={ampm} onValueChange={(val) => updateTime(h12 || "09", m || "00", val)}>
          <SelectTrigger className="w-[60px] h-8 border-none shadow-none focus:ring-0 p-1 text-center font-bold text-purple-600 dark:text-purple-400 bg-transparent">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const ShiftManagement = () => {
  const { confirm } = useConfirm();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    graceMinutes: 15,
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getAllShifts();
      if (res?.success && Array.isArray(res.data)) {
        setShifts(res.data);
      } else {
        setShifts([]);
      }
    } catch (error) {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await shiftService.createShift(formData);
      setFormData({ name: "", startTime: "", endTime: "", graceMinutes: 15 });
      toast.success("Shift created successfully");
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add shift");
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: "Delete Shift?",
      message: "Are you sure you want to delete this shift?",
      action: async () => {
        try {
          await shiftService.deleteShift(id);
          toast.success("Shift deleted");
          fetchShifts();
        } catch (error) {
          toast.error("Failed to delete shift");
          throw error;
        }
      }
    });
  };

  const handleEditStart = (shift) => {
    setEditingId(shift._id);
    setEditData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceMinutes: shift.graceMinutes,
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditSave = async (id) => {
    if (!editData.name?.trim()) {
      toast.error("Shift name is required.");
      return;
    }
    if (!editData.startTime || !editData.endTime) {
      toast.error("Start time and end time are required.");
      return;
    }
    try {
      setEditLoading(true);
      await shiftService.updateShift(id, {
        name: editData.name.trim(),
        startTime: editData.startTime,
        endTime: editData.endTime,
        graceMinutes: Number(editData.graceMinutes),
      });
      toast.success("Shift updated successfully");
      setEditingId(null);
      setEditData({});
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update shift");
    } finally {
      setEditLoading(false);
    }
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return "--";
    const [hourString, minute] = time24.split(":");
    let hour = parseInt(hourString, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
  };

  const getDuration = (start, end) => {
    if (!start || !end) return "--";
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    let diff = eH * 60 + eM - (sH * 60 + sM);
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    return `${h} Hours`;
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Shift Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">
            {row.original.name}
          </span>
          {row.original.isActive && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] px-2 py-0">
              Active
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {formatTime12Hour(row.original.startTime)} - {formatTime12Hour(row.original.endTime)}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4 text-purple-500" />
          <span>{getDuration(row.original.startTime, row.original.endTime)}</span>
        </div>
      ),
    },
    {
      accessorKey: "grace",
      header: "Buffer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-orange-500" />
          <span>
            <b className="text-foreground">{row.original.graceMinutes}m</b>
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="flex justify-end gap-2">
            <ActionIcon
              icon={Pencil}
              tooltip="Edit"
              onClick={() => handleEditStart(shift)}
              className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            />
            <ActionIcon
              icon={Trash2}
              tooltip="Delete"
              onClick={() => handleDelete(shift._id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Shift Management</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Define working hours and late mark rules for your employees.
          </p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          className="shadow-sm"
        >
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Add New Shift
              </CardTitle>
              <CardDescription>Create a new time slot for rostering.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shift Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. General Shift"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <TimeSelect name="startTime" value={formData.startTime} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <TimeSelect name="endTime" value={formData.endTime} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    Grace Minutes
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <input
                    type="number"
                    name="graceMinutes"
                    min="0"
                    max="120"
                    value={formData.graceMinutes}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                  />
                  <p className="text-xs text-muted-foreground">Grace period before marking 'Late'.</p>
                </div>

                <Button type="submit" className="w-full mt-2">
                  Create Shift
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="w-full">
            {editingId && (
              <Card className="mb-4 border-purple-300 dark:border-purple-700 shadow-sm bg-purple-50/30 dark:bg-purple-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> Editing Shift
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Shift Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        Grace Period (minutes)
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {editData.graceMinutes}m
                        </span>
                      </label>
                      <input
                        type="range"
                        name="graceMinutes"
                        min="0"
                        max="60"
                        step="5"
                        value={editData.graceMinutes}
                        onChange={handleEditChange}
                        className="w-full accent-purple-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                      <TimeSelect
                        name="startTime"
                        value={editData.startTime}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">End Time</label>
                      <TimeSelect
                        name="endTime"
                        value={editData.endTime}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(editingId)}
                      disabled={editLoading}
                      className="h-8 text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {editLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditCancel}
                      disabled={editLoading}
                      className="h-8 text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading shifts...</div>
                ) : shifts.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-muted-foreground m-4">
                    No shifts found. Create one to get started.
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={shifts}
                    searchable={false}
                    defaultPageSize={10}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AssignShiftModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        shifts={shifts}
      />
    </div>
  );
};

export default ShiftManagement;