import { Card } from "./card"
import { Badge } from "./badge"
import { Calendar, User } from "lucide-react"

const TaskCard = ({ task }) => {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case "High": return "bg-red-100 text-red-700 border-red-200"
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Low": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-gray-100"
    }
  }

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm">{task.title}</h4>
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">{task.desc}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{task.assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{task.dueDate}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TaskCard
