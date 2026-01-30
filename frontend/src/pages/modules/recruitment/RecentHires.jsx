import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const hires = [
  {
    id: 1,
    name: "Rahul Sharma",
    position: "Frontend Developer",
    department: "IT",
    joiningDate: "12 Feb 2026",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Patel",
    position: "HR Executive",
    department: "Human Resources",
    joiningDate: "5 Feb 2026",
    status: "Active",
  },
  {
    id: 3,
    name: "Amit Verma",
    position: "Backend Developer",
    department: "Engineering",
    joiningDate: "28 Jan 2026",
    status: "Probation",
  },
]

const RecentHires = () => {
  return (
    <div className="p-6">

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  <Card className="bg-card/60 backdrop-blur-xl border-white/10">
    <CardContent className="p-4">
      <p className="text-muted-foreground text-sm">Total Hires</p>
      <h2 className="text-2xl font-bold">48</h2>
    </CardContent>
  </Card>

  <Card className="bg-card/60 backdrop-blur-xl border-white/10">
    <CardContent className="p-4">
      <p className="text-muted-foreground text-sm">Active Employees</p>
      <h2 className="text-2xl font-bold text-green-400">38</h2>
    </CardContent>
  </Card>

  <Card className="bg-card/60 backdrop-blur-xl border-white/10">
    <CardContent className="p-4">
      <p className="text-muted-foreground text-sm">On Probation</p>
      <h2 className="text-2xl font-bold text-yellow-400">10</h2>
    </CardContent>
  </Card>

</div>


      <Card className="bg-gradient-to-br from-[#0f172a] to-[#020617] border border-slate-800 shadow-xl">
        
        <CardHeader>
          <CardTitle className="text-2xl">Recent Hires</CardTitle>
          <CardDescription>
            Newly joined employees in the organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            
            {/* TABLE HEADER */}
            <div className="grid grid-cols-5 bg-slate-900/40 p-4 text-sm font-semibold">
              <div>Employee</div>
              <div>Position</div>
              <div>Department</div>
              <div>Joining Date</div>
              <div>Status</div>
            </div>

            {/* TABLE BODY */}
            {hires.map((emp) => (
              <div
                key={emp.id}
                className="grid grid-cols-5 p-4 text-sm border-t border-slate-800 hover:bg-slate-900/40 transition"
              >
<div className="flex items-center gap-3">
  
  {/* Avatar */}
  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center font-semibold text-blue-400">
    {emp.name.charAt(0)}
  </div>

  {/* Name + Role */}
  <div>
    <p className="font-medium">{emp.name}</p>
    <p className="text-xs text-muted-foreground">
      {emp.position}
    </p>
  </div>

</div>
                <div>{emp.position}</div>
                <div>{emp.department}</div>
                <div>{emp.joiningDate}</div>

                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.status === "Active"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-yellow-900/40 text-yellow-400"
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

      </Card>
    </div>
  )
}

export default RecentHires
