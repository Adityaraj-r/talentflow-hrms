import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const ManageOnboarding = () => {

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchManageOnboarding = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5001/api/employees/manage-onboarding"
        )
        setEmployees(res.data)
      } catch (error) {
        console.error("Error fetching manage onboarding:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchManageOnboarding()
  }, [])

  if (loading) {
    return <p className="p-6">Loading onboarding data...</p>
  }

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

        <input
          placeholder="Search employee..."
          className="px-4 py-2 w-64 rounded-lg bg-transparent border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      <CardContent>
        <div className="rounded-md border overflow-hidden">

          <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
            <div>Name</div>
            <div>Role</div>
            <div>Department</div>
            <div>Joining Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          <div className="divide-y">

            {employees.map((emp) => (
              <div
                key={emp._id}
                className="grid grid-cols-6 p-3 text-sm items-center"
              >
                <div className="font-medium">
                  {emp.firstName} {emp.lastName}
                </div>

                <div>{emp.designation}</div>

                <div>{emp.department}</div>

                <div>
                  {emp.joiningDate
                    ? new Date(emp.joiningDate).toLocaleDateString()
                    : "-"}
                </div>

                <div>
                  <Badge
                    className={
                      emp.onboardingStatus === "Completed"
                      ? "bg-green-500/20 text-green-400"
                      : emp.onboardingStatus === "Documents"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                    }
                  >
                    {emp.onboardingStatus}
                  </Badge>                  
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      navigate(`/dashboard/active-onboarding/${emp._id}`)
                    }
                  >
                    <Eye className="h-4 w-4 cursor-pointer" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/dashboard/manage-onboarding/edit/${emp._id}`)}
                  >
                   <Pencil className="h-4 w-4 cursor-pointer" />
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
