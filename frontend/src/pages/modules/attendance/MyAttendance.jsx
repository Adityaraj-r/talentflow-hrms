import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import holidayService from "@/services/holidayService";
import AttendanceWidget from "@/components/ui/AttendanceWidget";
import CorrectionRequestModal from "./CorrectionRequestModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  CalendarDays,
  FilePen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatBreakTime = (totalMinutes) => {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const calculateTotalHours = (clockIn, clockOut, totalBreakMinutes = 0) => {
  if (!clockIn || !clockOut) return "-";
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end - start;
  if (diffMs < 0) return "-";
  const grossMinutes = Math.floor(diffMs / 1000 / 60);
  const netMinutes = Math.max(0, grossMinutes - (totalBreakMinutes || 0));
  const hours = Math.floor(netMinutes / 60);
  const minutes = Math.floor(netMinutes % 60);
  return `${hours}h ${minutes}m`;
};

const getStatusBadge = (status) => {
  const styles = {
    Present:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    Absent:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    "Half Day":
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    Holiday:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  };
  return (
    <Badge
      variant="outline"
      className={`${styles[status] || "bg-slate-100 text-slate-700"} px-2 py-0.5 border whitespace-nowrap`}
    >
      {status || "Unknown"}
    </Badge>
  );
};

const getMonth = (dateStr) =>
  new Date(dateStr).toLocaleString("default", { month: "short" });
const getDay = (dateStr) => new Date(dateStr).getDate();

const MyAttendance = () => {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  const [stats, setStats] = useState({
    workingDays: 0,
    present: 0,
    absent: 0,
    late: 0,
  });

  const employeeType = user?.employeeType || "Full-Time";
  const requiredHours =
    employeeType === "Part-Time" ? 4 : employeeType === "Intern" ? 6 : 9;

  const fetchData = async () => {
    try {
      setLoading(true);

      const [attRes, holRes, corrRes] = await Promise.all([
        attendanceService.getMyAttendance(),
        holidayService.getHolidays(),
        attendanceService.getMyCorrectionRequests(),
      ]);

      const attData =
        attRes?.success && Array.isArray(attRes.data) ? attRes.data : [];
      setHistory(attData);

      const holData =
        holRes?.success && Array.isArray(holRes.data) ? holRes.data : [];
      setHolidays(holData);

      const used = corrRes?.meta?.usedThisMonth ?? 0;
      setUsedThisMonth(used);

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const businessDaysSoFar = (() => {
        let count = 0;
        const curDate = new Date(currentYear, currentMonth, 1);
        while (curDate <= today) {
          const day = curDate.getDay();
          if (day !== 0 && day !== 6) count++;
          curDate.setDate(curDate.getDate() + 1);
        }
        return count;
      })();

      const currentMonthData = attData.filter((d) => {
        if (!d.date && !d.clockIn) return false;
        const dDate = new Date(d.date || d.clockIn);
        return (
          dDate.getMonth() === currentMonth &&
          dDate.getFullYear() === currentYear
        );
      });

      const present = currentMonthData.filter(
        (d) => d.status === "Present"
      ).length;
      const late = currentMonthData.filter((d) => d.status === "Late").length;
      const totalAttended =
        present +
        late +
        currentMonthData.filter((d) => d.status === "Half Day").length;

      setStats({
        workingDays: businessDaysSoFar,
        present,
        late,
        absent: Math.max(0, businessDaysSoFar - totalAttended),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCorrectionClick = (record) => {
    setSelectedRecord(record);
    setCorrectionModalOpen(true);
  };

  const handleCorrectionClose = () => {
    setCorrectionModalOpen(false);
    setSelectedRecord(null);
  };

  if (loading)
    return (
      <div className="p-6 text-muted-foreground flex justify-center items-center min-h-[50vh]">
        Loading...
      </div>
    );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              My Attendance
            </h1>
            <Badge
              variant="secondary"
              className="text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
            >
              <User className="w-3 h-3 mr-1" /> {employeeType}
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Target:{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {requiredHours} Hours/Day
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto dark:bg-slate-800 dark:text-white dark:border-slate-700"
        >
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Working Days"
          value={stats.workingDays}
          icon={<Briefcase className="h-8 w-8" />}
          variant="blue"
        />
        <StatsCard
          title="Present"
          value={stats.present}
          icon={<CheckCircle className="h-8 w-8" />}
          variant="green"
        />
        <StatsCard
          title="Late"
          value={stats.late}
          icon={<Clock className="h-8 w-8" />}
          variant="orange"
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={<XCircle className="h-8 w-8" />}
          variant="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 min-w-0">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-blue-100 dark:border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Current Shift
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">
                  {user?.currentShift
                    ? user.currentShift.name
                    : "No Shift Assigned"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 whitespace-nowrap">
                  {user?.currentShift ? (
                    <>
                      <Clock className="w-4 h-4 shrink-0" />
                      {user.currentShift.startTime} -{" "}
                      {user.currentShift.endTime}
                    </>
                  ) : (
                    "Contact Admin"
                  )}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 ml-4">
                <Briefcase className="w-5 h-5 sm:w-6 sm:w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <AttendanceWidget employeeName={user?.firstName || "Employee"} />

          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Upcoming
                Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {holidays.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No upcoming holidays.
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {holidays.map((h) => (
                    <div
                      key={h._id}
                      className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shrink-0">
                        <span className="text-[9px] font-bold uppercase">
                          {getMonth(h.date)}
                        </span>
                        <span className="text-sm font-bold leading-none">
                          {getDay(h.date)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {h.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {h.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" /> Recent
                History
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Corrections used this month:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {usedThisMonth} / 3
                </span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No attendance records found.
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto">
                <table className="w-full min-w-[780px] caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-slate-50/50 dark:bg-slate-800/20">
                    <tr className="border-b transition-colors border-gray-200 dark:border-slate-800">
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Date
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        In
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Out
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Break
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Total Hrs
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {history.map((day, i) => (
                      <tr
                        key={i}
                        className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-100 dark:border-slate-800"
                      >
                        <td className="p-4 align-middle font-medium text-gray-900 dark:text-slate-200 whitespace-nowrap">
                          {formatDate(day.date || day.clockIn)}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          {getStatusBadge(day.status)}
                        </td>
                        <td className="p-4 align-middle text-gray-600 dark:text-slate-400 whitespace-nowrap">
                          {day.clockIn ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
                              {formatTime(day.clockIn)}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 align-middle text-gray-600 dark:text-slate-400 whitespace-nowrap">
                          {day.clockOut ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0" />
                              {formatTime(day.clockOut)}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 align-middle text-gray-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                          {formatBreakTime(day.totalBreakMinutes)}
                        </td>
                        <td className="p-4 align-middle text-right font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {calculateTotalHours(
                            day.clockIn,
                            day.clockOut,
                            day.totalBreakMinutes
                          )}
                        </td>
                        <td className="p-4 align-middle text-right whitespace-nowrap">
                          {!day.isLocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCorrectionClick(day)}
                              className="h-7 px-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1"
                            >
                              <FilePen className="w-3.5 h-3.5" />
                              Correct
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CorrectionRequestModal
        open={correctionModalOpen}
        onClose={handleCorrectionClose}
        record={selectedRecord}
        usedThisMonth={usedThisMonth}
        onSuccess={fetchData}
      />
    </div>
  );
};

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
    <div
      className={cn(
        "rounded-xl border p-6 transition-all duration-200 hover:scale-105",
        s.card
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8 shrink-0", s.icon)}>{icon}</div>
      </div>
    </div>
  );
};

export default MyAttendance;