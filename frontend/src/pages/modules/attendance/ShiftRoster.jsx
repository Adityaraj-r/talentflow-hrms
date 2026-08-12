import { useState, useEffect, useMemo } from "react";
import { Search, Users, Briefcase, Clock, AlertCircle, ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AssignShiftModal from "@/components/dashboard/AssignShiftModal";
import apiClient from "@/services/apiClient";
import shiftService from "@/services/shiftService";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Pagination } from "@/components/ui/pagination";

const ShiftRoster = () => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, shiftsRes] = await Promise.all([
        apiClient.get("/users"),
        shiftService.getAllShifts(),
      ]);

      setEmployees(usersRes.data?.data || usersRes.data || []);
      setShifts(shiftsRes?.success && Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
    } catch (error) {
      toast.error("Failed to load shift roster data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getShiftDetails = (shiftRef) => {
    if (!shiftRef) return null;
    const shiftId = typeof shiftRef === "string" ? shiftRef : shiftRef._id;
    return shifts.find((s) => s._id === shiftId) || shiftRef;
  };

  const departmentsOptions = useMemo(() => {
    const depts = employees.map((emp) => emp.department).filter(Boolean);
    return [...new Set(depts)].sort();
  }, [employees]);

  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase();
    const nameMatch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search);
    const emailMatch = (emp.email || "").toLowerCase().includes(search);
    const deptMatch = (emp.department || "").toLowerCase().includes(search);
    const empCodeMatch = (emp.employeeCode || "").toLowerCase().includes(search);
    const matchesSearch = nameMatch || emailMatch || deptMatch || empCodeMatch;

    const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;

    const shift = getShiftDetails(emp.currentShift);
    let matchesShift = true;
    if (selectedShift !== "all") {
      if (selectedShift === "unassigned") {
        matchesShift = !shift;
      } else {
        const shiftId = typeof emp.currentShift === "string" ? emp.currentShift : emp.currentShift?._id;
        matchesShift = shiftId === selectedShift || shift?.name === selectedShift || shift?._id === selectedShift;
      }
    }

    return matchesSearch && matchesDept && matchesShift;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedShift]);

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
            Employee Shift Roster
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            View current shift assignments and reassign employees to different working hours.
          </p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2 shrink-0">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Current Assignments
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Name, ID, Dept..."
                  className="pl-8 bg-background h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-ring cursor-pointer w-full sm:w-auto"
              >
                <option value="all">All Departments</option>
                {departmentsOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Shift Filter */}
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-ring cursor-pointer w-full sm:w-auto"
              >
                <option value="all">All Shifts</option>
                <option value="unassigned">⚠️ Unassigned</option>
                {shifts.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.startTime} - {s.endTime})</option>
                ))}
              </select>

              {(searchTerm || selectedDepartment !== "all" || selectedShift !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDepartment("all");
                    setSelectedShift("all");
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Shift</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Loading roster...
                    </TableCell>
                  </TableRow>
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const shift = getShiftDetails(emp.currentShift);
                    return (
                      <TableRow key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
                              {emp.employeeCode || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">{emp.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                          {emp.employeeCode || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {emp.department || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {shift ? (
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {shift.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" /> Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shift ? (
                            <div className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400">
                              <Clock className="w-3.5 h-3.5" />
                              {shift.startTime} - {shift.endTime}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 font-normal px-2 py-0">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </CardContent>
      </Card>

      <AssignShiftModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        shifts={shifts}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default ShiftRoster;