import { useState, useEffect } from "react";
import attendanceService from "@/services/attendanceService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const formatBreakTime = (totalMinutes) => {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const AttendanceRecord = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getAllAttendance(dateFilter);
      if (res.data) {
        const fetchedRecords = res.data;
        setRecords(fetchedRecords);

        const presentCount = fetchedRecords.filter(r => r.status === "Present" || r.status === "Half Day").length;
        const lateCount = fetchedRecords.filter(r => r.status === "Late").length;
        const absentCount = fetchedRecords.filter(r => r.status === "Absent").length;

        setStats({
          total: fetchedRecords.length,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
        });
      }
    } catch (err) {
      console.error("Error fetching attendance for CEO:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

  const filteredRecords = records.filter((record) => {
    const fullName = `${record.userId?.firstName || ""} ${record.userId?.lastName || ""}`.toLowerCase();
    const department = (record.userId?.department || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || department.includes(search);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
      case "Late": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200";
      case "Absent": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "Half Day": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const calculateDuration = (checkIn, checkOut, totalBreakMinutes = 0) => {
    if (!checkIn || !checkOut) return "-";

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";

    const diffMs = end - start;
    if (diffMs < 0) return "-";

    const grossMinutes = Math.floor(diffMs / 1000 / 60);
    const netMinutes = Math.max(0, grossMinutes - (totalBreakMinutes || 0));

    const hours = Math.floor(netMinutes / 60);
    const minutes = Math.floor(netMinutes % 60);

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}h ${formattedMinutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Organization Attendance</h1>
        <p className="text-muted-foreground">Daily high-level overview of company workforce.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Headcount (Logged)"
          value={stats.total}
          icon={<Users className="h-8 w-8" />}
          variant="blue"
        />
        <StatsCard
          title="On Time"
          value={stats.present}
          icon={<CheckCircle className="h-8 w-8" />}
          variant="green"
        />
        <StatsCard
          title="Late Arrivals"
          value={stats.late}
          icon={<Clock className="h-8 w-8" />}
          variant="red"
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={<XCircle className="h-8 w-8" />}
          variant="orange"
        />
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
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

              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or dept..."
                  className="pl-8 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead className="text-right">Break</TableHead>
                  <TableHead className="text-right">Total Hrs</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading organizational data...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No records found for the selected date.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {record.userId?.firstName} {record.userId?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">{record.userId?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {record.userId?.department || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                        {formatBreakTime(record.totalBreakMinutes)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                        {calculateDuration(record.checkIn, record.checkOut, record.totalBreakMinutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`${getStatusColor(record.status)} px-2 py-0.5 border`}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsCard = ({ title, value, icon, variant }) => {
  const styles = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    green: {
      card: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    orange: {
      card: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
      icon: "text-orange-600 dark:text-orange-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
    red: {
      card: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
      icon: "text-purple-600 dark:text-purple-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
    },
  };

  const s = styles[variant] || styles.blue;

  return (
    <div className={cn("rounded-xl border p-6 transition-all duration-200 hover:scale-105", s.card)}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8", s.icon)}>{icon}</div>
      </div>
    </div>
  );
};

export default AttendanceRecord;