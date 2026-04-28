import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import holidayService from "@/services/holidayService";
import AttendanceWidget from "@/components/ui/AttendanceWidget";
import CorrectionRequestModal from "./CorrectionRequestModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Users,
  CalendarDays,
  Download,
  FilePen,
  Lock,
  ChevronRight,
  TrendingUp,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatBreakTime = (totalMinutes) => {
  if (!totalMinutes) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatOTHours = (hours) => {
  if (!hours || hours <= 0) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
};

const calculateTotalHours = (clockIn, clockOut, breakMins = 0) => {
  if (!clockIn || !clockOut) return "—";
  const diffMs = new Date(clockOut) - new Date(clockIn);
  if (diffMs < 0) return "—";
  const net = Math.max(0, Math.floor(diffMs / 60000) - (breakMins || 0));
  const h = Math.floor(net / 60);
  const m = net % 60;
  return `${h}h ${m}m`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const statusConfig = {
  Present: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  },
  Late: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  },
  Absent: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
  "Half Day": {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  },
  Holiday: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
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
    amber: {
      card: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
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
        <div className={cn("h-8 w-8", s.icon)}>{icon}</div>
      </div>
    </div>
  );
};

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
    late: 0,
    absent: 0,
    overtimeDays: 0,
  });

  const employeeType = user?.employeeType || "Full-Time";
  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, holRes, corrRes] = await Promise.all([
        attendanceService.getMyAttendance(),
        holidayService.getHolidays(),
        attendanceService.getMyCorrectionRequests(),
      ]);

      const attData = attRes?.success && Array.isArray(attRes.data) ? attRes.data : [];
      setHistory(attData);
      setHolidays(holRes?.success && Array.isArray(holRes.data) ? holRes.data : []);
      setUsedThisMonth(corrRes?.meta?.usedThisMonth ?? 0);

      const today = new Date();
      const cm = today.getMonth();
      const cy = today.getFullYear();

      let bDays = 0;
      const d = new Date(cy, cm, 1);
      while (d <= today) {
        if (d.getDay() !== 0 && d.getDay() !== 6) bDays++;
        d.setDate(d.getDate() + 1);
      }

      const monthData = attData.filter((r) => {
        const rd = new Date(r.date || r.clockIn);
        return rd.getMonth() === cm && rd.getFullYear() === cy;
      });

      const present = monthData.filter((d) => d.status === "Present").length;
      const late = monthData.filter((d) => d.status === "Late").length;
      const halfDay = monthData.filter((d) => d.status === "Half Day").length;

      setStats({
        workingDays: bDays,
        present,
        late,
        absent: Math.max(0, bDays - (present + late + halfDay)),
        overtimeDays: monthData.filter((d) => d.overtimeHours > 0).length,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your attendance...</p>
        </div>
      </div>
    );
  }

  const upcomingHolidays = holidays.filter(
    (h) => new Date(h.date) >= new Date()
  ).slice(0, 5);

  return (
    <div className="space-y-6 max-w-full">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-muted-foreground font-medium">
              {getGreeting()}, {user?.firstName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{todayStr}</p>
        </div>

        <div className="flex items-center gap-3">
          {user?.currentShift && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
              <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {user.currentShift.name} &middot; {user.currentShift.startTime}–{user.currentShift.endTime}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Working Days"
          value={stats.workingDays}
          icon={<CalendarDays className="h-8 w-8" />}
          variant="blue"
        />
        <StatsCard
          title="Present"
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
        <StatsCard
          title="OT Days"
          value={stats.overtimeDays}
          icon={<Timer className="h-8 w-8" />}
          variant="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-6">

          <AttendanceWidget employeeName={user?.firstName || "Employee"} />

          <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Attendance History
                </CardTitle>
                <span className="text-xs text-muted-foreground px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                  Corrections:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      usedThisMonth >= 3
                        ? "text-red-500"
                        : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {usedThisMonth}/3
                  </span>{" "}
                  this month
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No attendance records yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        {["Date", "Status", "Clock In", "Clock Out", "Break", "Total", "OT", ""].map((h) => (
                          <th
                            key={h}
                            className={cn(
                              "px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider",
                              h === "" || h === "OT" || h === "Total" ? "text-right" : "text-left"
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {history.map((day, i) => {
                        const sc = statusConfig[day.status] || statusConfig["Present"];
                        const otFmt = formatOTHours(day.overtimeHours);
                        const isToday = day.date === new Date().toISOString().split("T")[0];

                        return (
                          <tr
                            key={i}
                            className={cn(
                              "group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
                              isToday && "bg-blue-50/40 dark:bg-blue-900/10"
                            )}
                          >
                          
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isToday && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                )}
                                <div>
                                  <p
                                    className={cn(
                                      "text-sm font-medium",
                                      isToday
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "text-slate-800 dark:text-slate-200"
                                    )}
                                  >
                                    {formatDate(day.date || day.clockIn)}
                                  </p>
                                  {isToday && (
                                    <p className="text-[10px] text-blue-500 dark:text-blue-400 leading-none mt-0.5">
                                      Today
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", sc.dot)} />
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs px-2 py-0.5 border font-normal", sc.badge)}
                                >
                                  {day.status}
                                </Badge>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={cn(
                                  "text-sm tabular-nums",
                                  day.clockIn
                                    ? "text-slate-700 dark:text-slate-300"
                                    : "text-slate-300 dark:text-slate-600"
                                )}
                              >
                                {day.clockIn ? formatTime(day.clockIn) : "—"}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={cn(
                                  "text-sm tabular-nums",
                                  day.clockOut
                                    ? "text-slate-700 dark:text-slate-300"
                                    : "text-slate-300 dark:text-slate-600"
                                )}
                              >
                                {day.clockOut ? formatTime(day.clockOut) : "—"}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                {formatBreakTime(day.totalBreakMinutes)}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                {calculateTotalHours(day.clockIn, day.clockOut, day.totalBreakMinutes)}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              {otFmt ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                                    {otFmt}
                                  </span>
                                  {day.isOtApproved ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">
                                      ✓ Approved
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium leading-none">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              {day.isLocked ? (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedRecord(day);
                                    setCorrectionModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <FilePen className="w-3.5 h-3.5" />
                                  Correct
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">

          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Current Shift
              </p>
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {user?.currentShift ? (
              <>
                <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {user.currentShift.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="tabular-nums">
                    {user.currentShift.startTime} — {user.currentShift.endTime}
                  </span>
                </div>
                {user.currentShift.graceMinutes > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Grace period:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {user.currentShift.graceMinutes} minutes
                      </span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No shift assigned. Contact your HR Manager.
              </p>
            )}
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                {
                  label: "Attendance Rate",
                  value:
                    stats.workingDays > 0
                      ? `${Math.round(
                          ((stats.present + stats.late) / stats.workingDays) * 100
                        )}%`
                      : "—",
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Days Present",
                  value: stats.present,
                  color: "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "Late Arrivals",
                  value: stats.late,
                  color:
                    stats.late > 0
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "Absent Days",
                  value: stats.absent,
                  color:
                    stats.absent > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "Overtime Days",
                  value: stats.overtimeDays,
                  color:
                    stats.overtimeDays > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "Corrections Used",
                  value: `${usedThisMonth} / 3`,
                  color:
                    usedThisMonth >= 3
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-700 dark:text-slate-300",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", item.color)}>
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Holidays */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingHolidays.length === 0 ? (
                <p className="px-4 py-5 text-xs text-muted-foreground text-center">
                  No upcoming holidays.
                </p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {upcomingHolidays.map((h) => {
                    const d = new Date(h.date);
                    const daysLeft = Math.ceil((d - new Date()) / 86400000);
                    return (
                      <div
                        key={h._id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 shrink-0">
                          <span className="text-[9px] font-bold uppercase text-blue-500 dark:text-blue-400 tracking-wider leading-none">
                            {d.toLocaleString("default", { month: "short" })}
                          </span>
                          <span className="text-base font-bold text-blue-700 dark:text-blue-300 leading-tight">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {h.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {daysLeft === 0
                              ? "Today"
                              : daysLeft === 1
                              ? "Tomorrow"
                              : `In ${daysLeft} days`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <CorrectionRequestModal
        open={correctionModalOpen}
        onClose={() => {
          setCorrectionModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        usedThisMonth={usedThisMonth}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MyAttendance;