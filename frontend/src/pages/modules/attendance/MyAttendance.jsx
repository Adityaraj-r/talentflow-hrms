import React, { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import holidayService from "@/services/holidayService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon, MapPin, Clock, LogIn, LogOut, CheckCircle2, FilePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import CorrectionRequestModal from "./CorrectionRequestModal";

// Helpers
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const formatTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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
const formatOTHours = (hours) => {
  if (!hours || hours <= 0) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
};
const formatBreakTime = (totalMinutes) => {
  if (!totalMinutes) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const statusConfig = {
  Present: { color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Late: { color: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  Absent: { color: "bg-red-500", light: "bg-red-50 text-red-700 border-red-200" },
  "Half Day": { color: "bg-orange-500", light: "bg-orange-50 text-orange-700 border-orange-200" },
  Holiday: { color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Leave: { color: "bg-purple-500", light: "bg-purple-50 text-purple-700 border-purple-200" }
};

const MyAttendance = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  
  // Month Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar | list

  // Widget State
  const [attendanceState, setAttendanceState] = useState("NOT_STARTED");
  const [todayRecord, setTodayRecord] = useState(null);
  const [locationText, setLocationText] = useState("");

  // Correction State
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, holRes, corrRes] = await Promise.all([
        attendanceService.getMyAttendance(),
        holidayService.getHolidays(),
        attendanceService.getMyCorrectionRequests(),
      ]);
      let records = [];
      if (Array.isArray(attRes)) records = attRes;
      else if (attRes?.success && Array.isArray(attRes?.data)) records = attRes.data;
      else if (attRes?.data && Array.isArray(attRes?.data?.data)) records = attRes.data.data;
      setHistory(records);
      setHolidays(holRes?.success && Array.isArray(holRes.data) ? holRes.data : []);
      setUsedThisMonth(corrRes?.meta?.usedThisMonth ?? 0);
      
      const today = new Date();
      const tr = records.find((r) => r.date && isSameDay(new Date(r.date), today));
      if (tr) {
        setTodayRecord(tr);
        setAttendanceState(tr.state || (tr.clockOut ? "CHECKED_OUT" : "CHECKED_IN"));
      } else {
        setAttendanceState("NOT_STARTED");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (actionFn, payload = null, successMessage) => {
    try {
      setActionLoading(true);
      const res = payload ? await actionFn(payload) : await actionFn();
      const updatedRecord = res?.data || res;
      if (updatedRecord) {
        setTodayRecord(updatedRecord);
        setAttendanceState(updatedRecord.state || (updatedRecord.clockOut ? "CHECKED_OUT" : "CHECKED_IN"));
        setHistory(prev => {
          const exists = prev.find(r => r._id === updatedRecord._id);
          if (exists) return prev.map(r => r._id === updatedRecord._id ? updatedRecord : r);
          return [...prev, updatedRecord];
        });
        toast.success(successMessage);
      }
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockIn = () => {
    setActionLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setActionLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleAction(attendanceService.clockIn, { latitude, longitude }, "Clocked in successfully!");
      },
      (error) => {
        toast.error("Location access denied. Please enable GPS to clock in.");
        setActionLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClockOut = () => handleAction(attendanceService.clockOut, null, "Clocked out successfully");

  // Computed data for "This month"
  const cm = currentDate.getMonth();
  const cy = currentDate.getFullYear();
  
  const monthRecords = useMemo(() => {
    return history.filter(r => {
      const rd = new Date(r.date || r.clockIn);
      return rd.getMonth() === cm && rd.getFullYear() === cy;
    });
  }, [history, cm, cy]);

  const stats = useMemo(() => {
    let bDays = 0;
    const d = new Date(cy, cm, 1);
    const end = cm === new Date().getMonth() && cy === new Date().getFullYear() ? new Date() : new Date(cy, cm + 1, 0);
    while (d <= end) {
      if (d.getDay() !== 0 && d.getDay() !== 6) bDays++;
      d.setDate(d.getDate() + 1);
    }
    
    const present = monthRecords.filter(r => r.status === "Present" || r.status === "Half Day" || r.status === "Late").length;
    const absent = monthRecords.filter(r => r.status === "Absent").length;
    const onLeave = monthRecords.filter(r => r.status === "On Leave" || r.status === "Leave").length;
    
    const rate = bDays > 0 ? Math.round((present / bDays) * 100) : 0;
    
    return { present, absent, onLeave, rate, bDays };
  }, [monthRecords, cm, cy]);

  const joinDateStr = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "-";

  const getCalendarDays = () => {
    const days = [];
    const daysInMonth = new Date(cy, cm + 1, 0).getDate();
    const firstDay = new Date(cy, cm, 1).getDay();
    const padding = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
    
    for (let i = 0; i < padding; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(cy, cm, i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const record = monthRecords.find(r => r.date === dateStr || (r.clockIn && r.clockIn.startsWith(dateStr)));
      const holiday = holidays.find(h => h.date === dateStr);
      
      days.push({
        empty: false,
        key: `day-${i}`,
        date,
        dayNumber: i,
        record,
        holiday,
        isWeekend,
        isToday: isSameDay(date, new Date())
      });
    }
    return days;
  };

  const calendarDays = useMemo(getCalendarDays, [cm, cy, monthRecords, holidays]);

  const nextMonth = () => setCurrentDate(new Date(cy, cm + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(cy, cm - 1, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const shiftName = user?.currentShift?.name || "Standard shift";
  const shiftTime = user?.currentShift ? `${user.currentShift.startTime} - ${user.currentShift.endTime}` : "09:00 AM - 06:00 PM";
  const todayDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const totalPages = Math.ceil(monthRecords.length / itemsPerPage);

  const getDayStatusColor = (day) => {
    if (day.holiday) return "bg-indigo-500";
    if (day.record) {
      if (day.record.status === "Present" || day.record.status === "Late") return "bg-emerald-500";
      if (day.record.status === "Half Day") return "bg-yellow-500";
      if (day.record.status === "Absent") return "bg-red-500";
      if (day.record.status === "On Leave" || day.record.status === "Leave") return "bg-purple-500";
    }
    if (day.isWeekend) return "bg-pink-500";
    if (day.date > new Date()) return "bg-slate-200 dark:bg-slate-800"; // Future
    return "bg-slate-300 dark:bg-slate-700"; // Past unmarked
  };

  return (
    <div className="space-y-6 max-w-full pb-10">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Mark present for today and review your personal attendance history.
        </p>
      </div>

      {/* 2. Top Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card - TODAY */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Today</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {todayDateStr} &middot; {shiftName}
                </p>
              </div>
              <Badge variant="secondary" className={cn("rounded-md px-2.5 py-1 text-xs font-semibold border-0", 
                  attendanceState === "CHECKED_IN" || attendanceState === "CHECKED_OUT" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>
                {attendanceState === "CHECKED_IN" || attendanceState === "CHECKED_OUT" ? "Present" : "Not started"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border-none">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                  <LogIn className="w-3.5 h-3.5" /> Check-in
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {todayRecord?.clockIn ? formatTime(todayRecord.clockIn) : "—"}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border-none">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                  <LogOut className="w-3.5 h-3.5" /> Check-out
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {todayRecord?.clockOut ? formatTime(todayRecord.clockOut) : "—"}
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {attendanceState === "NOT_STARTED" && (
                <Button 
                  onClick={handleClockIn} 
                  disabled={actionLoading}
                  className="w-full h-9 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg text-sm"
                >
                  Check In
                </Button>
              )}
              {attendanceState === "CHECKED_IN" && (
                <Button 
                  onClick={handleClockOut} 
                  disabled={actionLoading}
                  className="w-full h-9 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-sm"
                >
                  Check Out
                </Button>
              )}
              {(attendanceState === "CHECKED_OUT" || attendanceState === "AUTO_CLOSED") && (
                <div className="text-[13px] font-semibold text-emerald-600 mt-2">
                  Day complete. Attendance recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Card - THIS MONTH */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">This month</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} &middot; working days from join date ({joinDateStr})
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-5 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.rate}%</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{String(stats.present).padStart(2, '0')}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Present</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{String(stats.absent).padStart(2, '0')}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Absent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{String(stats.onLeave).padStart(2, '0')}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">On leave</div>
              </div>
            </div>


            

          </CardContent>
        </Card>
      </div>

      {/* 4. History Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 overflow-hidden">
        
        {/* History Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">History</h2>
            <p className="text-xs text-slate-500 mt-1">Calendar by default — switch to list for a day-by-day table.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[100px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full p-1 border border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setViewMode("calendar")}
                className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all", viewMode === "calendar" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-700")}
              >
                <CalendarIcon className="w-4 h-4" /> Calendar
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all", viewMode === "list" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-700")}
              >
                <ListIcon className="w-4 h-4" /> List
              </button>
            </div>
          </div>
        </div>

        {/* 5. Calendar View */}
        {viewMode === "calendar" && (
          <div className="w-full">
            <div className="grid grid-cols-7 gap-px mb-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((d, i) => {
                if (d.empty) return <div key={i} className="min-h-[70px] rounded-xl bg-transparent" />;
                
                let cellClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
                let statusText = null;
                let statusColor = "";
                let timeColor = "";
                let timeRange = null;

                if (d.isWeekend) {
                  cellClass = "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800";
                }

                if (d.holiday) {
                  cellClass = "bg-sky-100/60 dark:bg-sky-900/20 border-sky-400 dark:border-sky-700";
                  statusText = d.holiday.name || "Holiday";
                  statusColor = "text-sky-700 dark:text-sky-400";
                  timeColor = "text-sky-600/80 dark:text-sky-500/80";
                } else if (d.record) {
                  timeRange = `${formatTime(d.record.clockIn)} – ${d.record.clockOut ? formatTime(d.record.clockOut) : "..."}`;
                  if (d.record.status === "Absent") {
                    cellClass = "bg-red-100/60 dark:bg-red-900/20 border-red-400 dark:border-red-700";
                    statusText = "Absent";
                    statusColor = "text-red-700 dark:text-red-400";
                    timeColor = "text-red-600/80 dark:text-red-500/80";
                  } else if (d.record.status === "Present" || d.record.status === "Late") {
                    cellClass = "bg-green-100/60 dark:bg-green-900/20 border-green-400 dark:border-green-700";
                    statusText = "Present";
                    statusColor = "text-green-700 dark:text-green-400";
                    timeColor = "text-green-600/80 dark:text-green-500/80";
                  } else if (d.record.status === "Half Day") {
                    cellClass = "bg-yellow-100/60 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700";
                    statusText = "Half-day";
                    statusColor = "text-yellow-700 dark:text-yellow-400";
                    timeColor = "text-yellow-600/80 dark:text-yellow-500/80";
                  } else if (d.record.status === "On Leave" || d.record.status === "Leave") {
                    cellClass = "bg-purple-100/60 dark:bg-purple-900/20 border-purple-400 dark:border-purple-700";
                    statusText = "Leave";
                    statusColor = "text-purple-700 dark:text-purple-400";
                    timeColor = "text-purple-600/80 dark:text-purple-500/80";
                  }
                }

                if (d.isToday) {
                  // Override border to make it stand out as today, typically purple/indigo
                  cellClass = cellClass.replace(/border-[a-z]+-\d+/, "") + " border-indigo-400 dark:border-indigo-500 border-[1.5px]";
                }

                return (
                  <div 
                    key={d.key} 
                    onClick={() => {
                      if (d.record) {
                        setSelectedRecord(d.record);
                        setCorrectionModalOpen(true);
                      }
                    }}
                    className={cn(
                      "min-h-[100px] border rounded-[12px] p-2.5 flex flex-col transition-colors", 
                      cellClass,
                      d.record ? "cursor-pointer hover:opacity-80 active:scale-[0.98]" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{d.dayNumber}</span>
                      {d.isToday && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 hover:bg-indigo-100 text-[10px] px-2 py-0.5 rounded-md border-0 uppercase font-semibold">
                          TODAY
                        </Badge>
                      )}
                    </div>
                    
                    {statusText && (
                      <div className={cn("text-[13px] font-bold mb-1", statusColor)} title={statusText}>
                        {statusText}
                      </div>
                    )}
                    
                    {(timeRange || (d.holiday && d.holiday.type)) && (
                      <div className={cn("text-[11px] font-medium leading-tight", timeColor)}>
                        {timeRange || d.holiday.type}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. List View */}
        {viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Date", "Status", "Check-in", "Check-out", "Total Hours", "Break", "Overtime", ""].map((h) => (
                    <th key={h} className={cn("px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30", h === "" ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {monthRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                      No attendance records found for this month.
                    </td>
                  </tr>
                ) : (
                  monthRecords.sort((a,b) => new Date(b.date) - new Date(a.date)).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((day, i) => {
                    const sc = statusConfig[day.status] || statusConfig["Present"];
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {new Date(day.date || day.clockIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", sc.light)}>
                            {day.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {day.clockIn ? formatTime(day.clockIn) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {day.clockOut ? formatTime(day.clockOut) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">
                          {calculateTotalHours(day.clockIn, day.clockOut, day.totalBreakMinutes)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                          {formatBreakTime(day.totalBreakMinutes)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-amber-600">
                          {formatOTHours(day.overtimeHours) || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRecord(day);
                              setCorrectionModalOpen(true);
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                          >
                            <FilePen className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {viewMode === "list" && monthRecords.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={monthRecords.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        <CorrectionRequestModal
          open={correctionModalOpen}
          onClose={() => setCorrectionModalOpen(false)}
          record={selectedRecord}
          onSuccess={fetchData}
        />
      </div>
    </div>
  );
};

export default MyAttendance;
