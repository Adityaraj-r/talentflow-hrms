import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Check, X, Briefcase, BarChart } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const ManagerDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("team");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

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
      
      {/* 1. GREETING HEADER & DATA FRESHNESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Manager Portal
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, <span className="font-bold">{user?.firstName || "Manager"}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back. Here's today's HR Operations Overview.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200 font-medium">Just now</strong></span>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Team Size"
          value={stats.employees || 12}
          subtitle="100% active today"
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          isLoading={isLoading}
          isActive={activeTab === "team"}
          onClick={() => setActiveTab("team")}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals || 3}
          subtitle="2 submitted today"
          icon={<Calendar className="h-5 w-5" />}
          variant="indigo"
          isLoading={isLoading}
          isActive={activeTab === "approvals"}
          onClick={() => setActiveTab("approvals")}
        />
        <StatsCard
          title="Tasks Completed"
          value="52"
          subtitle="+8 this week"
          icon={<Check className="h-5 w-5" />}
          variant="green"
          isLoading={isLoading}
          isActive={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        />
        <StatsCard
          title="Team Performance"
          value="87%"
          subtitle="+3% vs last quarter"
          icon={<BarChart className="h-5 w-5" />}
          variant="orange"
          isLoading={isLoading}
          onClick={() => navigate('/pms/appraisal-cycles')}
        />
      </div>

      {/* 3. TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
          <TabsTrigger 
            value="team" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Team Overview ({stats.employees || 12})
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Pending Approvals ({stats.pendingApprovals || 3})
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Task Management (52)
          </TabsTrigger>
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