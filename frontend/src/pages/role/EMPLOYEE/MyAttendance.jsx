import { useState } from "react"
import { useUser } from "../../../contexts/UserContext"
import AttendanceWidget from "../../../components/ui/AttendanceWidget"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Calendar as CalendarIcon, Download, Briefcase, CheckCircle, XCircle, Clock, User } from "lucide-react"

const MyAttendance = () => {
  const { user } = useUser()
  
  const displayName = user?.name || "Employee"
  const employeeType = user?.employeeType || "Full-Time"
  
  const getRequiredHours = (type) => {
    switch(type) {
        case "Part-Time": return 4;
        case "Intern": return 6;
        default: return 9;
    }
  }
  const requiredHours = getRequiredHours(employeeType)

  const stats = {
    workingDays: 22,
    present: 18,
    absent: 1,
    late: 2
  }

  const [history] = useState([
    { date: "2026-01-12", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present", total: "09:00" },
    { date: "2026-01-11", checkIn: "-", checkOut: "-", status: "Weekend", total: "00:00" },
    { date: "2026-01-10", checkIn: "09:15 AM", checkOut: "06:15 PM", status: "Late", total: "09:00" },
    { date: "2026-01-09", checkIn: "10:00 AM", checkOut: "04:00 PM", status: "Half Day", total: "06:00" },
  ])

  const checkHoursStatus = (totalDuration) => {
    const hoursWorked = parseInt(totalDuration.split(':')[0]);
    if (hoursWorked >= requiredHours) return "text-green-600 font-bold";
    if (hoursWorked === 0) return "text-gray-400";
    return "text-red-500 font-bold";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">My Attendance</h1>
            <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">
                <User className="w-3 h-3 mr-1"/> {employeeType}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Target: <span className="font-medium text-foreground">{requiredHours} Hours/Day</span>
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Working Days" 
          value={stats.workingDays} 
          icon={<Briefcase className="h-4 w-4 text-blue-500" />} 
          subtext="Total days this month"
        />
        <StatsCard 
          title="Present" 
          value={stats.present} 
          icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
          subtext="Days attended"
          className="text-green-600"
        />
        <StatsCard 
          title="Absent" 
          value={stats.absent} 
          icon={<XCircle className="h-4 w-4 text-red-500" />} 
          subtext="Days missed"
          className="text-red-600"
        />
        <StatsCard 
          title="Late" 
          value={stats.late} 
          icon={<Clock className="h-4 w-4 text-yellow-500" />} 
          subtext="Late arrivals"
          className="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
           <AttendanceWidget employeeName={displayName} />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle>Recent History</CardTitle></CardHeader>
            <CardContent>
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
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          day.status === "Present" ? "text-green-600 border-green-200 bg-green-50" :
                          day.status === "Late" ? "text-yellow-600 border-yellow-200 bg-yellow-50" :
                          day.status === "Absent" ? "text-red-600 border-red-200 bg-red-50" : 
                          "text-gray-600 border-gray-200 bg-gray-50"
                        }>
                          {day.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{day.checkIn}</TableCell>
                      <TableCell>{day.checkOut}</TableCell>
                      <TableCell className={`text-right font-mono ${checkHoursStatus(day.total)}`}>
                        {day.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const StatsCard = ({ title, value, icon, subtext, className }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <div className={`text-2xl font-bold ${className}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </CardContent>
  </Card>
)

export default MyAttendance
