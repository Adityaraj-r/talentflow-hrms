import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, X, Clock, Users } from "lucide-react"
import { toast } from "sonner"

const TimesheetApprovals = () => {
  const [timesheets, setTimesheets] = useState([
    { id: 1, employee: "John Smith", hours: 40, week: "Jan 8-14, 2026", status: "Pending", avatar: "JS" },
    { id: 2, employee: "Sarah Connor", hours: 38, week: "Jan 8-14, 2026", status: "Pending", avatar: "SC" },
    { id: 3, employee: "Mike Ross", hours: 42, week: "Jan 8-14, 2026", status: "Pending", avatar: "MR" },
    { id: 4, employee: "Rachel Green", hours: 40, week: "Jan 8-14, 2026", status: "Approved", avatar: "RG" },
    { id: 5, employee: "Harvey Specter", hours: 45, week: "Jan 8-14, 2026", status: "Approved", avatar: "HS" },
  ])

  const handleApprove = (id) => {
    setTimesheets(timesheets.map(ts => 
      ts.id === id ? { ...ts, status: "Approved" } : ts
    ))
    toast.success("Timesheet approved successfully")
  }

  const handleReject = (id) => {
    setTimesheets(timesheets.map(ts => 
      ts.id === id ? { ...ts, status: "Rejected" } : ts
    ))
    toast.error("Timesheet rejected")
  }

  const stats = {
    pending: timesheets.filter(ts => ts.status === "Pending").length,
    approved: timesheets.filter(ts => ts.status === "Approved").length,
    rejected: timesheets.filter(ts => ts.status === "Rejected").length,
    total: timesheets.length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet Approvals</h1>
          <p className="text-muted-foreground">Review and approve employee timesheets</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard 
          title="Total Submissions" 
          value={stats.total} 
          icon={<Users className="h-4 w-4" />}
          color="text-blue-600"
        />
        <StatsCard 
          title="Pending Review" 
          value={stats.pending} 
          icon={<Clock className="h-4 w-4" />}
          color="text-orange-600"
        />
        <StatsCard 
          title="Approved" 
          value={stats.approved} 
          icon={<Check className="h-4 w-4" />}
          color="text-green-600"
        />
        <StatsCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<X className="h-4 w-4" />}
          color="text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((timesheet) => (
                <TableRow key={timesheet.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{timesheet.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{timesheet.employee}</span>
                    </div>
                  </TableCell>
                  <TableCell>{timesheet.week}</TableCell>
                  <TableCell>
                    <span className="font-mono font-semibold">{timesheet.hours}h</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        timesheet.status === "Approved" ? "bg-green-100 text-green-700 border-green-200" :
                        timesheet.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-orange-100 text-orange-700 border-orange-200"
                      }
                    >
                      {timesheet.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {timesheet.status === "Pending" && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(timesheet.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(timesheet.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-muted ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default TimesheetApprovals
