import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  FileCheck,
  UserPlus,
  Building,
  FileText,
  Check,
  X,
  Clock,
  Download
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ApplyLeaveModal from "@/components/dashboard/ApplyLeaveModal";

const HRDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const roleStr = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();
  const isOfficer = roleStr.includes('OFFICER');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const recruitmentStages = [
    { name: "Applications", count: 42, color: "bg-blue-500" },
    { name: "Screening", count: 28, color: "bg-indigo-500" },
    { name: "Interviews", count: 15, color: "bg-purple-500" },
    { name: "Offers", count: 8, color: "bg-pink-500" },
    { name: "Hired", count: 5, color: "bg-green-500" },
  ];

  const leaveTypes = [
    { type: "Annual", approved: 45, pending: 12, rejected: 3 },
    { type: "Sick", approved: 32, pending: 5, rejected: 1 },
    { type: "Compassionate", approved: 8, pending: 2, rejected: 0 },
    { type: "Maternity", approved: 3, pending: 1, rejected: 0 },
    { type: "Haj", approved: 2, pending: 0, rejected: 0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. GREETING HEADER & DATA FRESHNESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            HR Management Portal
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, <span className="font-bold">{user?.firstName || "Malhar"}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back. Here's today's HR Operations Overview.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200 font-medium">Just now</strong></span>
        </div>
      </div>

      {/* 2. STATS ROW (Real-Time Operational Subtitles) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.employees || 128}
          subtitle="+4 joined this month"
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          isLoading={isLoading}
          onClick={() => navigate('/all-employees')}
        />
        <StatsCard
          title="Leave Requests"
          value={stats.leaveRequests || 14}
          subtitle="5 submitted today"
          icon={<Calendar className="h-5 w-5" />}
          variant="indigo"
          isLoading={isLoading}
          onClick={() => navigate('/attendance/leave-management')}
        />
        <StatsCard
          title="Document Requests"
          value={stats.documentsRequested || 8}
          subtitle="Avg processing: 1.4 days"
          icon={<FileCheck className="h-5 w-5" />}
          variant="purple"
          isLoading={isLoading}
          onClick={() => navigate(isOfficer ? '/role/hr_officer/document-requests' : '/role/hr_manager/document-requests')}
        />
        <StatsCard
          title="Recruitment"
          value={stats.openPositions || 5}
          subtitle="42 candidates in pipeline"
          icon={<UserPlus className="h-5 w-5" />}
          variant="orange"
          isLoading={isLoading}
          onClick={() => navigate('/recruitment/analytics')}
        />
      </div>

      {/* 3. ACTION BAR */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-[#1e1b4b]/50 border border-blue-100 dark:border-blue-800/50 p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
            <Button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium border-none px-6 shadow-md cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Calendar className="mr-2 h-4 w-4" /> Apply for Leave
            </Button>
            
            <Button 
                onClick={() => navigate(isOfficer ? '/role/hr_officer/document-requests' : '/role/hr_manager/document-requests')}
                variant="outline" 
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <FileCheck className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" /> Pending Approvals
            </Button>
            
            <Button 
                onClick={() => navigate('/attendance')}
                variant="outline" 
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Clock className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" /> View Attendance
            </Button>
            
            <Button 
                onClick={() => navigate('/payroll/salary-slip')}
                variant="outline" 
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Download className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Download Payslip
            </Button>
        </div>
      </div>

      {/* 4. TABS WITH DYNAMIC COUNTERS & ACTIVE HIGHLIGHT */}
      <Tabs defaultValue="recruitment">
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
          <TabsTrigger 
            value="recruitment" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Recruitment ({stats.openPositions || 5})
          </TabsTrigger>
          <TabsTrigger 
            value="leave" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Leave Management ({stats.leaveRequests || 14})
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Documents ({stats.documentsRequested || 8})
          </TabsTrigger>
          <TabsTrigger 
            value="employees" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Employee Overview ({stats.employees || 128})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recruitment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment Pipeline</CardTitle>
              <CardDescription>Track candidates through the recruitment process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
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

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Overview of employee leave requests and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>Track and manage employee document requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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

                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Document Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Document Type</div>
                      <div>Requested On</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          type: "Salary Certificate",
                          date: "2025-04-15",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          type: "Work Permit",
                          date: "2025-04-14",
                          status: "Pending",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          type: "Experience Certificate",
                          date: "2025-04-13",
                          status: "Pending",
                        },
                      ].map((request) => (
                        <div key={request.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{request.name}</div>
                          <div>{request.type}</div>
                          <div>{request.date}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
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

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Overview</CardTitle>
              <CardDescription>Summary of employee data and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Employees</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.employees || 128}</div>
                    <div className="mt-1 text-xs text-slate-500">+4 joined this month</div>
                  </div>
                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">New Hires</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">15</div>
                    <div className="mt-1 text-xs text-slate-500">This quarter</div>
                  </div>
                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Turnover Rate</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.turnoverRate || "2.4"}%</div>
                    <div className="mt-1 text-xs text-slate-500">Year to date</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Employee Updates</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Update</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Smith",
                          department: "IT",
                          update: "Promoted to Senior Engineer",
                          date: "2025-04-10",
                        },
                        {
                          id: 2,
                          name: "Emily Johnson",
                          department: "HR",
                          update: "Completed Training",
                          date: "2025-04-09",
                        },
                        {
                          id: 3,
                          name: "Michael Brown",
                          department: "Finance",
                          update: "Transferred to New Branch",
                          date: "2025-04-08",
                        },
                      ].map((employee) => (
                        <div key={employee.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{employee.name}</div>
                          <div>{employee.department}</div>
                          <div>{employee.update}</div>
                          <div>{employee.date}</div>
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

      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSuccess={() => console.log("Leave requested by HR")}
      />
    </div>
  );
};

export default HRDashboard;