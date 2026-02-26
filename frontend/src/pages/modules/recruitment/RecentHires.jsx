import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react";
import axios from "axios";


const RecentHires = () => {
  const [employees, setEmployees] = useState([]);
  const fetchEmployees = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5001/api/employees/recent-hires"
    );

    setEmployees(res.data);

  } catch (error) {
    console.log("Error fetching employees:", error);
  }
};

useEffect(() => {
  fetchEmployees();
}, []);


  const totalHires = employees.length;

  const activeEmployees = employees.filter(
    (emp) => emp.status === "Active"
  ).length;

  const probationEmployees = employees.filter(
    (emp) => emp.status !== "Active"
  ).length;


  return (
    <div className="p-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
             <p className="text-muted-foreground text-sm">Total Hires</p>
             <h2 className="text-2xl font-bold">{totalHires}</h2>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Active Employees</p>
            <h2 className="text-2xl font-bold text-green-400">
              {activeEmployees}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">On Probation</p>
            <h2 className="text-2xl font-bold text-yellow-400">
              {probationEmployees}
            </h2>
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
            <div className="grid grid-cols-5 bg-slate-900/40 p-4 text-sm font-semibold">
              <div>Employee</div>
              <div>Position</div>
              <div>Department</div>
              <div>Joining Date</div>
              <div>Status</div>
            </div>
            {employees.map((emp) => (
          <div
            key={emp._id}
            className="grid grid-cols-5 p-4 text-sm border-t border-slate-800 hover:bg-slate-900/40 transition"> 
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center font-semibold text-blue-400">
                  {emp.firstName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emp.designation}
                  </p>
                </div>
              </div>
            <div>{emp.designation}</div>
            <div>{emp.department}</div>
            <div>
              {new Date(emp.joiningDate).toLocaleDateString()}
            </div>
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
