import { useState, useEffect } from "react"
import taskService from "@/services/taskService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Search,
  Filter,
  Calendar,
  MoreHorizontal
} from "lucide-react"

const MyTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await taskService.getMyTasks();
        if (res.data) {
          setTasks(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // We derive these stats directly from the 'tasks' array rather than storing them in a separate state.
  // This ensures the numbers (top cards) and the table (bottom list) are always perfectly in sync.
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    pending: tasks.filter(t => t.status === "Pending" || t.status === "In Progress").length,
    overdue: tasks.filter(t => t.status === "Overdue").length
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    // Using en-GB (DD/MM/YYYY) is often preferred in enterprise apps over the US format 
    // to avoid confusion between Jan 2nd and Feb 1st.
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  const getAssignerName = (assignedBy) => {
    if (!assignedBy) return "Unknown";

    // Safety check: The backend 'populate' might fail or return just an ID string.
    // We handle both cases to prevent the app from crashing.
    if (assignedBy.firstName) return `${assignedBy.firstName} ${assignedBy.lastName}`;

    return "Manager";
  }

  // Visual cues (colors) process faster than reading text. 
  // We use "Red" for Overdue to trigger immediate user action.
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
      case "Pending": return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
      case "Overdue": return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "text-red-600 bg-red-50 border-red-100"
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-100"
      case "Low": return "text-blue-600 bg-blue-50 border-blue-100"
      default: return "text-gray-600"
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Manage your assigned work and deadlines.</p>
        </div>
        <div className="flex gap-2">
          {/* Placeholder for future Kanban board toggle */}
          <Button><ListTodo className="mr-2 h-4 w-4" /> View Kanban</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          icon={<ListTodo className="h-4 w-4 text-purple-500" />}
          className="text-purple-600"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          className="text-green-600"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
          className="text-orange-600"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          className="text-red-600"
        />
      </div>

      <Card>
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Assigned Task List</CardTitle>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." className="pl-8 h-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            {/* Empty state handling: Important UX to reassure new employees that nothing is 'broken' */}
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No tasks assigned to you yet.</div>
            ) : (
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Task Info</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Priority</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned By</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Timelines</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {tasks.map((task) => (
                    <tr key={task._id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{task.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{task.description}</span>
                          {/* Displaying the ID is helpful for debugging or referencing specific tickets in chat */}
                          <span className="text-[10px] text-muted-foreground mt-1 bg-muted w-fit px-1.5 py-0.5 rounded">
                            {task._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {getAssignerName(task.assignedBy).charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{getAssignerName(task.assignedBy)}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col text-sm">
                          <span className="text-muted-foreground text-xs">Due:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        {/* Action menu for future features like 'Mark Complete' or 'Add Comment' */}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsCard = ({ title, value, icon, className }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
)

export default MyTasks