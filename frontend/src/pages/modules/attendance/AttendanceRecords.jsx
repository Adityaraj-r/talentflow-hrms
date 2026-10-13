import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import PayrollLockPanel from "./PayrollLockPanel";
import EditAttendanceModal from "./EditAttendanceModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import {
  Search,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Timer,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

const formatBreakTime = (totalMinutes) => {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatOTHours = (hours) => {
  if (!hours || hours <= 0) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
    case "Late":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200";
    case "Absent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
    case "Half Day":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const calculateDuration = (clockIn, clockOut, totalBreakMinutes = 0) => {
  if (!clockIn || !clockOut) return "-";
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
  const diffMs = end - start;
  if (diffMs < 0) return "-";
  const grossMinutes = Math.floor(diffMs / 1000 / 60);
  const netMinutes = Math.max(0, grossMinutes - (totalBreakMinutes || 0));
  const hours = Math.floor(netMinutes / 60);
  const minutes = Math.floor(netMinutes % 60);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
};

const AttendanceRecord = () => {
  const { user } = useUser();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    overtime: 0,
  });
  const [activeCard, setActiveCard] = useState("total");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const userRole = user?.role?.toUpperCase();
  const showLockPanel = ["HR_MANAGER", "PAYROLL_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  const canEdit = ["HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getAllAttendance(dateFilter);

      let fetchedRecords = [];
      if (Array.isArray(res)) {
        fetchedRecords = res;
      } else if (res?.success && Array.isArray(res?.data)) {
        fetchedRecords = res.data;
      } else if (res?.data && Array.isArray(res?.data?.data)) {
        fetchedRecords = res.data.data;
      }

      setRecords(fetchedRecords);

      const presentCount = fetchedRecords.filter(
        (r) => r.status === "Present" || r.status === "Half Day"
      ).length;
      const lateCount = fetchedRecords.filter(
        (r) => r.status === "Late"
      ).length;
      const absentCount = fetchedRecords.filter(
        (r) => r.status === "Absent"
      ).length;
      const overtimeCount = fetchedRecords.filter(
        (r) => r.overtimeHours > 0
      ).length;

      setStats({
        total: fetchedRecords.length,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        overtime: overtimeCount,
      });
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedRecord(null);
  };

  const safeRecords = Array.isArray(records) ? records : [];

  const filteredRecords = safeRecords.filter((record) => {
    const fullName = `${record.userId?.firstName || ""} ${record.userId?.lastName || ""}`.toLowerCase();
    const email = (record.userId?.email || "").toLowerCase();
    const department = (record.userId?.department || "").toLowerCase();
    const empCode = (record.userId?.employeeCode || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const searchMatch = fullName.includes(search) ||
      email.includes(search) ||
      department.includes(search) ||
      empCode.includes(search);
      
    if (!searchMatch) return false;

    if (activeCard !== "total") {
      if (activeCard === "on_time" && record.status !== "Present" && record.status !== "Half Day") return false;
      if (activeCard === "late" && record.status !== "Late") return false;
      if (activeCard === "absent" && record.status !== "Absent") return false;
      if (activeCard === "ot" && !(record.overtimeHours > 0)) return false;
    }

    return true;
  });

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm text-slate-900 dark:text-white">
                {record.userId?.firstName} {record.userId?.lastName}
              </span>
              <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
                {record.userId?.employeeCode || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">
                {record.userId?.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "userId.employeeCode",
        header: () => <div className="hidden md:block">Employee ID</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="hidden md:block font-mono text-sm text-muted-foreground">
              {record.userId?.employeeCode || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "userId.department",
        header: "Department",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {record.userId?.department || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "clockIn",
        header: "Clock In",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {record.clockIn
                ? new Date(record.clockIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "clockOut",
        header: "Clock Out",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {record.clockOut
                ? new Date(record.clockOut).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "totalBreakMinutes",
        header: () => <div className="text-right">Break</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
              {formatBreakTime(record.totalBreakMinutes)}
            </div>
          );
        },
      },
      {
        id: "totalHrs",
        header: () => <div className="text-right">Total Hrs</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="text-right text-sm font-medium text-purple-600 dark:text-purple-400">
              {calculateDuration(
                record.clockIn,
                record.clockOut,
                record.totalBreakMinutes
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "overtimeHours",
        header: () => <div className="text-right">OT Hrs</div>,
        cell: ({ row }) => {
          const record = row.original;
          const otFormatted = formatOTHours(record.overtimeHours);
          return (
            <div className="text-right">
              {otFormatted ? (
                <span className="text-sm font-mono font-medium text-amber-600 dark:text-amber-400">
                  {otFormatted}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          );
        },
      },
      {
        id: "otStatus",
        header: () => <div className="text-right">OT Status</div>,
        cell: ({ row }) => {
          const record = row.original;
          const otFormatted = formatOTHours(record.overtimeHours);
          return (
            <div className="text-right">
              {otFormatted ? (
                record.isOtApproved ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-xs px-2 py-0.5">
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 text-xs px-2 py-0.5">
                    Pending
                  </Badge>
                )
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-right">Status</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="text-right">
              <Badge
                variant="outline"
                className={`${getStatusColor(record.status)} px-2 py-0.5 border`}
              >
                {record.status}
              </Badge>
            </div>
          );
        },
      },
    ];

    if (canEdit) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="text-right">
              <ActionIcon
                icon={Pencil}
                tooltip="Edit Record"
                onClick={() => handleEditClick(record)}
              />
            </div>
          );
        },
      });
    }
    
    return cols;
  }, [canEdit]);

  return (
    <div className="space-y-5 max-w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Organization Attendance
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Daily high-level overview of company workforce.
        </p>
      </div>

      {showLockPanel && <PayrollLockPanel onLockChange={fetchRecords} />}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Headcount"
          value={stats.total}
          icon={<Users className="h-8 w-8" />}
          variant="blue"
          isActive={activeCard === 'total'}
          onClick={() => setActiveCard(activeCard === 'total' ? 'total' : 'total')}
        />
        <StatsCard
          title="On Time"
          value={stats.present}
          icon={<CheckCircle className="h-8 w-8" />}
          variant="green"
          isActive={activeCard === 'on_time'}
          onClick={() => setActiveCard(activeCard === 'on_time' ? 'total' : 'on_time')}
        />
        <StatsCard
          title="Late Arrivals"
          value={stats.late}
          icon={<Clock className="h-8 w-8" />}
          variant="red"
          isActive={activeCard === 'late'}
          onClick={() => setActiveCard(activeCard === 'late' ? 'total' : 'late')}
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={<XCircle className="h-8 w-8" />}
          variant="orange"
          isActive={activeCard === 'absent'}
          onClick={() => setActiveCard(activeCard === 'absent' ? 'total' : 'absent')}
        />
        <StatsCard
          title="Working OT Today"
          value={stats.overtime}
          icon={<Timer className="h-8 w-8" />}
          variant="amber"
          isActive={activeCard === 'ot'}
          onClick={() => setActiveCard(activeCard === 'ot' ? 'total' : 'ot')}
        />
      </div>

      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Daily Employee Logs</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full md:w-40 rounded-md bg-background"
                />
              </div>
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
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading organizational data...
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredRecords} 
              searchable={false} 
              defaultPageSize={10} 
            />
          )}
        </CardContent>
      </Card>

      <EditAttendanceModal
        open={editModalOpen}
        onClose={handleEditClose}
        record={selectedRecord}
        onSuccess={fetchRecords}
      />
    </div>
  );
};

export default AttendanceRecord;