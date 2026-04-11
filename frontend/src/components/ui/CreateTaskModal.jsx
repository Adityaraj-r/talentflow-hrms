import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Loader2, User } from "lucide-react"
import taskService from "@/services/taskService"

const EMPTY_FORM = {
  title:       "",
  description: "",   
  assignedTo:  "",  
  priority:    "MEDIUM", 
  dueDate:     "",
  
}

const todayISO = new Date().toISOString().split("T")[0]

const CreateTaskModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData]     = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]         = useState({})
  const [users, setUsers]           = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        const res = await taskService.getAssignableUsers()
        const data = res?.data ?? res
        setUsers(Array.isArray(data) ? data : data?.users ?? [])
      } catch (err) {
        console.error("Failed to fetch assignable users:", err)
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM)
      setErrors({})
    }
  }, [isOpen])

  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!formData.title.trim())       e.title      = "Task title is required"
    if (!formData.assignedTo)         e.assignedTo = "Please select an assignee"
    if (!formData.dueDate)            e.dueDate    = "Due date is required"
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      await onCreate({
        title:       formData.title.trim(),
        description: formData.description.trim(),
        assignedTo:  formData.assignedTo,   
        priority:    formData.priority,     
        dueDate:     formData.dueDate,
      })
      setFormData(EMPTY_FORM)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Task Title <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Enter task title"
              value={formData.title}
              onChange={e => set("title", e.target.value)}
              className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Task description (optional)"
              value={formData.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Assignee <span className="text-destructive">*</span></Label>
              {usersLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading users...
                </div>
              ) : (
                <Select
                  value={formData.assignedTo}
                  onValueChange={val => set("assignedTo", val)}
                >
                  <SelectTrigger
                    className={errors.assignedTo ? "border-destructive focus:ring-destructive" : ""}
                  >
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {users.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                        No assignable users found
                      </div>
                    ) : (
                      users.map(u => (
                        <SelectItem key={u._id} value={u._id}>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {u.firstName?.charAt(0).toUpperCase() ?? <User className="h-3 w-3" />}
                            </div>
                            <span className="truncate">
                              {u.firstName} {u.lastName}
                              <span className="text-muted-foreground ml-1 text-xs">
                                · {u.role?.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.assignedTo && (
                <p className="text-xs text-destructive">{errors.assignedTo}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={val => set("priority", val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="text-blue-600 font-medium">Low</span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="text-yellow-600 font-medium">Medium</span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="text-red-600 font-medium">High</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Due Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              min={todayISO}
              value={formData.dueDate}
              onChange={e => set("dueDate", e.target.value)}
              className={errors.dueDate ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                : "Create Task"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTaskModal