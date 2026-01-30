import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil } from "lucide-react"

const employees = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Frontend Developer",
    department: "IT",
    joining: "12 May 2025",
    status: "Pending",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "HR Executive",
    department: "Human Resources",
    joining: "18 May 2025",
    status: "Completed",
  },
  {
    id: 3,
    name: "Amit Verma",
    role: "Backend Developer",
    department: "IT",
    joining: "25 May 2025",
    status: "In Progress",
  },
]

const ManageOnboarding = () => {
  return (
    <Card>
<div className="flex items-center justify-between mb-8">

  <div>
    <h1 className="text-3xl font-bold tracking-tight">
      Manage Onboarding
    </h1>

    <p className="text-gray-400 mt-1">
      Track and manage employee onboarding process
    </p>
  </div>

  <div className="flex gap-3">

    {/* SEARCH */}
    <input
      placeholder="Search employee..."
      className="px-4 py-2 w-64 rounded-lg bg-transparent border border-gray-700 focus:outline-none focus:border-blue-500"
    />

    
  </div>
</div>


      <CardContent>
        <div className="rounded-md border overflow-hidden">
          
          {/* TABLE HEADER */}
          <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
            <div>Name</div>
            <div>Role</div>
            <div>Department</div>
            <div>Joining Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* TABLE BODY */}
          <div className="divide-y">
            {employees.map((emp) => (
              <div key={emp.id} className="grid grid-cols-6 p-3 text-sm items-center">
                
                <div className="font-medium">{emp.name}</div>
                <div>{emp.role}</div>
                <div>{emp.department}</div>
                <div>{emp.joining}</div>

                <div>
                  <Badge
                    variant={
                      emp.status === "Completed"
                        ? "default"
                        : emp.status === "In Progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {emp.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button size="icon" variant="ghost">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

export default ManageOnboarding
