import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

const activeEmployees = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Frontend Developer",
    stage: "Document Verification",
    joining: "12 May 2025",
  },
  {
    id: 2,
    name: "Amit Verma",
    role: "Backend Developer",
    stage: "Bank Details Pending",
    joining: "25 May 2025",
  },
]

const ActiveOnboarding = () => {
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

          {/* HEADER */}
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Name</div>
            <div>Role</div>
            <div>Current Stage</div>
            <div>Joining Date</div>
            <div>Action</div>
          </div>

          {/* BODY */}
          <div className="divide-y">
            {activeEmployees.map(emp => (
              <div key={emp.id} className="grid grid-cols-5 p-3 items-center text-sm">
                
<div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center font-semibold text-blue-400">
    {emp.name.charAt(0)}
  </div>

  <div>
    <p className="font-medium">{emp.name}</p>
    <p className="text-xs text-muted-foreground">{emp.role}</p>
  </div>
</div>
                <div>{emp.role}</div>

                <div>
                  <Badge
  className={
    emp.stage.includes("Verification")
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-blue-500/20 text-blue-400"
  }
>
  {emp.stage}
</Badge>

                </div>

                <div>{emp.joining}</div>

                <Button size="icon" variant="ghost">
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
