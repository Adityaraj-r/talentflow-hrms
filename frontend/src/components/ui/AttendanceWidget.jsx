import attendanceService from "@/services/attendanceService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card"; 
import { Button } from "./button";
import { Badge } from "./badge";
import { Clock, LogIn, LogOut, Timer, MapPin } from "lucide-react";

// Utility to compare dates without worrying about the time/minutes.
const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const AttendanceWidget = ({ employeeName }) => {
  const [status, setStatus] = useState("checked-out");
  const [checkInTime, setCheckInTime] = useState(null);
  const [workDuration, setWorkDuration] = useState("00:00:00");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Keeps the "Current Time" display accurate to the second.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // On component mount, we fetch attendance history to see if the user 
  // is already mid-shift. This prevents the UI from resetting if they refresh the page.
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const res = await attendanceService.getMyAttendance();
        
        if (res?.data && Array.isArray(res.data)) {
          const today = new Date();
          
          // We only care about a record created today.
          const todayRecord = res.data.find((record) => 
            isSameDay(new Date(record.date), today)
          );

          if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
            setStatus("checked-in");
            setCheckInTime(new Date(todayRecord.checkIn));
          } 
          else if (todayRecord && todayRecord.checkOut) {
            setStatus("checked-out");
            setCheckInTime(null);
          }
        }
      } catch (err) {
        console.error("Failed to sync attendance status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  // This effect calculates the "Hours Worked" live. 
  // It only runs when the status is 'checked-in'.
  useEffect(() => {
    let interval;
    if (status === "checked-in" && checkInTime) {
      const updateTimer = () => {
        const diff = new Date() - checkInTime;
        if (diff < 0) {
            setWorkDuration("00:00:00");
            return;
        }
        // Formatting milliseconds into a readable HH:MM:SS string.
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        setWorkDuration(`${h}:${m}:${s}`);
      };

      updateTimer(); 
      interval = setInterval(updateTimer, 1000);
    } else {
      setWorkDuration("00:00:00");
    }
    return () => clearInterval(interval);
  }, [status, checkInTime]);

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.clockIn();
      setStatus("checked-in");

      // We extract the server's check-in time to ensure the timer is synced 
      // with the database, not just the user's local system clock.
      const responseData = res.data?.data || res.data || {};
      const newCheckInTime = responseData.checkIn ? new Date(responseData.checkIn) : new Date();

      setCheckInTime(newCheckInTime);
      setWorkDuration("00:00:00");
    } catch (err) {
      console.error("Clock-in failed", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      await attendanceService.clockOut();
      setStatus("checked-out");
      setCheckInTime(null);
      setWorkDuration("00:00:00");
    } catch (err) {
      console.error("Clock-out failed", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md border-t-4 border-t-blue-600">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Daily Attendance
          </CardTitle>
          <Badge variant={status === "checked-in" ? "default" : "secondary"}>
            {status === "checked-in" ? "ON DUTY" : "OFF DUTY"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Main Clock Display */}
        <div className="text-center py-6 bg-muted/20 rounded-xl mb-6">
          <h2 className="text-4xl font-bold">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {status === "checked-out" ? (
          <Button 
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
            onClick={handleClockIn}
            disabled={loading}
          >
            <LogIn className="mr-2 h-5 w-5" /> 
            {loading ? "Syncing..." : "Clock In"}
          </Button>
        ) : (
          <>
             {/* Live Timer shown only when user is clocked in */}
             <div className="flex justify-center gap-2 text-blue-600 font-mono text-xl font-bold bg-blue-50 py-2 rounded mb-3">
                <Timer className="h-5 w-5" />
                {workDuration}
             </div>
             <Button 
                variant="destructive" 
                className="w-full h-12" 
                onClick={handleClockOut}
                disabled={loading}
              >
              <LogOut className="mr-2 h-4 w-4" /> 
              {loading ? "Syncing..." : "Clock Out"}
            </Button>
          </>
        )}
        
        {/* Note: This IP is hardcoded for now; consider fetching real IP or Geolocation in the future. */}
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-1">
          <MapPin className="h-3 w-3" />
          <span>Location: Detected (IP: 192.168.1.1)</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;