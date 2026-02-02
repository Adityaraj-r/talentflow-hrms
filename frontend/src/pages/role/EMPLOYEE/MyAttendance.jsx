import { useEffect, useState } from "react";
import { useUser } from "../../../contexts/UserContext";
import attendanceService from "../../../services/attendanceService";

import AttendanceWidget from "../../../components/ui/AttendanceWidget";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Download, Briefcase, CheckCircle, XCircle, Clock, User } from "lucide-react";

const MyAttendance = () => {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    workingDays: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [history, setHistory] = useState([]);

  // Fallback to "Full-Time" ensures the UI doesn't crash if the profile data is incomplete.
  const employeeType = user?.employeeType || "Full-Time";

  const getRequiredHours = (type) => {
    switch (type) {
      case "Part-Time": return 4;
      case "Intern": return 6;
      default: return 9; // Standard 9-hour shift
    }
  };

  // Calculates working days (Mon-Fri) in a date range.
  // NOTE: This currently does NOT account for Public Holidays. 
  // TODO: In the future, pass a list of holidays to exclude them from this count.
  const getBusinessDays = (endDate) => {
    let count = 0;
    const curDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      // 0 = Sunday, 6 = Saturday. Count only if NOT weekend.
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const requiredHours = getRequiredHours(employeeType);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await attendanceService.getMyAttendance();
        const data = Array.isArray(res?.data) ? res.data : [];
        setHistory(data);

        // --- DYNAMIC STATS CALCULATION ---
        const today = new Date();
        
        // 1. How many days *should* they have worked so far?
        const businessDaysSoFar = getBusinessDays(today);

        // 2. Count actual logged events from the DB.
        const present = data.filter((d) => d.status === "Present").length;
        const late = data.filter((d) => d.status === "Late").length;
        const halfDay = data.filter((d) => d.status === "Half Day").length;
        
        const totalAttended = present + late + halfDay;

        // 3. Calculate Absent
        // Since the DB doesn't store "Absent" records explicitly, we infer it:
        // (Days Passed) - (Days Attended).
        // Math.max(0, ...) acts as a safety net so we never display negative numbers.
        const absent = Math.max(0, businessDaysSoFar - totalAttended);

        setStats({
          workingDays: businessDaysSoFar, 
          present,
          late,
          absent,
        });

      } catch (err) {
        console.error("Failed to load attendance", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Visual helper: Returns red text if under-hours, green if target met.
  const checkHoursStatus = (total) => {
    if (!total || total === "00:00") return "text-gray-400";
    
    // Simple integer parsing. If you need minute-level precision later, convert to totalMinutes.
    const hours = parseInt(total.split(":")[0]);
    if (hours >= requiredHours) return "text-green-600 font-bold";
    return "text-red-500 font-bold";
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Role & Target Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">My Attendance</h1>
            <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">
              <User className="w-3 h-3 mr-1" /> {employeeType}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Target: <span className="font-medium text-foreground">{requiredHours} Hours/Day</span>
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* High-level stats at a glance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Working Days" value={stats.workingDays} icon={<Briefcase />} />
        <StatsCard title="Present" value={stats.present} icon={<CheckCircle />} className="text-green-600" />
        <StatsCard title="Absent" value={stats.absent} icon={<XCircle />} className="text-red-600" />
        <StatsCard title="Late" value={stats.late} icon={<Clock />} className="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The clock-in/out widget lives here */}
        <AttendanceWidget employeeName={user?.firstName || "Employee"} />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">No attendance records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead className="text-right">Total Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((day, i) => (
                    <TableRow key={i}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{day.status}</Badge>
                      </TableCell>
                      <TableCell>{day.checkIn || "-"}</TableCell>
                      <TableCell>{day.checkOut || "-"}</TableCell>
                      {/* Applying the conditional color styling here */}
                      <TableCell className={`text-right font-mono ${checkHoursStatus(day.total)}`}>
                        {day.total || "00:00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, className }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${className || ""}`}>{value}</div>
    </CardContent>
  </Card>
);

export default MyAttendance;