import { useState, useEffect, useMemo } from "react";
import { Search, Users, Briefcase, Clock, AlertCircle, Calendar, Pencil, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-slate-900 dark:text-white">
              {emp.firstName} {emp.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{emp.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "employeeCode",
      header: "Employee ID",
      cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.original.employeeCode || "-"}</span>,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.original.department || "-"}</span>,
    },
    {
      accessorKey: "currentShift",
      header: "Shift",
      cell: ({ row }) => {
        const shift = getShiftDetails(row.original.currentShift);
        return shift ? (
          <span className="font-medium text-sm text-slate-900 dark:text-white">{shift.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Unassigned</span>
        );
      },
    },
    {
      accessorKey: "workingHours",
      header: "Working Hours",
      cell: ({ row }) => {
        const shift = getShiftDetails(row.original.currentShift);
        return shift ? (
          <div className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400">
            <Clock className="w-3.5 h-3.5" /> {shift.startTime} - {shift.endTime}
          </div>
        ) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionIcon 
          icon={Pencil} 
          onClick={() => setIsAssignModalOpen(true)} 
          className="text-amber-500" 
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Employee Shift Roster</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">View and reassign employee shifts.</p>
        </div>
        <Button onClick={() => setIsAssignModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Users className="w-4 h-4 mr-2" /> Assign Shifts
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" /> Current Assignments
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Input
                placeholder="Search..."
                className="w-full sm:w-64 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs"><SelectValue placeholder="Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs"><SelectValue placeholder="Shifts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="unassigned">⚠️ Unassigned</SelectItem>
                  {shifts.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => {setSearchTerm(""); setSelectedDepartment("all"); setSelectedShift("all");}} className="h-9 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading roster...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No employees found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredEmployees}
              searchable={false}
              defaultPageSize={10}
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