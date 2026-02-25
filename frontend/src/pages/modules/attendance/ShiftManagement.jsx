import { useState, useEffect } from "react";
// ✅ FIXED: 3 levels up to match your structure
import shiftService from "@/services/shiftService";
import AssignShiftModal from "@/components/dashboard/AssignShiftModal"; // Keep this as is if it works, or change to @/components/...
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // Added for better loading state
import {
  Clock,
  Plus,
  Trash2,
  Shield,
  Briefcase,
  AlertCircle,
  Users,
  Timer
} from "lucide-react";
import { toast } from "sonner"; // ✅ Using sonner as requested

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    lateBuffer: 15
  });

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getAllShifts();

      // Robust handling for various API response structures
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setShifts(res.data.data);
      } else if (res?.success && Array.isArray(res.data)) {
        setShifts(res.data);
      } else if (Array.isArray(res)) {
        setShifts(res);
      } else {
        setShifts([]);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
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
      setFormData({ name: "", startTime: "", endTime: "", lateBuffer: 15 });
      toast.success("Shift created successfully");
      fetchShifts();
    } catch (error) {
      console.error("Error adding shift:", error);
      toast.error(error.response?.data?.message || "Failed to add shift");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this shift?")) {
      try {
        await shiftService.deleteShift(id);
        toast.success("Shift deleted");
        fetchShifts();
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("Failed to delete shift");
      }
    }
  };

  // Helper to calculate duration for display
  const getDuration = (start, end) => {
    if (!start || !end) return "--";
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 1440; // Handle overnight
    const h = Math.floor(diff / 60);
    return `${h} Hours`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">Define working hours and late mark rules for your employees.</p>
        </div>

        <Button
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left Column: Create Shift Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                      className=" px-3 pl-9 py-2 w-full p-2 border bg-transparent rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      required
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full p-2 border bg-transparent rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      required
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full p-2 border bg-transparent rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    Late Buffer (Minutes)
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <input
                    type="number"
                    name="lateBuffer"
                    min="0"
                    value={formData.lateBuffer}
                    onChange={handleChange}
                    className="w-full p-2 border bg-transparent rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground">Grace period before marking 'Late'.</p>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                  Create Shift
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List of Shifts (GRID OF CARDS) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
              // Skeletons for loading state
              [1, 2].map((i) => (
                <Card key={i} className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : shifts.length === 0 ? (
              <div className="col-span-2 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-muted-foreground">
                No shifts found. Create one to get started.
              </div>
            ) : (
              shifts.map((shift) => (
                <Card key={shift._id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        {shift.name}
                        {shift.isActive && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2 py-0">Active</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">
                        {shift.startTime} - {shift.endTime}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                      <Clock className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <span>Buffer: <b className="text-foreground">{shift.lateBuffer}m</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                        <Timer className="h-4 w-4 text-indigo-500" />
                        <span>{getDuration(shift.startTime, shift.endTime)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(shift._id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
}

export default ShiftManagement;