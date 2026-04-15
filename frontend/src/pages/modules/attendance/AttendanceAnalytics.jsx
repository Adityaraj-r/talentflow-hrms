import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import leaveService from "@/services/leaveService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = {
  present: "#10b981",
  late: "#f59e0b",
  absent: "#ef4444",
  ot: "#f97316",
  leave: "#6366f1",
  blue: "#3b82f6",
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16"];

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
    });
  }
  return days;
};

const buildWeeklyTrend = (records) => {
  const days = getLast7Days();
  return days.map(({ date, label }) => {
    const dayRecords = records.filter((r) => r.date === date);
    return {
      day: label,
      Present: dayRecords.filter((r) => r.status === "Present").length,
      Late: dayRecords.filter((r) => r.status === "Late").length,
      Absent: dayRecords.filter((r) => r.status === "Absent").length,
    };
  });
};

const buildDeptData = (records) => {
  const map = {};
  for (const r of records) {
    const dept = r.userId?.department || "Unassigned";
    if (!map[dept]) map[dept] = { dept, total: 0, present: 0, late: 0, absent: 0, ot: 0 };
    map[dept].total++;
    if (r.status === "Present") map[dept].present++;
    else if (r.status === "Late") map[dept].late++;
    else if (r.status === "Absent") map[dept].absent++;
    if (r.overtimeHours > 0) map[dept].ot++;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
};

const buildLeaveDistribution = (leaves) => {
  const map = {};
  for (const l of leaves) {
    if (l.status !== "Approved") continue;
    map[l.leaveType] = (map[l.leaveType] || 0) + l.totalDays;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass, trend }) => (
  <div className={cn("rounded-xl border p-5 flex items-start justify-between", colorClass)}>
    <div>
      <p className="text-xs font-medium opacity-70 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
    <Icon className="w-8 h-8 opacity-50" />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const AttendanceAnalytics = () => {
  const { user } = useUser();
  const userRole = user?.role?.toUpperCase();
  const isExecutive = ["CEO", "COUNTRY_MANAGER"].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [otPending, setOtPending] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const fetchAll = async () => {
    try {
      setLoading(true);

      const canAccessOT = !isExecutive;
      const canAccessAllLeaves = !isExecutive;

      const [todayRes, otRes, leaveRes] = await Promise.all([
        attendanceService.getAllAttendance(today),
        canAccessOT
          ? attendanceService.getOvertimePending()
          : Promise.resolve({ success: true, data: [] }),
        canAccessAllLeaves
          ? leaveService.getAllLeaves()
          : Promise.resolve({ success: true, data: [] }),
      ]);

      let tRec = [];
      if (Array.isArray(todayRes)) tRec = todayRes;
      else if (todayRes?.success && Array.isArray(todayRes?.data)) tRec = todayRes.data;
      setTodayRecords(tRec);

      const days = getLast7Days();
      const weekPromises = days.map((d) => attendanceService.getAllAttendance(d.date));
      const weekResults = await Promise.all(weekPromises);
      const combined = weekResults.flatMap((res, i) => {
        let recs = [];
        if (Array.isArray(res)) recs = res;
        else if (res?.success && Array.isArray(res?.data)) recs = res.data;
        return recs.map((r) => ({ ...r, date: days[i].date }));
      });
      setAllRecords(combined);

      let ot = [];
      if (Array.isArray(otRes)) ot = otRes;
      else if (otRes?.success && Array.isArray(otRes?.data)) ot = otRes.data;
      setOtPending(ot);

      let lv = [];
      if (Array.isArray(leaveRes)) lv = leaveRes;
      else if (leaveRes?.success && Array.isArray(leaveRes?.data)) lv = leaveRes.data;
      setLeaves(lv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const totalToday = todayRecords.length;
  const presentToday = todayRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const lateToday = todayRecords.filter((r) => r.status === "Late").length;
  const absentToday = todayRecords.filter((r) => r.status === "Absent").length;
  const otToday = todayRecords.filter((r) => r.overtimeHours > 0).length;
  const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  const onLeaveToday = leaves.filter((l) => {
    if (l.status !== "Approved") return false;
    const start = new Date(l.startDate).toISOString().split("T")[0];
    const end = new Date(l.endDate).toISOString().split("T")[0];
    return today >= start && today <= end;
  }).length;

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const totalOtHours = otPending.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  const weeklyTrend = buildWeeklyTrend(allRecords);
  const deptData = buildDeptData(todayRecords);
  const leaveDistribution = buildLeaveDistribution(leaves);

  const cm = new Date().getMonth();
  const cy = new Date().getFullYear();
  const monthLeaves = leaves.filter((l) => {
    const d = new Date(l.startDate);
    return d.getMonth() === cm && d.getFullYear() === cy && l.status === "Approved";
  });
  const totalLeaveDays = monthLeaves.reduce((sum, l) => sum + l.totalDays, 0);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Time & Attendance Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentMonth} · Read-only executive view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Today: {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
          </Badge>
          {isExecutive && (
            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 px-3 py-1.5">
              Read Only
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Logged In"
          value={totalToday}
          subtitle="employees today"
          icon={Users}
          colorClass="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300"
        />
        <KPICard
          title="Present Today"
          value={presentToday}
          subtitle={`${attendanceRate}% attendance rate`}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
        />
        <KPICard
          title="Late Arrivals"
          value={lateToday}
          subtitle="arrived after grace period"
          icon={Clock}
          colorClass="bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300"
        />
        <KPICard
          title="Absent Today"
          value={absentToday}
          subtitle="unmarked absence"
          icon={XCircle}
          colorClass="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300"
        />
        <KPICard
          title="On Approved Leave"
          value={onLeaveToday}
          subtitle={`${pendingLeaves} pending approval`}
          icon={CalendarDays}
          colorClass="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300"
        />
        <KPICard
          title="Working Overtime"
          value={otToday}
          subtitle={`${totalOtHours.toFixed(1)}h pending approval`}
          icon={Timer}
          colorClass="bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Weekly Attendance Trend
              <span className="ml-auto text-xs font-normal text-muted-foreground">Last 7 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {weeklyTrend.every((d) => d.Present === 0 && d.Late === 0 && d.Absent === 0) ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No attendance data for the last 7 days.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Line type="monotone" dataKey="Present" stroke={COLORS.present} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Late" stroke={COLORS.late} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Absent" stroke={COLORS.absent} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {[
              { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 90 ? "text-emerald-600" : attendanceRate >= 75 ? "text-yellow-600" : "text-red-600" },
              { label: "Present", value: presentToday, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Late Arrivals", value: lateToday, color: lateToday > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-600 dark:text-slate-400" },
              { label: "Absent", value: absentToday, color: absentToday > 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400" },
              { label: "On Approved Leave", value: onLeaveToday, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Leave Pending Approval", value: pendingLeaves, color: pendingLeaves > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400" },
              { label: "OT Pending Approval", value: otPending.length, color: otPending.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400" },
              { label: "Total OT Hours (Pending)", value: `${totalOtHours.toFixed(1)}h`, color: "text-orange-600 dark:text-orange-400" },
              { label: "Leave Days This Month", value: totalLeaveDays, color: "text-slate-700 dark:text-slate-300" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={cn("text-sm font-semibold tabular-nums", item.color)}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              Department Breakdown — Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {deptData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No department data for today.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Bar dataKey="present" name="Present" fill={COLORS.present} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill={COLORS.late} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill={COLORS.absent} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ot" name="OT" fill={COLORS.ot} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              Leave Distribution
              <span className="ml-auto text-xs font-normal text-muted-foreground">This month</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {leaveDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No approved leaves this month.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={leaveDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leaveDistribution.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} days`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {leaveDistribution.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.value}d</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Department Headcount
              <span className="ml-auto text-xs font-normal text-muted-foreground">Today only</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deptData.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                No data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-500 uppercase tracking-wider">Present</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-yellow-500 uppercase tracking-wider">Late</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-red-500 uppercase tracking-wider">Absent</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-500 uppercase tracking-wider">OT</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {deptData.map((dept, i) => {
                      const rate = dept.total > 0 ? Math.round(((dept.present + dept.late) / dept.total) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{dept.dept}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">{dept.total}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{dept.present}</td>
                          <td className="px-4 py-3 text-right font-semibold text-yellow-600 dark:text-yellow-400 tabular-nums">{dept.late}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400 tabular-nums">{dept.absent}</td>
                          <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400 tabular-nums">{dept.ot}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              "text-xs font-bold tabular-nums",
                              rate >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                              rate >= 75 ? "text-yellow-600 dark:text-yellow-400" :
                              "text-red-600 dark:text-red-400"
                            )}>
                              {rate}%
                            </span>
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

        <div className="space-y-5">

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-500" />
                Overtime Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                {
                  label: "Pending Approval",
                  value: otPending.length,
                  sub: "records",
                  color: otPending.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400",
                },
                {
                  label: "Total OT Hours",
                  value: `${totalOtHours.toFixed(1)}h`,
                  sub: "pending approval",
                  color: "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "Employees Working OT",
                  value: otToday,
                  sub: "today",
                  color: "text-orange-600 dark:text-orange-400",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground/60">{item.sub}</p>
                  </div>
                  <span className={cn("text-xl font-bold tabular-nums", item.color)}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Attention Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {absentToday > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">{absentToday} employee{absentToday > 1 ? "s" : ""} absent today</p>
                    <p className="text-[10px] text-red-500/70 mt-0.5">Unmarked attendance</p>
                  </div>
                </div>
              )}
              {pendingLeaves > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                  <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{pendingLeaves} leave request{pendingLeaves > 1 ? "s" : ""} pending</p>
                    <p className="text-[10px] text-yellow-500/70 mt-0.5">Awaiting manager approval</p>
                  </div>
                </div>
              )}
              {otPending.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                  <Timer className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">{otPending.length} OT record{otPending.length > 1 ? "s" : ""} pending approval</p>
                    <p className="text-[10px] text-orange-500/70 mt-0.5">{totalOtHours.toFixed(1)}h total unapproved</p>
                  </div>
                </div>
              )}
              {absentToday === 0 && pendingLeaves === 0 && otPending.length === 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">All clear — no pending items</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default AttendanceAnalytics;