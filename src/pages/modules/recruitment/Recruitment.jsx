"use client"

import { useAuth } from "../../../contexts/AuthContext"
import { useRole } from "../../../contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, Briefcase } from "lucide-react"
import { Link } from "react-router-dom"

const Recruitment = () => {
  const { user } = useAuth()
  const { hasRole } = useRole()
  const canViewRequisitions = hasRole(["CEO", "Country Manager", "HR Manager", "Department Manager"])
  const canViewOnboarding = hasRole(["HR Manager", "HR Officer"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruitment Management</h1>
        <p className="text-muted-foreground">Manage recruitment processes, requisitions, and onboarding</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canViewRequisitions && <TabsTrigger value="requisitions">Staff Requisitions</TabsTrigger>}
          {canViewOnboarding && <TabsTrigger value="onboarding">Onboarding</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <RecruitmentOverview />
        </TabsContent>

        {canViewRequisitions && (
          <TabsContent value="requisitions">
            <RequisitionSummary />
          </TabsContent>
        )}

        {canViewOnboarding && (
          <TabsContent value="onboarding">
            <OnboardingSummary />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const RecruitmentOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruitment Overview</CardTitle>
        <CardDescription>Summary of recruitment activities and status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
              <Button variant="link" className="mt-2 p-0" asChild>
                <Link to="/staff-requisition">View Requisitions</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">New hires in progress</p>
              <Button variant="link" className="mt-2 p-0" asChild>
                <Link to="/onboarding">View Onboarding</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Hires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 bg-muted/50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Quick Actions</h3>
          <div className="flex space-x-2">
            <Button asChild>
              <Link to="/staff-requisition">
                <Briefcase className="mr-2 h-4 w-4" />
                Create Requisition
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboarding">
                <Users className="mr-2 h-4 w-4" />
                Manage Onboarding
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const RequisitionSummary = () => {
  const requisitions = [
    {
      id: 1,
      position: "Software Engineer",
      department: "IT",
      status: "Pending",
      requestDate: "2025-04-01",
    },
    {
      id: 2,
      position: "HR Specialist",
      department: "Human Resources",
      status: "Approved",
      requestDate: "2025-03-28",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Requisition Summary</CardTitle>
        <CardDescription>Overview of recent staff requisitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Position</div>
            <div>Department</div>
            <div>Status</div>
            <div>Request Date</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {requisitions.map((req) => (
              <div key={req.id} className="grid grid-cols-5 p-3 text-sm">
                <div className="font-medium">{req.position}</div>
                <div>{req.department}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div>{req.requestDate}</div>
                <div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/staff-requisition">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link to="/staff-requisition">View All Requisitions</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const OnboardingSummary = () => {
  const onboardingTasks = [
    {
      id: 1,
      employee: "Jane Doe",
      position: "Software Engineer",
      startDate: "2025-04-10",
      status: "In Progress",
    },
    {
      id: 2,
      employee: "John Smith",
      position: "HR Specialist",
      startDate: "2025-04-05",
      status: "Pending",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Summary</CardTitle>
        <CardDescription>Overview of current onboarding processes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Position</div>
            <div>Start Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          <div className="divide-y">
            {onboardingTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-5 p-3 text-sm">
                <div className="font-medium">{task.employee}</div>
                <div>{task.position}</div>
                <div>{task.startDate}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      task.status === "In Progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/onboarding">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link to="/onboarding">View All Onboarding</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default Recruitment