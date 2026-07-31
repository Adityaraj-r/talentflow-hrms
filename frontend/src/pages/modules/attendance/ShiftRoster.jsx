import { useState, useEffect } from "react";
import { Search, Users, Briefcase, Clock, AlertCircle } from "lucide-react";
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

const ShiftRoster = () => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase();
    const nameMatch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search);
    const emailMatch = (emp.email || "").toLowerCase().includes(search);
    const deptMatch = (emp.department || "").toLowerCase().includes(search);
    const empCodeMatch = (emp.employeeCode || "").toLowerCase().includes(search);
    return nameMatch || emailMatch || deptMatch || empCodeMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Shift Roster
          </h1>
          <p className="text-muted-foreground">
            View current shift assignments and reassign employees to different working hours.
          </p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Current Assignments
            </CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, ID, Dept, Email..."
                className="pl-8 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
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
                            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
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