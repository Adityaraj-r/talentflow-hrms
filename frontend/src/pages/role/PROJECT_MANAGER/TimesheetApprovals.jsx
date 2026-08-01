import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, X, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import { StatsCard } from "@/components/ui/stats-card"

const TimesheetApprovals = () => {
  const [timesheets, setTimesheets] = useState([
    { id: 1, employee: "John Smith", employeeCode: "EMP-001234", hours: 40, week: "Jan 8-14, 2026", status: "Pending", avatar: "JS" },
    { id: 2, employee: "Sarah Connor", employeeCode: "EMP-001235", hours: 38, week: "Jan 8-14, 2026", status: "Pending", avatar: "SC" },
    { id: 3, employee: "Mike Ross", employeeCode: "EMP-001236", hours: 42, week: "Jan 8-14, 2026", status: "Pending", avatar: "MR" },
    { id: 4, employee: "Rachel Green", employeeCode: "EMP-001237", hours: 40, week: "Jan 8-14, 2026", status: "Approved", avatar: "RG" },
    { id: 5, employee: "Harvey Specter", employeeCode: "EMP-001238", hours: 45, week: "Jan 8-14, 2026", status: "Approved", avatar: "HS" },
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
  
  const [activeCard, setActiveCard] = useState("total")

  const filteredTimesheets = timesheets.filter(ts => {
    if (activeCard === "total") return true;
    if (activeCard === "pending") return ts.status === "Pending";
    if (activeCard === "approved") return ts.status === "Approved";
    if (activeCard === "rejected") return ts.status === "Rejected";
    return true;
  })

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
          icon={<Users className="h-6 w-6" />}
          variant="blue"
          isActive={activeCard === 'total'}
          onClick={() => setActiveCard(activeCard === 'total' ? 'total' : 'total')}
        />
        <StatsCard 
          title="Pending Review" 
          value={stats.pending} 
          icon={<Clock className="h-6 w-6" />}
          variant="amber"
          isActive={activeCard === 'pending'}
          onClick={() => setActiveCard(activeCard === 'pending' ? 'total' : 'pending')}
        />
        <StatsCard 
          title="Approved" 
          value={stats.approved} 
          icon={<Check className="h-6 w-6" />}
          variant="green"
          isActive={activeCard === 'approved'}
          onClick={() => setActiveCard(activeCard === 'approved' ? 'total' : 'approved')}
        />
        <StatsCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<X className="h-6 w-6" />}
          variant="red"
          isActive={activeCard === 'rejected'}
          onClick={() => setActiveCard(activeCard === 'rejected' ? 'total' : 'rejected')}
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
                <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimesheets.map((timesheet) => (
                <TableRow key={timesheet.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{timesheet.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{timesheet.employee}</span>
                        <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
                          {timesheet.employeeCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                    {timesheet.employeeCode}
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

export default TimesheetApprovals
