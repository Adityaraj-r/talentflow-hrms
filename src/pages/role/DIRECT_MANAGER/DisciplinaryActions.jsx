"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const DisciplinaryActions = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disciplinary Actions (Direct Manager)</h1>
        <p className="text-muted-foreground">View disciplinary action records for your direct reports</p>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Action History</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <ActionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const ActionHistory = () => {
  const actionHistory = [
    {
      id: 1,
      employeeName: "John Doe",
      employeeId: "EMP001",
      department: "IT",
      actionType: "Written Warning",
      incidentDate: "2025-02-01",
      status: "Approved",
      approvedBy: "Jane Smith",
      approvalDate: "2025-02-25",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Disciplinary Action History</CardTitle>
          <CardDescription>View history of disciplinary actions for your direct reports</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search actions..." className="pl-8 w-[200px] md:w-[300px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Department</div>
            <div>Action Type</div>
            <div>Incident Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {actionHistory.map((action) => (
              <div key={action.id} className="grid grid-cols-7 p-3 text-sm">
                <div className="font-medium">{action.employeeName}</div>
                <div>{action.employeeId}</div>
                <div>{action.department}</div>
                <div>{action.actionType}</div>
                <div>{action.incidentDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      action.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : action.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {action.status}
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

export default DisciplinaryActions