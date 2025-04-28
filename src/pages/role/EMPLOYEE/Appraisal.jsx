"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const Appraisal = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal (Employee)</h1>
        <p className="text-muted-foreground">View your performance appraisal history</p>
      </div>
      <AppraisalHistory />
    </div>
  )
}

const AppraisalHistory = () => {
  const appraisalHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      appraisalPeriod: "2025-02",
      performanceRating: "Good",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-03-01",
    },
    {
      id: 2,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      appraisalPeriod: "2025-01",
      performanceRating: "Satisfactory",
      status: "Approved",
      approvedBy: "Bob Williams",
      approvalDate: "2025-02-15",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>View your performance appraisal history</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search appraisals..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Period</div>
            <div>Rating</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {appraisalHistory.map((appraisal) => (
              <div key={appraisal.id} className="grid grid-cols-6 p-3 text-sm">
                <div className="font-medium">{appraisal.employeeName}</div>
                <div>{appraisal.employeeId}</div>
                <div>{appraisal.appraisalPeriod}</div>
                <div>{appraisal.performanceRating}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      appraisal.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : appraisal.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {appraisal.status}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="icon">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">View details</span>
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

export default Appraisal
