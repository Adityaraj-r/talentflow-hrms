import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import holidayService from "@/services/holidayService";
import AttendanceWidget from "@/components/ui/AttendanceWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, CheckCircle, XCircle, Clock, User, Calendar, CalendarDays } from "lucide-react";

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

const calculateTotalHours = (checkIn, checkOut, totalBreakMinutes = 0) => {
  if (!checkIn || !checkOut) return "-";

  const start = new Date(checkIn);
  const end = new Date(checkOut);
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
    Present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    "Half Day": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    Holiday: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  };
  return (
    <Badge variant="outline" className={`${styles[status] || "bg-slate-100 text-slate-700"} px-2 py-0.5 border`}>
      {status || "Unknown"}
    </Badge>
  );
};

const getMonth = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'short' });
const getDay = (dateStr) => new Date(dateStr).getDate();

const MyAttendance = () => {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [stats, setStats] = useState({
    workingDays: 0,
    present: 0,
    absent: 0,
    late: 0,
  });

  const employeeType = user?.employeeType || "Full-Time";
  const requiredHours = employeeType === "Part-Time" ? 4 : employeeType === "Intern" ? 6 : 9;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [attRes, holRes] = await Promise.all([
          attendanceService.getMyAttendance(),
          holidayService.getHolidays()
        ]);

        const attData = Array.isArray(attRes?.data) ? attRes.data : [];
        setHistory(attData);

        if (holRes?.data?.success && Array.isArray(holRes.data.data)) {
          setHolidays(holRes.data.data);
        } else if (Array.isArray(holRes?.data)) {
          setHolidays(holRes.data);
        } else {
          setHolidays([]);
        }

        const today = new Date();
        const businessDaysSoFar = (() => {
          let count = 0;
          const curDate = new Date(today.getFullYear(), today.getMonth(), 1);
          while (curDate <= today) {
            const day = curDate.getDay();
            if (day !== 0 && day !== 6) count++;
            curDate.setDate(curDate.getDate() + 1);
          }
          return count;
        })();

        const present = attData.filter((d) => d.status === "Present").length;
        const late = attData.filter((d) => d.status === "Late").length;
        const totalAttended = present + late + attData.filter((d) => d.status === "Half Day").length;

        setStats({
          workingDays: businessDaysSoFar,
          present,
          late,
          absent: Math.max(0, businessDaysSoFar - totalAttended),
        });

      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Attendance</h1>
            <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              <User className="w-3 h-3 mr-1" /> {employeeType}
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Target: <span className="font-medium text-slate-900 dark:text-white">{requiredHours} Hours/Day</span>
          </p>
        </div>
        <Button variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Working Days"
          value={stats.workingDays}
          icon={<Briefcase className="h-4 w-4 text-purple-500" />}
          className="text-purple-600"
        />
        <StatsCard
          title="Present"
          value={stats.present}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          className="text-green-600"
        />
        <StatsCard
          title="Late"
          value={stats.late}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
          className="text-orange-600"
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          className="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="space-y-6">
          <Card className="mb-6  from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-blue-100 dark:border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Current Shift
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.currentShift ? user.currentShift.name : "No Shift Assigned"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                  {user?.currentShift ? (
                    <>
                      <Clock className="w-4 h-4" />
                      {user.currentShift.startTime} - {user.currentShift.endTime}
                    </>
                  ) : (
                    "Contact Admin to assign a shift"
                  )}
                </p>
              </div>

              <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <AttendanceWidget employeeName={user?.firstName || "Employee"} />

          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {holidays.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No upcoming holidays.</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {holidays.map((h) => (
                    <div key={h._id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        <span className="text-[9px] font-bold uppercase">{getMonth(h.date)}</span>
                        <span className="text-sm font-bold leading-none">{getDay(h.date)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b p-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" /> Recent History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-transparent border-gray-200 dark:border-slate-800">

                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 w-[25%]">
                        Date
                      </th>

                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 w-[15%]">
                        Status
                      </th>

                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 w-[25%]">
                        In
                      </th>

                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-slate-400 w-[25%]">
                        Out
                      </th>

                      <th className="h-12 px-4 text-right align-middle font-medium text-gray-500 dark:text-slate-400 w-[15%] whitespace-nowrap">
                        Total Hrs
                      </th>
                    </tr>
                  </thead>

                  <tbody className="[&_tr:last-child]:border-0">
                    {history.map((day, i) => (
                      <tr key={i} className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-100 dark:border-slate-800">

                        <td className="p-4 align-middle font-medium text-gray-900 dark:text-slate-200">
                          {formatDate(day.date || day.checkIn)}
                        </td>

                        <td className="p-4 align-middle">
                          {getStatusBadge(day.status)}
                        </td>
                      
                          <td className="p-4 align-middle text-gray-600 dark:text-slate-400">
                            {day.checkIn ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                {formatTime(day.checkIn)}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="p-4 align-middle text-gray-600 dark:text-slate-400">
                            {day.checkOut ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                {formatTime(day.checkOut)}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="p-4 align-middle text-right font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                           {calculateTotalHours(day.checkIn, day.checkOut, day.totalBreakMinutes)}
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
    </div>
  );
};

const StatsCard = ({ title, value, icon, className }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default MyAttendance;