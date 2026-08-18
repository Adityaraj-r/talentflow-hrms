import attendanceService from "@/services/attendanceService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card"; 
import { Button } from "./button";
import { Badge } from "./badge";
import { Clock, LogIn, LogOut, Timer, MapPin, Coffee, Play } from "lucide-react";
import { toast } from "sonner";

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const AttendanceWidget = ({ employeeName }) => {
  const [attendanceState, setAttendanceState] = useState("NOT_STARTED"); 
  const [clockInTime, setClockInTime] = useState(null);
  
  const [totalBreakMs, setTotalBreakMs] = useState(0);
  const [activeBreakStart, setActiveBreakStart] = useState(null);
  
  const [workDuration, setWorkDuration] = useState("00:00:00");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [locationText, setLocationText] = useState("Awaiting location...");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const processAttendanceRecord = (record) => {
    if (!record) {
      setAttendanceState("NOT_STARTED");
      return;
    }
    
    const state = record.state || (record.clockOut ? "CHECKED_OUT" : "CHECKED_IN");
    setAttendanceState(state);
    
    if (record.clockIn) setClockInTime(new Date(record.clockIn));
    
    const pastBreaksMs = (record.totalBreakMinutes || 0) * 60000;
    setTotalBreakMs(pastBreaksMs);

    if (state === "ON_BREAK" && record.breaks?.length > 0) {
      const lastBreak = record.breaks[record.breaks.length - 1];
      if (!lastBreak.endTime) {
        setActiveBreakStart(new Date(lastBreak.startTime));
      }
    } else {
      setActiveBreakStart(null);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await attendanceService.getMyAttendance();
        
        let records = [];
        if (Array.isArray(res)) records = res;
        else if (res?.success && Array.isArray(res?.data)) records = res.data;
        else if (res?.data && Array.isArray(res?.data?.data)) records = res.data.data;
        
        if (records.length > 0) {
          const today = new Date();
          const todayRecord = records.find((record) => 
            record.date && isSameDay(new Date(record.date), today)
          );

          if (todayRecord) {
            processAttendanceRecord(todayRecord);
          } else {
            setAttendanceState("NOT_STARTED");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  useEffect(() => {
    let interval;
    
    const formatAndSet = (diffMs) => {
      if (diffMs < 0) diffMs = 0;
      const h = String(Math.floor(diffMs / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, "0");
      setWorkDuration(`${h}:${m}:${s}`);
    };

    if (attendanceState === "CHECKED_IN" && clockInTime) {
      const updateTimer = () => {
        const diff = new Date() - clockInTime - totalBreakMs;
        formatAndSet(diff);
      };
      updateTimer(); 
      interval = setInterval(updateTimer, 1000);
    } else if (attendanceState === "ON_BREAK" && clockInTime && activeBreakStart) {
      const diff = activeBreakStart - clockInTime - totalBreakMs;
      formatAndSet(diff);
    }

    return () => clearInterval(interval);
  }, [attendanceState, clockInTime, totalBreakMs, activeBreakStart]);

  const handleAction = async (actionFn, payload = null, successMessage) => {
    try {
      setLoading(true);
      const res = payload ? await actionFn(payload) : await actionFn();
      const updatedRecord = res?.data || res; 
      
      if (updatedRecord) {
        processAttendanceRecord(updatedRecord);
        toast.success(successMessage);
      }
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    setLocationText("Fetching GPS location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationText(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        handleAction(
          attendanceService.clockIn,
          { latitude, longitude },
          "Clocked in successfully!"
        );
      },
      (error) => {
        setLocationText("Location access denied");
        toast.error("Location access denied. Please enable GPS to clock in.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const renderButtons = () => {
    if (loading) return <Button disabled className="w-full h-12">Processing...</Button>;

    switch (attendanceState) {
      case "NOT_STARTED":
        return (
          <Button 
            className="w-full h-auto min-h-[3rem] py-2 px-4 text-base sm:text-lg bg-purple-600 hover:bg-purple-700 whitespace-normal flex items-center justify-center leading-snug" 
            onClick={handleClockIn}
          >
            <LogIn className="mr-2 h-5 w-5 shrink-0" /> Clock In
          </Button>
        );
      case "CHECKED_IN":
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-auto min-h-[3rem] py-2 px-3 text-sm sm:text-base text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 whitespace-normal flex items-center justify-center leading-snug" 
              onClick={() => handleAction(attendanceService.startBreak, null, "Break started. Timer paused!")}
            >
              <Coffee className="mr-2 h-4 w-4 shrink-0" /> Start Break
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-auto min-h-[3rem] py-2 px-3 text-sm sm:text-base whitespace-normal flex items-center justify-center leading-snug" 
              onClick={() => handleAction(attendanceService.clockOut, null, "Clocked out successfully")}
            >
              <LogOut className="mr-2 h-4 w-4 shrink-0" /> Clock Out
            </Button>
          </div>
        );
      case "ON_BREAK":
        return (
          <Button 
            className="w-full h-auto min-h-[3rem] py-3 px-4 text-base sm:text-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg animate-pulse whitespace-normal flex flex-wrap items-center justify-center text-center leading-snug" 
            onClick={() => handleAction(attendanceService.endBreak, null, "Break ended, welcome back!")}
          >
            <Play className="mr-2 h-5 w-5 shrink-0" /> 
            <span>End Break & Resume Work</span>
          </Button>
        );
      case "CHECKED_OUT":
      case "AUTO_CLOSED":
        return (
          <div className="w-full min-h-[3rem] py-2 px-4 flex flex-wrap items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-medium text-center leading-snug">
            Shift Completed for Today
          </div>
        );
      default:
        return null;
    }
  };

  const getBadgeDetails = () => {
    switch(attendanceState) {
      case "CHECKED_IN": return { text: "ON DUTY", color: "bg-emerald-500 text-white" };
      case "ON_BREAK": return { text: "ON BREAK", color: "bg-orange-500 text-white" };
      case "CHECKED_OUT": return { text: "SHIFT ENDED", color: "bg-slate-500 text-white" };
      default: return { text: "OFF DUTY", color: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
    }
  };

  const badge = getBadgeDetails();

  return (
    <Card className={`shadow-md transition-colors duration-300 border-t-4 w-full ${attendanceState === 'ON_BREAK' ? 'border-t-orange-500' : 'border-t-purple-600'}`}>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 justify-between items-start sm:items-center">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600 shrink-0" />
            <span className="truncate">Daily Attendance</span>
          </CardTitle>
          <Badge className={`${badge.color} whitespace-nowrap shrink-0`} variant="outline">
            {badge.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        <div className="text-center py-4 sm:py-6 bg-muted/20 rounded-xl mb-4 sm:mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-2">
            {currentTime.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {(attendanceState === "CHECKED_IN" || attendanceState === "ON_BREAK") && (
          <div className={`flex flex-wrap justify-center items-center gap-2 font-mono text-xl sm:text-2xl font-bold py-3 px-2 rounded-lg mb-4 transition-all ${
            attendanceState === "ON_BREAK" 
              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
              : "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          }`}>
            <Timer className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span>{workDuration}</span>
            {attendanceState === "ON_BREAK" && <span className="text-xs sm:text-sm ml-1 opacity-70 whitespace-nowrap">(Paused)</span>}
          </div>
        )}

        {renderButtons()}
        
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-1.5 w-full">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={locationText}>Location: {locationText}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;