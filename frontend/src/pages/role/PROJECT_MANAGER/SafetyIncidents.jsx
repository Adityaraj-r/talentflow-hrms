import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, Plus, FileText } from "lucide-react"
import { toast } from "sonner"

const SafetyIncidents = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  const [incidents] = useState([
    { id: "INC-001", date: "2026-01-15", type: "Near Miss", severity: "Low", location: "Drilling Site A", status: "Resolved" },
    { id: "INC-002", date: "2026-01-14", type: "Equipment Failure", severity: "Medium", location: "Rig Platform B", status: "In Progress" },
    { id: "INC-003", date: "2026-01-12", type: "Minor Injury", severity: "Medium", location: "Workshop C", status: "Resolved" },
    { id: "INC-004", date: "2026-01-10", type: "Spill", severity: "High", location: "Storage Tank 5", status: "Under Investigation" },
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsOpen(false)
    toast.success("Safety incident reported successfully")
  }

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "High": return "bg-red-100 text-red-700 border-red-200"
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Low": return "bg-green-100 text-green-700 border-green-200"
      default: return "bg-gray-100"
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "Resolved": return "bg-green-100 text-green-700 border-green-200"
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200"
      case "Under Investigation": return "bg-orange-100 text-orange-700 border-orange-200"
      default: return "bg-gray-100"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safety Incidents</h1>
          <p className="text-muted-foreground">Report and track safety incidents</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Report Incident</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Report Safety Incident
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Incident Date</Label>
                  <Input type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Incident Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="near-miss">Near Miss</SelectItem>
                      <SelectItem value="injury">Minor Injury</SelectItem>
                      <SelectItem value="equipment">Equipment Failure</SelectItem>
                      <SelectItem value="spill">Spill</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity Level</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g., Drilling Site A, Workshop B" required />
              </div>

              <div className="space-y-2">
                <Label>Reported By</Label>
                <Input placeholder="Your name" required />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Detailed description of the incident..." 
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Immediate Action Taken</Label>
                <Textarea 
                  placeholder="What actions were taken immediately after the incident?" 
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Report</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Incidents" value="24" color="text-red-600" />
        <StatsCard title="Resolved" value="18" color="text-green-600" />
        <StatsCard title="In Progress" value="4" color="text-blue-600" />
        <StatsCard title="Under Investigation" value="2" color="text-orange-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.id}</TableCell>
                  <TableCell>{incident.date}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
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

const StatsCard = ({ title, value, color }) => (
  <Card>
    <CardContent className="p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
)

export default SafetyIncidents
