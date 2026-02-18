import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const ActiveOnboarding = () => {

const [employees, setEmployees] = useState([]);
const [loading, setLoading] = useState(true);
const navigate = useNavigate();

const fetchActiveOnboarding = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5001/api/employees/active-onboarding"
    );
    setEmployees(res.data);
  } catch (error) {
    console.error("Error fetching active onboarding:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchActiveOnboarding();
}, []);

if (loading) {
  return (
    <p className="p-6 text-muted-foreground">
      Loading active onboarding...
    </p>
  );
}

  return (
    <Card className="bg-card/60 backdrop-blur-xl border border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle>Active Onboarding</CardTitle>
        <CardDescription>
          Employees currently in onboarding process
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Name</div>
            <div>Role</div>
            <div>Current Stage</div>
            <div>Joining Date</div>
            <div>Action</div>
          </div>

            {employees.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No active onboarding employees found
              </div>
            )}

          <div className="divide-y">
            {employees.map(emp => (
              <div key={emp._id} className="grid grid-cols-5 p-3 items-center text-sm">             
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center font-semibold text-blue-400">
                    {emp?.firstName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium">
                     {emp?.firstName || "Unknown"} {emp?.lastName || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                     {emp.designation}
                    </p>
                  </div>
                </div>
                <div>{emp.designation}</div>
                <div>
                  <Badge
                    className={
                     emp.onboardingStatus === "Documents"
                     ? "bg-yellow-500/20 text-yellow-400"
                     : "bg-blue-500/20 text-blue-400"
                    }
                  >
                   {emp.onboardingStatus}
                  </Badge>
                </div>
                <div>
                 {emp.joiningDate
                 ? new Date(emp.joiningDate).toLocaleDateString()
                 : "-"}
                </div>
                <Button size="icon" variant="ghost" className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/onboarding/${emp._id}`)}>
                 <Eye className="h-4 w-4"/>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ActiveOnboarding
