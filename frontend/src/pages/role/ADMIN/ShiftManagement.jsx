import { useState, useEffect } from "react";
import shiftService from "../../../services/shiftService";
import AssignShiftModal from "@/components/dashboard/AssignShiftModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Shield, 
  Briefcase, 
  AlertCircle,
  Users
} from "lucide-react";

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Form state for creating a new shift.
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    lateBuffer: 15
  });

  const fetchShifts = async () => {
    try {
      setLoading(true);
      // Robust handling for various API response structures.
      const res = await shiftService.getAllShifts();
      
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setShifts(res.data.data);
      } else if (res?.success && Array.isArray(res.data)) {
        setShifts(res.data);
      } else if (Array.isArray(res)) {
        setShifts(res);
      } else {
        console.warn("Unexpected response format:", res);
        setShifts([]);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of shift data.
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
      fetchShifts();
    } catch (error) {
      console.error("Error adding shift:", error);
      alert(error.response?.data?.message || "Failed to add shift");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this shift?")) {
      try {
        await shiftService.deleteShift(id);
        fetchShifts();
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 space-y-8 font-sans transition-colors duration-300">
      {/* Header section with page title and assign action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Configuration</h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Shift Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Define working hours and late mark rules for your employees.
          </p>
        </div>

        <Button 
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
        >
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Shift Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Add New Shift
              </CardTitle>
              <CardDescription>Create a new time slot for rostering.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Shift Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shift Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      name="name"
                      placeholder="e.g. General Shift"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Times Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                    <input 
                      type="time" 
                      name="startTime"
                      required
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Time</label>
                    <input 
                      type="time" 
                      name="endTime"
                      required
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                {/* Late Buffer */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    Late Buffer (Minutes)
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                  </label>
                  <input 
                    type="number" 
                    name="lateBuffer"
                    min="0"
                    value={formData.lateBuffer}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  />
                  <p className="text-xs text-slate-500">Grace period before marking 'Late'.</p>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                  Create Shift
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List of Shifts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
               <p className="text-slate-400">Loading shifts...</p>
            ) : shifts.length === 0 ? (
              <div className="col-span-2 p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center text-slate-500">
                No shifts found. Create one to get started.
              </div>
            ) : (
              shifts.map((shift) => (
                <Card key={shift._id} className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {shift.name}
                        {shift.isActive && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] px-2 py-0">Active</Badge>}
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                        {shift.startTime} - {shift.endTime}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mt-2">
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span>Buffer: <b>{shift.lateBuffer} min</b></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span>9 Hours</span> 
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(shift._id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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