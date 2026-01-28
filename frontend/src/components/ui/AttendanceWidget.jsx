import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Clock, LogIn, LogOut, Timer, MapPin } from "lucide-react"

const AttendanceWidget = ({ employeeName }) => {
  const [status, setStatus] = useState("checked-out") 
  const [checkInTime, setCheckInTime] = useState(null)
  const [workDuration, setWorkDuration] = useState("00:00:00")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let interval
    if (status === "checked-in" && checkInTime) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now - checkInTime
        const hours = Math.floor(diff / 3600000).toString().padStart(2, "0")
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0")
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0")
        setWorkDuration(`${hours}:${minutes}:${seconds}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status, checkInTime])

  const handleCheckIn = () => {
    setCheckInTime(new Date())
    setStatus("checked-in")
  }

  const handleCheckOut = () => {
    setStatus("checked-out")
  }

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
        <div className="text-center py-6 bg-muted/20 rounded-xl mb-6">
          <h2 className="text-4xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="space-y-3">
          {status === "checked-out" ? (
            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={handleCheckIn}>
              <LogIn className="mr-2 h-5 w-5" /> Clock In
            </Button>
          ) : (
            <div className="space-y-3">
               <div className="flex items-center justify-center gap-2 text-blue-600 font-mono text-xl font-bold bg-blue-50 py-2 rounded">
                  <Timer className="h-5 w-5" />
                  {workDuration}
               </div>
               <Button variant="destructive" className="w-full h-12" onClick={handleCheckOut}>
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-1">
          <MapPin className="h-3 w-3" />
          <span>Location: Detected (IP: 192.168.1.1)</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default AttendanceWidget
