import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Calendar,
  DollarSign,
  Briefcase,
  PieChart,
  BarChart,
  LineChart,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Check,
  X,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const ExecutiveDashboard = ({ stats, isLoading }) => {
  const [period, setPeriod] = useState("month");

  const departmentData = [
    { name: "IT", value: 42, color: "bg-blue-500" },
    { name: "HR", value: 18, color: "bg-green-500" },
    { name: "Finance", value: 24, color: "bg-yellow-500" },
    { name: "Operations", value: 36, color: "bg-purple-500" },
    { name: "Sales", value: 30, color: "bg-pink-500" },
    { name: "Admin", value: 6, color: "bg-gray-500" },
  ];

  const recruitmentTrend = [
    { month: "Jan", hired: 5, open: 3 },
    { month: "Feb", hired: 7, open: 4 },
    { month: "Mar", hired: 3, open: 6 },
    { month: "Apr", hired: 8, open: 5 },
    { month: "May", hired: 6, open: 7 },
    { month: "Jun", hired: 9, open: 4 },
  ];

  const turnoverData = [
    { month: "Jan", rate: 3.2 },
    { month: "Feb", rate: 2.8 },
    { month: "Mar", rate: 4.5 },
    { month: "Apr", rate: 3.7 },
    { month: "May", rate: 5.2 },
    { month: "Jun", rate: 4.1 },
  ];

  const kpiData = [
    { name: "Time to Hire", value: 21, target: 25, unit: "days", status: "good" },
    { name: "Cost per Hire", value: 3200, target: 3500, unit: "USD", status: "good" },
    { name: "Turnover Rate", value: 5.2, target: 5.0, unit: "%", status: "warning" },
    { name: "Employee Satisfaction", value: 4.2, target: 4.5, unit: "/5", status: "warning" },
    { name: "Training Completion", value: 92, target: 90, unit: "%", status: "good" },
    { name: "Performance Score", value: 3.8, target: 4.0, unit: "/5", status: "warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.employees}
          description={
            <>
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <ArrowUp className="mr-1 h-3 w-3" />
                4.3%
              </span>{" "}
              from last month
            </>
          }
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Open Positions"
          value={stats.openPositions}
          description={
            <>
              <span className="text-yellow-600 dark:text-yellow-400 flex items-center">
                <ArrowUp className="mr-1 h-3 w-3" />
                2.1%
              </span>{" "}
              from last month
            </>
          }
          icon={<Briefcase className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Budget Utilization"
          value={`${stats.budgetUtilization}%`}
          description={
            <>
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <ArrowDown className="mr-1 h-3 w-3" />
                2.5%
              </span>{" "}
              under budget
            </>
          }
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Turnover Rate"
          value={`${stats.turnoverRate}%`}
          description={
            <>
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <ArrowUp className="mr-1 h-3 w-3" />
                0.8%
              </span>{" "}
              from last quarter
            </>
          }
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Department Headcount</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">{dept.name}</div>
                        <div>{dept.value} employees</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${dept.color}`}
                          style={{ width: `${(dept.value / stats.employees) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recruitment</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>Hired</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span>Open Positions</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {recruitmentTrend.map((month) => (
                      <div key={month.month} className="space-y-1">
                        <div className="text-xs">{month.month}</div>
                        <div className="flex h-4 gap-1">
                          <div
                            className="bg-blue-500 rounded-sm"
                            style={{ width: `${(month.hired / 10) * 100}%` }}
                          ></div>
                          <div
                            className="bg-yellow-500 rounded-sm"
                            style={{ width: `${(month.open / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employee Turnover</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[220px] relative">
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground">
                    <div>6%</div>
                    <div>3%</div>
                    <div>0%</div>
                  </div>
                  <div className="absolute inset-0 ml-6 flex flex-col justify-between">
                    <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                    <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                    <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                  </div>
                  <div className="absolute inset-0 ml-6 pt-4 flex items-end">
                    <div className="flex-1 flex items-end">
                      {turnoverData.map((month, index) => (
                        <div key={month.month} className="flex-1 flex flex-col items-center" style={{ height: "100%" }}>
                          <div
                            className="w-1.5 bg-primary rounded-t"
                            style={{ height: `${(month.rate / 6) * 100}%` }}
                          ></div>
                          <div className="text-xs mt-1">{month.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Approval Summary</CardTitle>
              <CardDescription>Overview of items requiring your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900">
                    <Briefcase className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Staff Requisitions</div>
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-xs text-muted-foreground">Pending your approval</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Leave Requests</div>
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-xs text-muted-foreground">Pending your approval</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900">
                    <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Transfers</div>
                    <div className="text-2xl font-bold">2</div>
                    <div className="text-xs text-muted-foreground">Pending your approval</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Overview of all departments and their key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
                    <div>Department</div>
                    <div>Headcount</div>
                    <div>Budget Util.</div>
                    <div>Turnover</div>
                    <div>Open Positions</div>
                    <div>Avg. Performance</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    {[
                      {
                        name: "IT",
                        headcount: 42,
                        budget: "82%",
                        turnover: "4.2%",
                        openPositions: 3,
                        performance: 4.2,
                        status: "good",
                      },
                      {
                        name: "HR",
                        headcount: 18,
                        budget: "76%",
                        turnover: "3.1%",
                        openPositions: 1,
                        performance: 4.5,
                        status: "good",
                      },
                      {
                        name: "Finance",
                        headcount: 24,
                        budget: "92%",
                        turnover: "2.8%",
                        openPositions: 0,
                        performance: 4.3,
                        status: "good",
                      },
                      {
                        name: "Operations",
                        headcount: 36,
                        budget: "88%",
                        turnover: "7.2%",
                        openPositions: 2,
                        performance: 3.8,
                        status: "warning",
                      },
                      {
                        name: "Sales",
                        headcount: 30,
                        budget: "95%",
                        turnover: "8.5%",
                        openPositions: 1,
                        performance: 3.6,
                        status: "warning",
                      },
                    ].map((dept) => (
                      <div key={dept.name} className="grid grid-cols-7 p-3 text-sm">
                        <div className="font-medium">{dept.name}</div>
                        <div>{dept.headcount}</div>
                        <div>{dept.budget}</div>
                        <div>{dept.turnover}</div>
                        <div>{dept.openPositions}</div>
                        <div>{dept.performance}/5</div>
                        <div>
                          <Badge
                            variant="outline"
                            className={
                              dept.status === "good"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : dept.status === "warning"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }
                          >
                            {dept.status === "good"
                              ? "Good"
                              : dept.status === "warning"
                                ? "Needs Attention"
                                : "Critical"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Department Growth (YTD)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "IT", growth: 12.5, color: "bg-blue-500" },
                        { name: "HR", growth: 5.2, color: "bg-green-500" },
                        { name: "Finance", growth: 3.8, color: "bg-yellow-500" },
                        { name: "Operations", growth: 8.7, color: "bg-purple-500" },
                        { name: "Sales", growth: -2.3, color: "bg-pink-500" },
                      ].map((dept) => (
                        <div key={dept.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{dept.name}</div>
                            <div
                              className={
                                dept.growth > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {dept.growth > 0 ? "+" : ""}
                              {dept.growth}%
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${dept.color}`}
                              style={{ width: `${Math.abs(dept.growth) * 5}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis">
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Track company-wide HR KPIs and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {kpiData.map((kpi) => (
                    <Card key={kpi.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">
                            {kpi.value}
                            <span className="text-sm font-normal text-muted-foreground ml-1">{kpi.unit}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Target: {kpi.target}
                            {kpi.unit}
                          </div>
                        </div>
                        <Progress
                          value={(kpi.value / kpi.target) * 100}
                          className={
                            kpi.status === "good"
                              ? "bg-green-100 dark:bg-green-900"
                              : kpi.status === "warning"
                                ? "bg-yellow-100 dark:bg-yellow-900"
                                : "bg-red-100 dark:bg-red-900"
                          }
                        />
                        <div className="flex items-center justify-between text-xs">
                          <div
                            className={
                              kpi.status === "good"
                                ? "text-green-600 dark:text-green-400"
                                : kpi.status === "warning"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                            }
                          >
                            {kpi.status === "good" ? (
                              <div className="flex items-center">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                On Target
                              </div>
                            ) : kpi.status === "warning" ? (
                              <div className="flex items-center">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Needs Attention
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="mr-1 h-3 w-3" />
                                Off Target
                              </div>
                            )}
                          </div>
                          <div>{((kpi.value / kpi.target) * 100).toFixed(0)}% of target</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">KPI Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Time to Hire",
                          current: 21,
                          previous: 24,
                          target: 25,
                          unit: "days",
                          trend: "improving",
                        },
                        {
                          name: "Cost per Hire",
                          current: 3200,
                          previous: 3350,
                          target: 3500,
                          unit: "USD",
                          trend: "improving",
                        },
                        {
                          name: "Turnover Rate",
                          current: 5.2,
                          previous: 4.8,
                          target: 5.0,
                          unit: "%",
                          trend: "declining",
                        },
                        {
                          name: "Employee Satisfaction",
                          current: 4.2,
                          previous: 4.0,
                          target: 4.5,
                          unit: "/5",
                          trend: "improving",
                        },
                      ].map((kpi) => (
                        <div
                          key={kpi.name}
                          className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                        >
                          <div>
                            <div className="font-medium">{kpi.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Target: {kpi.target}
                              {kpi.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {kpi.current}
                              {kpi.unit}
                              <span
                                className={
                                  kpi.trend === "improving"
                                    ? "text-green-600 dark:text-green-400 ml-2"
                                    : "text-red-600 dark:text-red-400 ml-2"
                                }
                              >
                                {kpi.trend === "improving" ? (
                                  <span className="flex items-center text-xs">
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                    {Math.abs(((kpi.current - kpi.previous) / kpi.previous) * 100).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="flex items-center text-xs">
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                    {Math.abs(((kpi.current - kpi.previous) / kpi.previous) * 100).toFixed(1)}%
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Previous: {kpi.previous}
                              {kpi.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Button variant="outline" className="justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Staff Requisitions (3)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Leave Requests (5)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Transfers (2)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    All Approvals (10)
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
                    <div>Type</div>
                    <div>Requested By</div>
                    <div>Department</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {[
                      {
                        id: 1,
                        type: "Staff Requisition",
                        requestedBy: "John Doe",
                        department: "IT",
                        date: "2025-04-15",
                        status: "Pending",
                        icon: <Briefcase className="h-4 w-4 text-blue-600" />,
                      },
                      {
                        id: 2,
                        type: "Leave Request",
                        requestedBy: "Alice Johnson",
                        department: "HR",
                        date: "2025-04-16",
                        status: "Pending",
                        icon: <Calendar className="h-4 w-4 text-green-600" />,
                      },
                      {
                        id: 3,
                        type: "Department Transfer",
                        requestedBy: "Bob Williams",
                        department: "Finance",
                        date: "2025-04-14",
                        status: "Pending",
                        icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
                      },
                      {
                        id: 4,
                        type: "Staff Requisition",
                        requestedBy: "Sarah Miller",
                        department: "Sales",
                        date: "2025-04-13",
                        status: "Pending",
                        icon: <Briefcase className="h-4 w-4 text-blue-600" />,
                      },
                      {
                        id: 5,
                        type: "Leave Request",
                        requestedBy: "James Wilson",
                        department: "Operations",
                        date: "2025-04-12",
                        status: "Pending",
                        icon: <Calendar className="h-4 w-4 text-green-600" />,
                      },
                    ].map((item) => (
                      <div key={item.id} className="grid grid-cols-6 p-3 text-sm">
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-2">{item.type}</span>
                        </div>
                        <div>{item.requestedBy}</div>
                        <div>{item.department}</div>
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
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;