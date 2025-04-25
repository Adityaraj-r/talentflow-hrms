"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Calendar,
  DollarSign,
  Award,
  FileCheck,
  BarChart,
  PieChart,
  LineChart,
  Calculator,
  Plane,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Building,
  UserPlus,
  FileText,
  Activity,
  RefreshCw,
  Check,
  X,
} from "lucide-react"

// Update the Dashboard component to better integrate with the role-based system

// In the Dashboard component, update the renderRoleDashboard function to use the RoleContext
import { useRole } from "../../contexts/RoleContext"

const Dashboard = () => {
  const { user } = useAuth()
  const { getRoleCategory } = useRole()
  const [stats, setStats] = useState({
    employees: 0,
    leaveRequests: 0,
    pendingApprovals: 0,
    documentsRequested: 0,
    openPositions: 0,
    budgetUtilization: 0,
    turnoverRate: 0,
    timeToHire: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching dashboard data
    const fetchDashboardData = () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        setStats({
          employees: 156,
          leaveRequests: 12,
          pendingApprovals: 8,
          documentsRequested: 5,
          openPositions: 7,
          budgetUtilization: 78,
          turnoverRate: 5.2,
          timeToHire: 21,
        })
        setIsLoading(false)
      }, 1000)
    }

    fetchDashboardData()
  }, [])

  // Render different dashboard based on user role category
  const renderRoleDashboard = () => {
    const roleCategory = getRoleCategory()

    switch (roleCategory) {
      case "executive":
        return <ExecutiveDashboard stats={stats} isLoading={isLoading} />
      case "hr":
        return <HRDashboard stats={stats} isLoading={isLoading} />
      case "manager":
        return <ManagerDashboard stats={stats} isLoading={isLoading} />
      case "payroll":
        return <PayrollDashboard stats={stats} isLoading={isLoading} />
      default:
        return <EmployeeDashboard stats={stats} isLoading={isLoading} />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's what's happening today.</p>
      </div>

      {renderRoleDashboard()}
    </div>
  )
}

const ExecutiveDashboard = ({ stats, isLoading }) => {
  const [period, setPeriod] = useState("month")

  // Sample data for charts
  const departmentData = [
    { name: "IT", value: 42, color: "bg-blue-500" },
    { name: "HR", value: 18, color: "bg-green-500" },
    { name: "Finance", value: 24, color: "bg-yellow-500" },
    { name: "Operations", value: 36, color: "bg-purple-500" },
    { name: "Sales", value: 30, color: "bg-pink-500" },
    { name: "Admin", value: 6, color: "bg-gray-500" },
  ]

  const recruitmentTrend = [
    { month: "Jan", hired: 5, open: 3 },
    { month: "Feb", hired: 7, open: 4 },
    { month: "Mar", hired: 3, open: 6 },
    { month: "Apr", hired: 8, open: 5 },
    { month: "May", hired: 6, open: 7 },
    { month: "Jun", hired: 9, open: 4 },
  ]

  const turnoverData = [
    { month: "Jan", rate: 3.2 },
    { month: "Feb", rate: 2.8 },
    { month: "Mar", rate: 4.5 },
    { month: "Apr", rate: 3.7 },
    { month: "May", rate: 5.2 },
    { month: "Jun", rate: 4.1 },
  ]

  const kpiData = [
    { name: "Time to Hire", value: 21, target: 25, unit: "days", status: "good" },
    { name: "Cost per Hire", value: 3200, target: 3500, unit: "USD", status: "good" },
    { name: "Turnover Rate", value: 5.2, target: 5.0, unit: "%", status: "warning" },
    { name: "Employee Satisfaction", value: 4.2, target: 4.5, unit: "/5", status: "warning" },
    { name: "Training Completion", value: 92, target: 90, unit: "%", status: "good" },
    { name: "Performance Score", value: 3.8, target: 4.0, unit: "/5", status: "warning" },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats */}
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
          icon={<Activity className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Period Selector */}
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

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Department Headcount Chart */}
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

            {/* Monthly Recruitment Chart */}
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

            {/* Employee Turnover Chart */}
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

          {/* Approval Summary */}
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

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Overview of all departments and their key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Department Performance Table */}
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

                {/* Department Growth Chart */}
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

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Track company-wide HR KPIs and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* KPI Cards */}
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

                {/* Trend Analysis */}
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

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Approval Categories */}
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

                {/* Approval Items */}
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
  )
}

const HRDashboard = ({ stats, isLoading }) => {
  // Sample data for recruitment pipeline
  const recruitmentStages = [
    { name: "Applications", count: 42, color: "bg-blue-500" },
    { name: "Screening", count: 28, color: "bg-indigo-500" },
    { name: "Interviews", count: 15, color: "bg-purple-500" },
    { name: "Offers", count: 8, color: "bg-pink-500" },
    { name: "Hired", count: 5, color: "bg-green-500" },
  ]

  // Sample data for leave management
  const leaveTypes = [
    { type: "Annual", approved: 45, pending: 12, rejected: 3 },
    { type: "Sick", approved: 32, pending: 5, rejected: 1 },
    { type: "Compassionate", approved: 8, pending: 2, rejected: 0 },
    { type: "Maternity", approved: 3, pending: 1, rejected: 0 },
    { type: "Haj", approved: 2, pending: 0, rejected: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.employees}
          description="Active employees"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Leave Requests"
          value={stats.leaveRequests}
          description="Pending approval"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Document Requests"
          value={stats.documentsRequested}
          description="Pending processing"
          icon={<FileCheck className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Recruitment"
          value={stats.openPositions}
          description="Active positions"
          icon={<UserPlus className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="recruitment">
        <TabsList>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="employees">Employee Overview</TabsTrigger>
        </TabsList>

        {/* Recruitment Tab */}
        <TabsContent value="recruitment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment Pipeline</CardTitle>
              <CardDescription>Track candidates through the recruitment process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Recruitment Funnel */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>Applications</div>
                    <div>Hired</div>
                  </div>
                  <div className="flex h-8 items-center">
                    {recruitmentStages.map((stage, index) => (
                      <div
                        key={stage.name}
                        className={`h-full ${stage.color} ${index === 0 ? "rounded-l-md" : ""} ${
                          index === recruitmentStages.length - 1 ? "rounded-r-md" : ""
                        }`}
                        style={{ width: `${(stage.count / recruitmentStages[0].count) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {recruitmentStages.map((stage) => (
                      <div key={stage.name}>
                        <div className="font-medium">{stage.count}</div>
                        <div className="text-muted-foreground">{stage.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recruitment Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Time to Hire</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">{stats.timeToHire}</div>
                      <div className="ml-1 text-sm text-muted-foreground">days</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">4 days faster than last quarter</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Open Positions</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">{stats.openPositions}</div>
                      <div className="ml-1 text-sm text-muted-foreground">positions</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Across 4 departments</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Offer Acceptance Rate</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">85%</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">5% higher than industry average</div>
                  </div>
                </div>

                {/* Recent Applications */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Applications</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Candidate</div>
                      <div>Position</div>
                      <div>Applied On</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Smith",
                          position: "Software Engineer",
                          date: "2025-04-15",
                          status: "Screening",
                        },
                        {
                          id: 2,
                          name: "Emily Johnson",
                          position: "HR Specialist",
                          date: "2025-04-14",
                          status: "Interview",
                        },
                        {
                          id: 3,
                          name: "Michael Brown",
                          position: "Accountant",
                          date: "2025-04-13",
                          status: "Applied",
                        },
                        {
                          id: 4,
                          name: "Sarah Davis",
                          position: "Project Manager",
                          date: "2025-04-12",
                          status: "Offer",
                        },
                      ].map((candidate) => (
                        <div key={candidate.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{candidate.name}</div>
                          <div>{candidate.position}</div>
                          <div>{candidate.date}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                candidate.status === "Applied"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : candidate.status === "Screening"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                    : candidate.status === "Interview"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              }
                            >
                              {candidate.status}
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

        {/* Leave Management Tab */}
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Overview of employee leave requests and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Leave Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Leave Requests</div>
                    <div className="mt-1 text-2xl font-bold">87</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Approvals</div>
                    <div className="mt-1 text-2xl font-bold">{stats.leaveRequests}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring action</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Approved Leaves</div>
                    <div className="mt-1 text-2xl font-bold">68</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Rejected Leaves</div>
                    <div className="mt-1 text-2xl font-bold">7</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                </div>

                {/* Leave Types Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Leave by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leaveTypes.map((leave) => (
                        <div key={leave.type} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{leave.type} Leave</div>
                            <div className="text-xs text-muted-foreground">
                              Total: {leave.approved + leave.pending + leave.rejected}
                            </div>
                          </div>
                          <div className="flex h-2 w-full rounded-full overflow-hidden">
                            <div
                              className="bg-green-500"
                              style={{
                                width: `${(leave.approved / (leave.approved + leave.pending + leave.rejected)) * 100}%`,
                              }}
                            ></div>
                            <div
                              className="bg-yellow-500"
                              style={{
                                width: `${(leave.pending / (leave.approved + leave.pending + leave.rejected)) * 100}%`,
                              }}
                            ></div>
                            <div
                              className="bg-red-500"
                              style={{
                                width: `${(leave.rejected / (leave.approved + leave.pending + leave.rejected)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                              <span>Approved: {leave.approved}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                              <span>Pending: {leave.pending}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                              <span>Rejected: {leave.rejected}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Leave Requests */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Leave Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Leave Type</div>
                      <div>Period</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          type: "Annual Leave",
                          startDate: "2025-04-20",
                          endDate: "2025-04-30",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          type: "Sick Leave",
                          startDate: "2025-04-18",
                          endDate: "2025-04-20",
                          status: "Pending",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          type: "Compassionate Leave",
                          startDate: "2025-04-25",
                          endDate: "2025-04-28",
                          status: "Pending",
                        },
                      ].map((leave) => (
                        <div key={leave.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{leave.name}</div>
                          <div>{leave.department}</div>
                          <div>{leave.type}</div>
                          <div>
                            {leave.startDate} to {leave.endDate}
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            >
                              {leave.status}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>Track and manage employee document requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Document Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Requests</div>
                    <div className="mt-1 text-2xl font-bold">{stats.documentsRequested}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring action</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Processed Today</div>
                    <div className="mt-1 text-2xl font-bold">12</div>
                    <div className="mt-1 text-xs text-muted-foreground">Documents completed</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Processing Time</div>
                    <div className="mt-1 text-2xl font-bold">1.2</div>
                    <div className="mt-1 text-xs text-muted-foreground">Days per document</div>
                  </div>
                </div>

                {/* Document Types */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Document Requests by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: "Salary Certificate", count: 12, color: "bg-blue-500" },
                        { type: "Experience Certificate", count: 8, color: "bg-green-500" },
                        { type: "Employment Certificate", count: 15, color: "bg-yellow-500" },
                        { type: "Work Permit", count: 5, color: "bg-purple-500" },
                        { type: "Other Documents", count: 7, color: "bg-pink-500" },
                      ].map((doc) => (
                        <div key={doc.type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{doc.type}</div>
                            <div>{doc.count} requests</div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${doc.color}`}
                              style={{ width: `${(doc.count / 47) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Document Requests */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Document Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Document Type</div>
                      <div>Requested On</div>
                      <div>Urgency</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          type: "Salary Certificate",
                          date: "2025-04-15",
                          urgency: "High",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          type: "Experience Certificate",
                          date: "2025-04-14",
                          urgency: "Normal",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          type: "Work Permit",
                          date: "2025-04-13",
                          urgency: "High",
                        },
                      ].map((doc) => (
                        <div key={doc.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{doc.name}</div>
                          <div>{doc.department}</div>
                          <div>{doc.type}</div>
                          <div>{doc.date}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                doc.urgency === "High"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              }
                            >
                              {doc.urgency}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">
                              Process
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

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Overview</CardTitle>
              <CardDescription>Comprehensive view of employee data and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Employee Demographics */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Department Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "IT", value: 42, color: "bg-blue-500" },
                          { name: "HR", value: 18, color: "bg-green-500" },
                          { name: "Finance", value: 24, color: "bg-yellow-500" },
                          { name: "Operations", value: 36, color: "bg-purple-500" },
                          { name: "Sales", value: 30, color: "bg-pink-500" },
                          { name: "Admin", value: 6, color: "bg-gray-500" },
                        ].map((dept) => (
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Employee Tenure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { range: "< 1 year", value: 32, color: "bg-blue-500" },
                          { range: "1-3 years", value: 48, color: "bg-green-500" },
                          { range: "3-5 years", value: 35, color: "bg-yellow-500" },
                          { range: "5-10 years", value: 28, color: "bg-purple-500" },
                          { range: "> 10 years", value: 13, color: "bg-pink-500" },
                        ].map((tenure) => (
                          <div key={tenure.range} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">{tenure.range}</div>
                              <div>{tenure.value} employees</div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full ${tenure.color}`}
                                style={{ width: `${(tenure.value / stats.employees) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Employee Actions */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Add New Employee</div>
                      <div className="text-xs">Start onboarding process</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Generate Reports</div>
                      <div className="text-xs">Employee data reports</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <Building className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Department Management</div>
                      <div className="text-xs">Manage departments</div>
                    </div>
                  </Button>
                </div>

                {/* Recent Employee Updates */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Employee Updates</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Update Type</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          type: "Profile Update",
                          date: "2025-04-15",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          type: "Department Transfer",
                          date: "2025-04-14",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          type: "Contract Renewal",
                          date: "2025-04-13",
                        },
                        {
                          id: 4,
                          name: "Sarah Miller",
                          department: "Sales",
                          type: "New Hire",
                          date: "2025-04-12",
                        },
                        {
                          id: 5,
                          name: "James Wilson",
                          department: "Operations",
                          type: "Promotion",
                          date: "2025-04-11",
                        },
                      ].map((update) => (
                        <div key={update.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{update.name}</div>
                          <div>{update.department}</div>
                          <div>{update.type}</div>
                          <div>{update.date}</div>
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
  )
}

const ManagerDashboard = ({ stats, isLoading }) => {
  // Sample team data
  const teamMembers = [
    { id: 1, name: "John Doe", position: "Senior Developer", performance: 4.5, leaveBalance: 18 },
    { id: 2, name: "Alice Johnson", position: "UI/UX Designer", performance: 4.2, leaveBalance: 12 },
    { id: 3, name: "Bob Williams", position: "QA Engineer", performance: 3.8, leaveBalance: 15 },
    { id: 4, name: "Sarah Miller", position: "Frontend Developer", performance: 4.0, leaveBalance: 20 },
    { id: 5, name: "James Wilson", position: "Backend Developer", performance: 4.3, leaveBalance: 8 },
  ]

  // Sample appraisal data
  const appraisalData = [
    { id: 1, name: "John Doe", dueDate: "2025-05-15", status: "Upcoming", lastScore: 4.5 },
    { id: 2, name: "Alice Johnson", dueDate: "2025-05-20", status: "Upcoming", lastScore: 4.2 },
    { id: 3, name: "Bob Williams", dueDate: "2025-04-30", status: "Overdue", lastScore: 3.8 },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Team Members"
          value="12"
          description="In your department"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Leave Requests"
          value={stats.leaveRequests}
          description="Pending your approval"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Appraisals"
          value="3"
          description="Due this month"
          icon={<Award className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Open Positions"
          value="2"
          description="In your department"
          icon={<Briefcase className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team Overview</TabsTrigger>
          <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        {/* Team Overview Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Overview of your team's performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Team Performance Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Performance</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">4.2</div>
                      <div className="ml-1 text-sm text-muted-foreground">/5</div>
                    </div>
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <ArrowUp className="mr-1 h-3 w-3" />
                      0.3 from last quarter
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Team Utilization</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">87%</div>
                    </div>
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <ArrowUp className="mr-1 h-3 w-3" />
                      5% from last month
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Project Completion</div>
                    <div className="mt-1 flex items-baseline">
                      <div className="text-2xl font-bold">92%</div>
                    </div>
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <ArrowUp className="mr-1 h-3 w-3" />
                      3% from target
                    </div>
                  </div>
                </div>

                {/* Team Members Table */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Team Members</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Name</div>
                      <div>Position</div>
                      <div>Performance</div>
                      <div>Leave Balance</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{member.name}</div>
                          <div>{member.position}</div>
                          <div>
                            <div className="flex items-center">
                              <div className="mr-2">{member.performance}/5</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full ${
                                      i < Math.floor(member.performance)
                                        ? "bg-green-500"
                                        : i < member.performance
                                          ? "bg-green-500/50"
                                          : "bg-muted"
                                    } mr-0.5`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>{member.leaveBalance} days</div>
                          <div>
                            <Button variant="ghost" size="sm">
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Skills Matrix */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Team Skills Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { skill: "Technical Skills", level: 85, color: "bg-blue-500" },
                        { skill: "Communication", level: 78, color: "bg-green-500" },
                        { skill: "Problem Solving", level: 82, color: "bg-yellow-500" },
                        { skill: "Teamwork", level: 90, color: "bg-purple-500" },
                        { skill: "Leadership", level: 72, color: "bg-pink-500" },
                      ].map((skill) => (
                        <div key={skill.skill} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{skill.skill}</div>
                            <div>{skill.level}%</div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${skill.color}`}
                              style={{ width: `${skill.level}%` }}
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

        {/* Appraisals Tab */}
        <TabsContent value="appraisals">
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Status</CardTitle>
              <CardDescription>Track employee appraisals and performance reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Appraisal Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Upcoming Appraisals</div>
                    <div className="mt-1 text-2xl font-bold">3</div>
                    <div className="mt-1 text-xs text-muted-foreground">Due this month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Completed Appraisals</div>
                    <div className="mt-1 text-2xl font-bold">8</div>
                    <div className="mt-1 text-xs text-muted-foreground">This quarter</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Overdue Appraisals</div>
                    <div className="mt-1 text-2xl font-bold">1</div>
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">Requires immediate attention</div>
                  </div>
                </div>

                {/* Upcoming Appraisals */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Upcoming Appraisals</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Position</div>
                      <div>Due Date</div>
                      <div>Last Score</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {appraisalData.map((appraisal) => (
                        <div key={appraisal.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{appraisal.name}</div>
                          <div>{teamMembers.find((member) => member.name === appraisal.name)?.position || "N/A"}</div>
                          <div>{appraisal.dueDate}</div>
                          <div>{appraisal.lastScore}/5</div>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              className={appraisal.status === "Overdue" ? "text-red-600 border-red-600" : ""}
                            >
                              {appraisal.status === "Overdue" ? "Overdue" : "Schedule"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Trends */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamMembers.slice(0, 3).map((member) => (
                        <div key={member.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">Last 4 quarters</div>
                          </div>
                          <div className="flex h-8 items-center gap-1">
                            {[
                              Math.max(2.5, member.performance - 0.7),
                              Math.max(2.5, member.performance - 0.3),
                              member.performance - 0.1,
                              member.performance,
                            ].map((score, index) => (
                              <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-primary/80 rounded-sm"
                                  style={{ height: `${(score / 5) * 100}%` }}
                                ></div>
                                <div className="text-xs mt-1">Q{index + 1}</div>
                              </div>
                            ))}
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

        {/* Requisitions Tab */}
        <TabsContent value="requisitions">
          <Card>
            <CardHeader>
              <CardTitle>Staff Requisitions</CardTitle>
              <CardDescription>Manage your department's staff requisitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Requisition Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Open Positions</div>
                    <div className="mt-1 text-2xl font-bold">2</div>
                    <div className="mt-1 text-xs text-muted-foreground">In your department</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">In Progress</div>
                    <div className="mt-1 text-2xl font-bold">3</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requisitions in process</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Filled Positions</div>
                    <div className="mt-1 text-2xl font-bold">5</div>
                    <div className="mt-1 text-xs text-muted-foreground">This year</div>
                  </div>
                </div>

                {/* Active Requisitions */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Active Requisitions</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Position</div>
                      <div>Job Type</div>
                      <div>Date Requested</div>
                      <div>Status</div>
                      <div>Candidates</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          position: "Senior Developer",
                          jobType: "Full Time",
                          dateRequested: "2025-03-15",
                          status: "Interviewing",
                          candidates: 5,
                        },
                        {
                          id: 2,
                          position: "UI/UX Designer",
                          jobType: "Full Time",
                          dateRequested: "2025-03-20",
                          status: "Screening",
                          candidates: 8,
                        },
                        {
                          id: 3,
                          position: "QA Engineer",
                          jobType: "Contract",
                          dateRequested: "2025-04-01",
                          status: "Pending Approval",
                          candidates: 0,
                        },
                      ].map((req) => (
                        <div key={req.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{req.position}</div>
                          <div>{req.jobType}</div>
                          <div>{req.dateRequested}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                req.status === "Interviewing"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : req.status === "Screening"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              }
                            >
                              {req.status}
                            </Badge>
                          </div>
                          <div>{req.candidates} candidates</div>
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

                {/* Create Requisition */}
                <div className="flex justify-end">
                  <Button>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Create New Requisition
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Leave Requests */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Leave Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Leave Type</div>
                      <div>From</div>
                      <div>To</div>
                      <div>Days</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          type: "Annual Leave",
                          from: "2025-04-20",
                          to: "2025-04-30",
                          days: 10,
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          type: "Sick Leave",
                          from: "2025-04-18",
                          to: "2025-04-20",
                          days: 3,
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          type: "Compassionate Leave",
                          from: "2025-04-25",
                          to: "2025-04-28",
                          days: 3,
                        },
                      ].map((leave) => (
                        <div key={leave.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{leave.name}</div>
                          <div>{leave.type}</div>
                          <div>{leave.from}</div>
                          <div>{leave.to}</div>
                          <div>{leave.days} days</div>
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

                {/* Other Approvals */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Other Approvals</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Type</div>
                      <div>Requested By</div>
                      <div>Date</div>
                      <div>Details</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Expense Claim",
                          name: "John Doe",
                          date: "2025-04-15",
                          details: "$250 - Office Supplies",
                        },
                        {
                          id: 2,
                          type: "Training Request",
                          name: "Alice Johnson",
                          date: "2025-04-14",
                          details: "Advanced React Course - $500",
                        },
                      ].map((approval) => (
                        <div key={approval.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{approval.type}</div>
                          <div>{approval.name}</div>
                          <div>{approval.date}</div>
                          <div>{approval.details}</div>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const PayrollDashboard = ({ stats, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Payroll Status"
          value="In Progress"
          description="For current month"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Ticket Requests"
          value="7"
          description="Pending processing"
          icon={<Plane className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Indemnity Calculations"
          value="3"
          description="Pending review"
          icon={<Calculator className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Salary Advances"
          value="5"
          description="Pending approval"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="payroll">
        <TabsList>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="indemnity">Indemnity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Processing</CardTitle>
              <CardDescription>Track and manage monthly payroll processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payroll Status */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">April 2025 Payroll</h3>
                      <p className="text-sm text-muted-foreground">Processing period: Apr 1 - Apr 30, 2025</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">Status: In Progress</div>
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          60% Complete
                        </Badge>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payroll Tasks */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Payroll Tasks</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Task</div>
                      <div>Due Date</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          task: "Attendance Verification",
                          dueDate: "2025-04-25",
                          status: "Completed",
                        },
                        {
                          id: 2,
                          task: "Leave Deductions",
                          dueDate: "2025-04-26",
                          status: "Completed",
                        },
                        {
                          id: 3,
                          task: "Bonus Calculations",
                          dueDate: "2025-04-27",
                          status: "In Progress",
                        },
                        {
                          id: 4,
                          task: "Tax Calculations",
                          dueDate: "2025-04-28",
                          status: "Pending",
                        },
                        {
                          id: 5,
                          task: "Final Review",
                          dueDate: "2025-04-29",
                          status: "Pending",
                        },
                      ].map((task) => (
                        <div key={task.id} className="grid grid-cols-4 p-3 text-sm">
                          <div className="font-medium">{task.task}</div>
                          <div>{task.dueDate}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                task.status === "Completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : task.status === "In Progress"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm" disabled={task.status === "Completed"}>
                              {task.status === "Completed" ? "View" : "Process"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payroll Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Payroll Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Employees</div>
                          <div className="text-2xl font-bold">{stats.employees}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Salary</div>
                          <div className="text-2xl font-bold">$487,250</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Deductions</div>
                          <div className="text-2xl font-bold">$58,470</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Net Payable</div>
                          <div className="text-2xl font-bold">$428,780</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Payroll
                  </Button>
                  <Button>
                    <Check className="mr-2 h-4 w-4" />
                    Process Payroll
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Management</CardTitle>
              <CardDescription>Track and process employee ticket requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Ticket Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Requests</div>
                    <div className="mt-1 text-2xl font-bold">7</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring action</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Processed This Month</div>
                    <div className="mt-1 text-2xl font-bold">18</div>
                    <div className="mt-1 text-xs text-muted-foreground">Tickets issued</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Value</div>
                    <div className="mt-1 text-2xl font-bold">$24,850</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                </div>

                {/* Ticket Requests */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Ticket Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Ticket Type</div>
                      <div>Requested On</div>
                      <div>Eligibility</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          type: "Personal",
                          date: "2025-04-15",
                          eligibility: "Eligible",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          type: "Family",
                          date: "2025-04-14",
                          eligibility: "Eligible",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          type: "Personal",
                          date: "2025-04-13",
                          eligibility: "Not Eligible",
                        },
                      ].map((ticket) => (
                        <div key={ticket.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{ticket.name}</div>
                          <div>{ticket.department}</div>
                          <div>{ticket.type}</div>
                          <div>{ticket.date}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                ticket.eligibility === "Eligible"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {ticket.eligibility}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" disabled={ticket.eligibility === "Not Eligible"}>
                              Process
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ticket Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: "Personal Only", count: 85, color: "bg-blue-500" },
                        { type: "Family", count: 45, color: "bg-green-500" },
                        { type: "Emergency", count: 12, color: "bg-red-500" },
                      ].map((category) => (
                        <div key={category.type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{category.type}</div>
                            <div>{category.count} tickets</div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${category.color}`}
                              style={{ width: `${(category.count / 142) * 100}%` }}
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

        {/* Indemnity Tab */}
        <TabsContent value="indemnity">
          <Card>
            <CardHeader>
              <CardTitle>Indemnity Calculations</CardTitle>
              <CardDescription>Track and manage employee indemnity calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Indemnity Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Calculations</div>
                    <div className="mt-1 text-2xl font-bold">3</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring processing</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Processed This Month</div>
                    <div className="mt-1 text-2xl font-bold">5</div>
                    <div className="mt-1 text-xs text-muted-foreground">Indemnity payments</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Value</div>
                    <div className="mt-1 text-2xl font-bold">$78,450</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                </div>

                {/* Pending Indemnity Calculations */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Indemnity Calculations</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Service Period</div>
                      <div>Reason</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          servicePeriod: "5 years, 3 months",
                          reason: "Resignation",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          servicePeriod: "8 years, 7 months",
                          reason: "Termination",
                          status: "Pending",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          servicePeriod: "3 years, 2 months",
                          reason: "Resignation",
                          status: "Pending",
                        },
                      ].map((indemnity) => (
                        <div key={indemnity.id} className="grid grid-cols-6 p-3 text-sm">
                          <div className="font-medium">{indemnity.name}</div>
                          <div>{indemnity.department}</div>
                          <div>{indemnity.servicePeriod}</div>
                          <div>{indemnity.reason}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            >
                              {indemnity.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">
                              Calculate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Indemnity Formula */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Indemnity Calculation Formula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="font-medium mb-2">Service Period: 1-3 Years</h4>
                        <p className="text-sm text-muted-foreground">(Monthly Salary/26) × 15 × (Years of Service)</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="font-medium mb-2">Service Period: 3-5 Years</h4>
                        <p className="text-sm text-muted-foreground">(Monthly Salary/26) × 15 × (Years of Service)</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="font-medium mb-2">Service Period: 5-10 Years</h4>
                        <p className="text-sm text-muted-foreground">
                          (Monthly Salary/26) × 15 × 5 + (Monthly Wage/26) × 30 × Number of years More than 5
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="font-medium mb-2">Service Period: &gt;10 Years</h4>
                        <p className="text-sm text-muted-foreground">
                          (Monthly Salary/26) × 15 × 5 + (Monthly Wage/26) × 30 × Number of years More than 5 + (Monthly
                          Salary/26) × 30 × Number of Years More than 10
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
              <CardDescription>Generate and view payroll reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Report Types */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Salary Report</div>
                      <div className="text-xs">Monthly salary breakdown</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <Plane className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Ticket Report</div>
                      <div className="text-xs">Ticket allocations and usage</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <Calculator className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Indemnity Report</div>
                      <div className="text-xs">Indemnity calculations</div>
                    </div>
                  </Button>
                </div>

                {/* Recent Reports */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Reports</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Report Name</div>
                      <div>Type</div>
                      <div>Generated On</div>
                      <div>Generated By</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "March 2025 Payroll Summary",
                          type: "Salary Report",
                          date: "2025-04-01",
                          by: "Jane Smith",
                        },
                        {
                          id: 2,
                          name: "Q1 2025 Ticket Allocation",
                          type: "Ticket Report",
                          date: "2025-04-05",
                          by: "Jane Smith",
                        },
                        {
                          id: 3,
                          name: "Indemnity Calculations - March 2025",
                          type: "Indemnity Report",
                          date: "2025-04-10",
                          by: "Jane Smith",
                        },
                      ].map((report) => (
                        <div key={report.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{report.name}</div>
                          <div>{report.type}</div>
                          <div>{report.date}</div>
                          <div>{report.by}</div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <FileText className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Report */}
                <div className="flex justify-end">
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate New Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const EmployeeDashboard = ({ stats, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leave Balance"
          value="18"
          description="Days remaining"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Document Requests"
          value="2"
          description="In progress"
          icon={<FileCheck className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Next Appraisal"
          value="45"
          description="Days remaining"
          icon={<Award className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Tickets"
          value="1"
          description="Available"
          icon={<Plane className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="leave">
        <TabsList>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="appraisal">Appraisal</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Track your leave requests and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Leave Balance */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-4">Leave Balance</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>Annual Leave</div>
                        <div className="font-medium">18 days</div>
                      </div>
                      <Progress value={60} className="h-2" />
                      <div className="text-xs text-muted-foreground">18 of 30 days remaining</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>Sick Leave</div>
                        <div className="font-medium">15 days</div>
                      </div>
                      <Progress value={100} className="h-2" />
                      <div className="text-xs text-muted-foreground">15 of 15 days remaining</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>Haj Leave</div>
                        <div className="font-medium">21 days</div>
                      </div>
                      <Progress value={100} className="h-2" />
                      <div className="text-xs text-muted-foreground">21 of 21 days remaining</div>
                    </div>
                  </div>
                </div>

                {/* Leave History */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Leave History</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Leave Type</div>
                      <div>From</div>
                      <div>To</div>
                      <div>Days</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Annual Leave",
                          from: "2025-01-15",
                          to: "2025-01-25",
                          days: 10,
                          status: "Approved",
                        },
                        {
                          id: 2,
                          type: "Sick Leave",
                          from: "2025-02-10",
                          to: "2025-02-12",
                          days: 3,
                          status: "Approved",
                        },
                        {
                          id: 3,
                          type: "Annual Leave",
                          from: "2025-04-20",
                          to: "2025-04-22",
                          days: 2,
                          status: "Pending",
                        },
                      ].map((leave) => (
                        <div key={leave.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{leave.type}</div>
                          <div>{leave.from}</div>
                          <div>{leave.to}</div>
                          <div>{leave.days} days</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                leave.status === "Approved"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : leave.status === "Rejected"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              }
                            >
                              {leave.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Request Leave Button */}
                <div className="flex justify-end">
                  <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Leave
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>Track your document requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Document Request History */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Document Request History</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Document Type</div>
                      <div>Requested On</div>
                      <div>Purpose</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Salary Certificate",
                          date: "2025-04-10",
                          purpose: "Bank Loan",
                          status: "Completed",
                        },
                        {
                          id: 2,
                          type: "Experience Certificate",
                          date: "2025-04-15",
                          purpose: "Personal",
                          status: "In Progress",
                        },
                      ].map((doc) => (
                        <div key={doc.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{doc.type}</div>
                          <div>{doc.date}</div>
                          <div>{doc.purpose}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                doc.status === "Completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </div>
                          <div>
                            {doc.status === "Completed" ? (
                              <Button variant="ghost" size="sm">
                                Download
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled>
                                Pending
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Available Document Types */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Salary Certificate</div>
                      <div className="text-xs">For bank or loan purposes</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Experience Certificate</div>
                      <div className="text-xs">Employment verification</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Other Documents</div>
                      <div className="text-xs">Various official documents</div>
                    </div>
                  </Button>
                </div>

                {/* Request Document Button */}
                <div className="flex justify-end">
                  <Button>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Request Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appraisal Tab */}
        <TabsContent value="appraisal">
          <Card>
            <CardHeader>
              <CardTitle>Performance & Appraisal</CardTitle>
              <CardDescription>Track your performance and appraisal history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Next Appraisal */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Next Appraisal</h3>
                      <p className="text-sm text-muted-foreground">Scheduled for June 15, 2025</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">45 days remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance History */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Performance History</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Period</div>
                      <div>Rating</div>
                      <div>Manager</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          period: "Q1 2025",
                          rating: 4.2,
                          manager: "Jane Smith",
                        },
                        {
                          id: 2,
                          period: "Q4 2024",
                          rating: 4.0,
                          manager: "Jane Smith",
                        },
                        {
                          id: 3,
                          period: "Q3 2024",
                          rating: 3.8,
                          manager: "Jane Smith",
                        },
                      ].map((appraisal) => (
                        <div key={appraisal.id} className="grid grid-cols-4 p-3 text-sm">
                          <div className="font-medium">{appraisal.period}</div>
                          <div>
                            <div className="flex items-center">
                              <div className="mr-2">{appraisal.rating}/5</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full ${
                                      i < Math.floor(appraisal.rating)
                                        ? "bg-green-500"
                                        : i < appraisal.rating
                                          ? "bg-green-500/50"
                                          : "bg-muted"
                                    } mr-0.5`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>{appraisal.manager}</div>
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

                {/* Goals and Objectives */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Goals & Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { goal: "Complete project deliverables on time", progress: 75 },
                        { goal: "Improve technical skills in React", progress: 60 },
                        { goal: "Mentor junior team members", progress: 90 },
                        { goal: "Reduce bug rate by 15%", progress: 40 },
                      ].map((goal, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{goal.goal}</div>
                            <div>{goal.progress}%</div>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Matrix */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Skills Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { skill: "Technical Knowledge", rating: 4.5 },
                        { skill: "Communication", rating: 4.0 },
                        { skill: "Problem Solving", rating: 4.2 },
                        { skill: "Teamwork", rating: 4.8 },
                        { skill: "Leadership", rating: 3.5 },
                      ].map((skill, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{skill.skill}</div>
                            <div>{skill.rating}/5</div>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-10 ${
                                  i < Math.floor(skill.rating)
                                    ? "bg-primary"
                                    : i < skill.rating
                                      ? "bg-primary/50"
                                      : "bg-muted"
                                } mr-0.5`}
                              ></div>
                            ))}
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

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View and manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Full Name:</div>
                        <div className="text-sm">John Doe</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Employee ID:</div>
                        <div className="text-sm">EMP001</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Department:</div>
                        <div className="text-sm">IT Department</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Position:</div>
                        <div className="text-sm">Senior Developer</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Joining Date:</div>
                        <div className="text-sm">January 15, 2020</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Email:</div>
                        <div className="text-sm">john.doe@company.com</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Phone:</div>
                        <div className="text-sm">+1 (555) 123-4567</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Address:</div>
                        <div className="text-sm">123 Main St, Anytown, ST 12345</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm text-muted-foreground">Emergency Contact:</div>
                        <div className="text-sm">Jane Doe - +1 (555) 987-6543</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Employment Details</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Contract Type</div>
                      <div>Work Location</div>
                      <div>Manager</div>
                      <div>Status</div>
                    </div>
                    <div className="p-3 text-sm">
                      <div className="grid grid-cols-4">
                        <div>Permanent</div>
                        <div>Headquarters</div>
                        <div>Jane Smith</div>
                        <div>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-sm font-medium mb-3">My Documents</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Document Type</div>
                      <div>Issue Date</div>
                      <div>Expiry Date</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Passport",
                          issueDate: "2020-05-15",
                          expiryDate: "2030-05-14",
                        },
                        {
                          id: 2,
                          type: "Work Permit",
                          issueDate: "2023-01-10",
                          expiryDate: "2025-01-09",
                        },
                        {
                          id: 3,
                          type: "Health Insurance",
                          issueDate: "2025-01-01",
                          expiryDate: "2025-12-31",
                        },
                      ].map((doc) => (
                        <div key={doc.id} className="grid grid-cols-4 p-3 text-sm">
                          <div className="font-medium">{doc.type}</div>
                          <div>{doc.issueDate}</div>
                          <div>{doc.expiryDate}</div>
                          <div>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Update Profile Button */}
                <div className="flex justify-end">
                  <Button>Update Profile</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const StatsCard = ({ title, value, description, icon, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default Dashboard
