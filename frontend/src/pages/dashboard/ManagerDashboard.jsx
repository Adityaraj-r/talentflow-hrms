import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Check, X, Briefcase, BarChart } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const ManagerDashboard = ({ stats, isLoading }) => {
  const teamPerformance = [
    { name: "John Smith", performance: 85, tasksCompleted: 12, tasksPending: 3 },
    { name: "Emily Davis", performance: 92, tasksCompleted: 15, tasksPending: 1 },
    { name: "Michael Chen", performance: 78, tasksCompleted: 10, tasksPending: 5 },
    { name: "Sarah Johnson", performance: 88, tasksCompleted: 13, tasksPending: 2 },
  ];

  const pendingApprovals = [
    {
      id: 1,
      type: "Leave Request",
      requestedBy: "John Smith",
      date: "2025-04-20",
      status: "Pending",
      icon: <Calendar className="h-4 w-4 text-green-600" />,
    },
    {
      id: 2,
      type: "Overtime Request",
      requestedBy: "Emily Davis",
      date: "2025-04-19",
      status: "Pending",
      icon: <Briefcase className="h-4 w-4 text-blue-600" />,
    },
    {
      id: 3,
      type: "Expense Claim",
      requestedBy: "Michael Chen",
      date: "2025-04-18",
      status: "Pending",
      icon: <Briefcase className="h-4 w-4 text-yellow-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Team Size"
          value={stats.employees}
          description="Team members"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          description="Requiring action"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Tasks Completed"
          value="52"
          description="This month"
          icon={<Check className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Team Performance"
          value="87%"
          description="Average score"
          icon={<BarChart className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team Overview</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Overview of your team's performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                    <div>Employee</div>
                    <div>Performance</div>
                    <div>Tasks Completed</div>
                    <div>Tasks Pending</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    {teamPerformance.map((member) => (
                      <div key={member.name} className="grid grid-cols-5 p-3 text-sm">
                        <div className="font-medium">{member.name}</div>
                        <div>
                          <div className="flex items-center">
                            {member.performance}%
                            <Progress
                              value={member.performance}
                              className="ml-2 w-16 h-2"
                            />
                          </div>
                        </div>
                        <div>{member.tasksCompleted}</div>
                        <div>{member.tasksPending}</div>
                        <div>
                          <Badge
                            variant="outline"
                            className={
                              member.performance >= 85
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            }
                          >
                            {member.performance >= 85 ? "Excellent" : "Good"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Performance</div>
                    <div className="mt-1 text-2xl font-bold">87%</div>
                    <div className="mt-1 text-xs text-muted-foreground">Team average</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Tasks Completed</div>
                    <div className="mt-1 text-2xl font-bold">52</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Tasks Pending</div>
                    <div className="mt-1 text-2xl font-bold">11</div>
                    <div className="mt-1 text-xs text-muted-foreground">Across team</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and manage team requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Leave Requests (2)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Overtime (1)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Expense Claims (1)
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                    <div>Type</div>
                    <div>Requested By</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {pendingApprovals.map((item) => (
                      <div key={item.id} className="grid grid-cols-5 p-3 text-sm">
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-2">{item.type}</span>
                        </div>
                        <div>{item.requestedBy}</div>
                        <div>{item.date}</div>
                        <div>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8 text-green-600">
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-red-600">
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Assign and track team tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Tasks</div>
                    <div className="mt-1 text-2xl font-bold">63</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Completed Tasks</div>
                    <div className="mt-1 text-2xl font-bold">52</div>
                    <div className="mt-1 text-xs text-muted-foreground">83% completion rate</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Overdue Tasks</div>
                    <div className="mt-1 text-2xl font-bold">4</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring attention</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Active Tasks</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Task</div>
                      <div>Assigned To</div>
                      <div>Due Date</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "Project Plan Review",
                          assignedTo: "John Smith",
                          dueDate: "2025-04-25",
                          status: "In Progress",
                        },
                        {
                          id: 2,
                          name: "Client Presentation",
                          assignedTo: "Emily Davis",
                          dueDate: "2025-04-22",
                          status: "Pending",
                        },
                        {
                          id: 3,
                          name: "Budget Analysis",
                          assignedTo: "Michael Chen",
                          dueDate: "2025-04-20",
                          status: "Overdue",
                        },
                      ].map((task) => (
                        <div key={task.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{task.name}</div>
                          <div>{task.assignedTo}</div>
                          <div>{task.dueDate}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                task.status === "In Progress"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : task.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;