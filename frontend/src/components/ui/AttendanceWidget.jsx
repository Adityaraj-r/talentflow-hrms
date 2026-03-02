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
  const [checkInTime, setCheckInTime] = useState(null);
  
  const [totalBreakMs, setTotalBreakMs] = useState(0);
  const [activeBreakStart, setActiveBreakStart] = useState(null);
  
  const [workDuration, setWorkDuration] = useState("00:00:00");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const processAttendanceRecord = (record) => {
    if (!record) {
      setAttendanceState("NOT_STARTED");
      return;
    }
    
    const state = record.state || (record.checkOut ? "CHECKED_OUT" : "CHECKED_IN");
    setAttendanceState(state);
    
    if (record.checkIn) setCheckInTime(new Date(record.checkIn));
    
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
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        
        if (records.length > 0) {
          const today = new Date();
          const todayRecord = records.find((record) => 
            isSameDay(new Date(record.date), today)
          );

          if (todayRecord) {
            processAttendanceRecord(todayRecord);
          } else {
            setAttendanceState("NOT_STARTED");
          }
        }
      } catch (err) {
        console.error("Failed to sync attendance status:", err);
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

    if (attendanceState === "CHECKED_IN" && checkInTime) {
      const updateTimer = () => {
        const diff = new Date() - checkInTime - totalBreakMs;
        formatAndSet(diff);
      };
      updateTimer(); 
      interval = setInterval(updateTimer, 1000);
    } else if (attendanceState === "ON_BREAK" && checkInTime && activeBreakStart) {
      const diff = activeBreakStart - checkInTime - totalBreakMs;
      formatAndSet(diff);
    }

    return () => clearInterval(interval);
  }, [attendanceState, checkInTime, totalBreakMs, activeBreakStart]);

  const handleAction = async (actionFn, successMessage) => {
    try {
      setLoading(true);
      const res = await actionFn();
      const updatedRecord = res?.data?.data || res?.data; 
      
      if (updatedRecord) {
        processAttendanceRecord(updatedRecord);
        toast.success(successMessage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Action failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderButtons = () => {
    if (loading) return <Button disabled className="w-full h-12">Syncing...</Button>;

    switch (attendanceState) {
      case "NOT_STARTED":
        return (
          <Button 
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
            onClick={() => handleAction(attendanceService.clockIn, "Clocked in successfully!")}
          >
            <LogIn className="mr-2 h-5 w-5" /> Clock In
          </Button>
        );
      case "CHECKED_IN":
        return (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20" 
              onClick={() => handleAction(attendanceService.startBreak, "Break started. Timer paused!")}
            >
              <Coffee className="mr-2 h-4 w-4" /> Start Break
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12" 
              onClick={() => handleAction(attendanceService.clockOut, "Clocked out successfully")}
            >
              <LogOut className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          </div>
        );
      case "ON_BREAK":
        return (
          <Button 
            className="w-full h-12 text-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg animate-pulse" 
            onClick={() => handleAction(attendanceService.endBreak, "Break ended, welcome back!")}
          >
            <Play className="mr-2 h-5 w-5" /> End Break & Resume Work
          </Button>
        );
      case "CHECKED_OUT":
      case "AUTO_CLOSED":
        return (
          <div className="w-full h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-medium">
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
    <Card className={`shadow-md transition-colors duration-300 border-t-4 ${attendanceState === 'ON_BREAK' ? 'border-t-orange-500' : 'border-t-blue-600'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Daily Attendance
          </CardTitle>
          <Badge className={badge.color} variant="outline">
            {badge.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-6 bg-muted/20 rounded-xl mb-6">
          <h2 className="text-4xl font-bold">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {(attendanceState === "CHECKED_IN" || attendanceState === "ON_BREAK") && (
          <div className={`flex justify-center items-center gap-2 font-mono text-2xl font-bold py-3 rounded-lg mb-4 transition-all ${
            attendanceState === "ON_BREAK" 
              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
              : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          }`}>
            <Timer className="h-6 w-6" />
            {workDuration}
            {attendanceState === "ON_BREAK" && <span className="text-sm ml-2 opacity-70">(Paused)</span>}
          </div>
        )}

        {renderButtons()}
        
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-1">
          <MapPin className="h-3 w-3" />
          <span>Location: Detected (IP: 192.168.1.1)</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;