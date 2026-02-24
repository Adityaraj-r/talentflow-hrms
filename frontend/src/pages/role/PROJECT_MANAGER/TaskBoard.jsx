import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import TaskCard from "@/components/ui/TaskCard"
import CreateTaskModal from "@/components/ui/CreateTaskModal"
import { initialTasks } from "@/data/mockTasks"

const TaskBoard = () => {
  const [tasks, setTasks] = useState(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = [
    { id: "To Do", title: "To Do", color: "bg-gray-100" },
    { id: "In Progress", title: "In Progress", color: "bg-blue-100" },
    { id: "Done", title: "Done", color: "bg-green-100" }
  ]

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination } = result
    if (source.droppableId === destination.droppableId) return

    const updatedTasks = tasks.map(task =>
      task.id === parseInt(result.draggableId)
        ? { ...task, status: destination.droppableId }
        : task
    )
    setTasks(updatedTasks)
  }

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, { ...newTask, id: tasks.length + 1 }])
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-muted-foreground">Manage tasks using Kanban board</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id}>
              <Card className={column.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {column.title}
                    <span className="text-sm font-normal bg-white px-2 py-1 rounded">
                      {tasks.filter(t => t.status === column.id).length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3 min-h-[400px]"
                      >
                        {tasks
                          .filter(task => task.status === column.id)
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  )
}

export default TaskBoard
