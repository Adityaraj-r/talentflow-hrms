import { useState, useEffect } from "react";
import { X, Search, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Ensure you have dialog components or use a basic div overlay
import apiClient from "@/services/apiClient"; // To fetch users
import shiftService from "@/services/shiftService";

const AssignShiftModal = ({ isOpen, onClose, shifts = [] }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Fetch Employees on Open
  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          // ⚠️ CHECK THIS URL: Update to your actual user/employee endpoint
          const res = await apiClient.get("/users"); 
          setEmployees(res.data.data || res.data || []);
        } catch (error) {
          console.error("Failed to load employees", error);
        }
      };
      fetchEmployees();
      setSelectedEmployees([]);
      setSelectedShift("");
    }
  }, [isOpen]);

  // Handle Checkbox Toggle
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Handle Select All
  const toggleAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e._id));
    }
  };

  // Filter Search
  const filteredEmployees = employees.filter(
    (e) =>
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  // Submit Assignment
  const handleSubmit = async () => {
    if (!selectedShift || selectedEmployees.length === 0) return;
    
    try {
      setLoading(true);
      await shiftService.assignShift(selectedShift, selectedEmployees);
      alert("Shift assigned successfully!");
      onClose();
    } catch (error) {
      console.error("Assignment failed", error);
      alert("Failed to assign shift");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assign Shift to Employees</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-6">
          
          {/* 1. Select Shift */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Shift Configuration</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Choose a Shift --</option>
              {shifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Employees */}
          <div className="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto p-2 space-y-1">
              {/* Select All Row */}
              <div 
                onClick={toggleAll}
                className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer font-medium text-sm text-blue-600 dark:text-blue-400"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? "bg-blue-600 border-blue-600" : "border-slate-400"}`}>
                  {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 && <Check className="w-3 h-3 text-white" />}
                </div>
                Select All ({filteredEmployees.length})
              </div>

              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => toggleEmployee(emp._id)}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedEmployees.includes(emp._id) ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedEmployees.includes(emp._id) ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"}`}>
                    {selectedEmployees.includes(emp._id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEmployees.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">No employees found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500">{selectedEmployees.length} employees selected</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || selectedEmployees.length === 0 || !selectedShift}
            >
              {loading ? "Saving..." : "Confirm Assignment"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignShiftModal;