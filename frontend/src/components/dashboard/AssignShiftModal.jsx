import { useState, useEffect } from "react";
import { Search, Check, Briefcase, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
import shiftService from "@/services/shiftService";
import { cn } from "@/lib/utils";

const AssignShiftModal = ({ isOpen, onClose, shifts = [], onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          setFetchingData(true);
          const res = await apiClient.get("/users");
          setEmployees(res.data?.data || res.data || []);
        } catch (error) {
          toast.error("Failed to load employees");
        } finally {
          setFetchingData(false);
        }
      };
      fetchEmployees();
      setSelectedEmployees([]);
      setSelectedShift("");
      setSearch("");
    }
  }, [isOpen]);

  const filteredEmployees = employees.filter(
    (e) =>
      e.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e._id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedShift) {
      toast.error("Please select a shift configuration.");
      return;
    }
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee.");
      return;
    }

    try {
      setLoading(true);
      await shiftService.assignShift(selectedShift, selectedEmployees);
      toast.success("Shift assigned successfully to selected employees.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign shift.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Assign Shift to Employees
          </DialogTitle>
          <DialogDescription>
            Select a shift template and map it to the relevant employees.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-5">
          <div className="space-y-2 shrink-0">
            <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              1. Select Shift Configuration <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Choose a Shift --</option>
              {shifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                2. Select Employees
              </label>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or dept..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8 text-sm bg-background"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {fetchingData ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-sm">Loading employee directory...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredEmployees.length > 0 && (
                    <div
                      onClick={toggleAll}
                      className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          selectedEmployees.length === filteredEmployees.length
                            ? "bg-blue-600 border-blue-600"
                            : "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        {selectedEmployees.length === filteredEmployees.length && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Select All ({filteredEmployees.length})
                      </span>
                    </div>
                  )}

                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployees.includes(emp._id);
                    return (
                      <div
                        key={emp._id}
                        onClick={() => toggleEmployee(emp._id)}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300 dark:border-slate-600"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {emp.email}
                            </p>
                          </div>
                          <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] text-right">
                            {emp.department || "No Department"}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredEmployees.length === 0 && !fetchingData && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No employees match your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex sm:justify-between items-center gap-4 shrink-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              disabled={loading || selectedEmployees.length === 0 || !selectedShift}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignShiftModal;