import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react"

const ProjectManagerDashboard = () => {
  const stats = [
    { title: "Total Projects", value: "24", icon: <ClipboardList className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Team Members", value: "156", icon: <Users className="h-4 w-4" />, color: "text-green-600", bg: "bg-green-50" },
    { title: "Pending Tasks", value: "42", icon: <Clock className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Critical Issues", value: "3", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600", bg: "bg-red-50" }
  ]

  const recentProjects = [
    { name: "Pipeline Expansion - Phase 2", progress: 75, status: "On Track", team: 12 },
    { name: "Refinery Safety Audit", progress: 45, status: "In Progress", team: 8 },
    { name: "Equipment Modernization", progress: 90, status: "Near Complete", team: 15 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Manager Dashboard</h1>
          <p className="text-muted-foreground">Overview of projects, tasks, and team performance</p>
        </div>
        <Button><Calendar className="mr-2 h-4 w-4" /> Schedule Meeting</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`border-l-4 ${stat.bg}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {project.team} members
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{project.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> View Task Board
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Safety Incidents
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Timesheet Approvals
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Team Performance
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProjectManagerDashboard
