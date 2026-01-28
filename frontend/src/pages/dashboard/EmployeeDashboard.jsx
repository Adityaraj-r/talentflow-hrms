import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, FileText, DollarSign, Check, Mail, Phone, MapPin, Building2, Briefcase, Clock } from "lucide-react";
import StatsCard from "@/pages/dashboard/StatsCard";
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();

  const leaveBalances = [
    { type: "Annual", used: 5, total: 20, color: "bg-blue-500" },
    { type: "Sick", used: 2, total: 10, color: "bg-green-500" },
    { type: "Compassionate", used: 0, total: 5, color: "bg-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content - No redundant header, just the top nav bar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Leave Balance"
              value={stats?.leaveRequests || 28}
              description="Days remaining this year"
              icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
              isLoading={isLoading}
            />
            <StatsCard
              title="Document Requests"
              value={stats?.documentsRequested || 2}
              description="Pending approval"
              icon={<FileText className="h-5 w-5 text-muted-foreground" />}
              isLoading={isLoading}
            />
            <StatsCard
              title="Payroll Status"
              value="Processed"
              description="January 2026"
              icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
              isLoading={isLoading}
            />
            <StatsCard
              title="Tasks Assigned"
              value="8"
              description="Active this month"
              icon={<Check className="h-5 w-5 text-muted-foreground" />}
              isLoading={isLoading}
            />
          </div>

          {/* Quick Actions Bar */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply for Leave
                </Button>
                <Button variant="outline" className="border-blue-300 dark:border-blue-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Request Document
                </Button>
                <Button variant="outline" className="border-blue-300 dark:border-blue-700">
                  <Clock className="h-4 w-4 mr-2" />
                  View Attendance
                </Button>
                <Button variant="outline" className="border-blue-300 dark:border-blue-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Download Payslip
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Profile
              </TabsTrigger>
              <TabsTrigger value="leave" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Leave Balance
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="payroll" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payroll
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    My Profile
                  </CardTitle>
                  <CardDescription>Your personal and employment details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user?.email || 'admin@hrms.com'}
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            EMP-12345
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            Information Technology
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            Software Engineer
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date of Joining</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            January 15, 2023
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employment Status</div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300">Active</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Information
                      </h3>
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="grid grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            Email
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Phone
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            Address
                          </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800">
                          <div className="grid grid-cols-3 text-sm">
                            <div className="text-gray-900 dark:text-gray-100">{user?.email || 'admin@hrms.com'}</div>
                            <div className="text-gray-900 dark:text-gray-100">+1 (555) 123-4567</div>
                            <div className="text-gray-900 dark:text-gray-100">123 Main St, Mumbai, India</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Emergency Contact
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Contact Name</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">John Doe</div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Contact Number</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">+1 (555) 987-6543</div>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Relationship</div>
                          <div className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">Spouse</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                      <Button variant="outline" className="flex-1">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leave Tab */}
            <TabsContent value="leave">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Leave Balance
                  </CardTitle>
                  <CardDescription>Your available leave balances and requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Leave Days</div>
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">35</div>
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">Available this year</div>
                      </div>
                      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-green-700 dark:text-green-400">Used Leave</div>
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-900 dark:text-green-100">7</div>
                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">Days taken this year</div>
                      </div>
                      <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending Requests</div>
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats?.leaveRequests || 3}</div>
                        <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Awaiting approval</div>
                      </div>
                    </div>

                    {/* Leave Balances by Type */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Leave Balances by Type</CardTitle>
                        <CardDescription>Breakdown of your leave allocation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-5">
                          {leaveBalances.map((leave) => (
                            <div key={leave.type} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`h-3 w-3 rounded-full ${leave.color}`}></div>
                                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{leave.type} Leave</span>
                                </div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{leave.total - leave.used}</span>
                                  <span className="text-gray-500 dark:text-gray-400">/{leave.total}</span> days remaining
                                </div>
                              </div>
                              <div className="relative h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={`absolute top-0 left-0 h-full rounded-full ${leave.color} transition-all duration-500`}
                                  style={{ width: `${((leave.total - leave.used) / leave.total) * 100}%` }}
                                >
                                  <div className="absolute inset-0 bg-white opacity-20"></div>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Used: {leave.used} days</span>
                                <span>{Math.round(((leave.total - leave.used) / leave.total) * 100)}% remaining</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Leave Requests */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Recent Leave Requests
                        </h3>
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-700">
                          <div>Leave Type</div>
                          <div>Period</div>
                          <div>Status</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {[
                            {
                              id: 1,
                              type: "Annual Leave",
                              startDate: "Jan 20, 2026",
                              endDate: "Jan 25, 2026",
                              days: 6,
                              status: "Pending",
                              statusColor: "yellow",
                            },
                            {
                              id: 2,
                              type: "Sick Leave",
                              startDate: "Dec 10, 2025",
                              endDate: "Dec 12, 2025",
                              days: 3,
                              status: "Approved",
                              statusColor: "green",
                            },
                            {
                              id: 3,
                              type: "Casual Leave",
                              startDate: "Nov 5, 2025",
                              endDate: "Nov 5, 2025",
                              days: 1,
                              status: "Approved",
                              statusColor: "green",
                            },
                          ].map((leave) => (
                            <div key={leave.id} className="grid grid-cols-4 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{leave.type}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{leave.days} {leave.days === 1 ? 'day' : 'days'}</div>
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                <div>{leave.startDate}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">to {leave.endDate}</div>
                              </div>
                              <div>
                                <Badge
                                  variant="outline"
                                  className={
                                    leave.statusColor === "yellow"
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
                                      : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300"
                                  }
                                >
                                  {leave.status}
                                </Badge>
                              </div>
                              <div>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                  <FileText className="h-3 w-3 mr-1" />
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

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Document Requests
                  </CardTitle>
                  <CardDescription>Your document requests and download history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending Requests</div>
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats?.documentsRequested || 2}</div>
                        <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Awaiting processing</div>
                      </div>
                      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-green-700 dark:text-green-400">Processed Documents</div>
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-900 dark:text-green-100">5</div>
                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">Available for download</div>
                      </div>
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Last Request</div>
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">Jan 10, 2026</div>
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">Salary Certificate</div>
                      </div>
                    </div>

                    {/* Document Requests Table */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document Requests History
                        </h3>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <FileText className="h-4 w-4 mr-2" />
                          New Request
                        </Button>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-700">
                          <div>Document Type</div>
                          <div>Requested On</div>
                          <div>Purpose</div>
                          <div>Status</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {[
                            {
                              id: 1,
                              type: "Salary Certificate",
                              date: "Jan 10, 2026",
                              purpose: "Bank Loan",
                              status: "Pending",
                              statusColor: "yellow",
                            },
                            {
                              id: 2,
                              type: "Employment Certificate",
                              date: "Jan 5, 2026",
                              purpose: "Visa Application",
                              status: "Pending",
                              statusColor: "yellow",
                            },
                            {
                              id: 3,
                              type: "Experience Letter",
                              date: "Dec 20, 2025",
                              purpose: "Personal Record",
                              status: "Processed",
                              statusColor: "green",
                            },
                            {
                              id: 4,
                              type: "Tax Statement",
                              date: "Dec 15, 2025",
                              purpose: "Tax Filing",
                              status: "Processed",
                              statusColor: "green",
                            },
                          ].map((request) => (
                            <div key={request.id} className="grid grid-cols-5 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  {request.type}
                                </div>
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">{request.date}</div>
                              <div className="text-gray-600 dark:text-gray-400">{request.purpose}</div>
                              <div>
                                <Badge
                                  variant="outline"
                                  className={
                                    request.statusColor === "yellow"
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
                                      : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300"
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                {request.status === "Pending" ? (
                                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                    View
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 dark:text-green-400">
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Available Document Types */}
                    <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
                      <CardHeader>
                        <CardTitle className="text-sm">Available Document Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {["Salary Certificate", "Employment Letter", "Experience Letter", "Tax Statement", "No Objection Certificate", "Relieving Letter", "Appointment Letter", "Pay Slip"].map((doc) => (
                            <div key={doc} className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 p-3 text-center hover:shadow-md transition-shadow cursor-pointer">
                              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{doc}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Payroll Information
                  </CardTitle>
                  <CardDescription>Your salary details and payment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Latest Payment</div>
                          <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">₹5,200</div>
                        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">January 2026</div>
                      </div>
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-400">YTD Earnings</div>
                          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">₹5,200</div>
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">2026</div>
                      </div>
                      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-red-700 dark:text-red-400">Total Deductions</div>
                          <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-red-900 dark:text-red-100">₹1,200</div>
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">January 2026</div>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-base">Current Salary Breakdown</CardTitle>
                        <CardDescription>January 2026</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Earnings */}
                            <div>
                              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                Earnings
                              </h4>
                              <div className="space-y-2">
                                {[
                                  { label: "Basic Salary", amount: "₹3,500" },
                                  { label: "House Rent Allowance", amount: "₹1,200" },
                                  { label: "Transport Allowance", amount: "₹300" },
                                  { label: "Special Allowance", amount: "₹200" },
                                ].map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.amount}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 dark:border-green-800">
                                  <span className="text-sm font-bold text-green-700 dark:text-green-400">Gross Earnings</span>
                                  <span className="text-lg font-bold text-green-700 dark:text-green-400">₹5,200</span>
                                </div>
                              </div>
                            </div>

                            {/* Deductions */}
                            <div>
                              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                Deductions
                              </h4>
                              <div className="space-y-2">
                                {[
                                  { label: "Provident Fund", amount: "₹420" },
                                  { label: "Professional Tax", amount: "₹200" },
                                  { label: "Income Tax (TDS)", amount: "₹500" },
                                  { label: "Health Insurance", amount: "₹80" },
                                ].map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.amount}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t-2 border-red-200 dark:border-red-800">
                                  <span className="text-sm font-bold text-red-700 dark:text-red-400">Total Deductions</span>
                                  <span className="text-lg font-bold text-red-700 dark:text-red-400">₹1,200</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Net Pay */}
                          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Net Pay (Take Home)</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Amount credited to your account</div>
                              </div>
                              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">₹4,000</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Payslips */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Recent Payslips
                        </h3>
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-700">
                          <div>Month/Year</div>
                          <div>Gross Pay</div>
                          <div>Deductions</div>
                          <div>Net Pay</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {[
                            {
                              id: 1,
                              month: "January 2026",
                              gross: "₹5,200",
                              deductions: "₹1,200",
                              net: "₹4,000",
                              status: "Paid",
                            },
                            {
                              id: 2,
                              month: "December 2025",
                              gross: "₹5,200",
                              deductions: "₹1,200",
                              net: "₹4,000",
                              status: "Paid",
                            },
                            {
                              id: 3,
                              month: "November 2025",
                              gross: "₹5,200",
                              deductions: "₹1,200",
                              net: "₹4,000",
                              status: "Paid",
                            },
                          ].map((payslip) => (
                            <div key={payslip.id} className="grid grid-cols-5 p-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{payslip.month}</div>
                                <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300">{payslip.status}</Badge>
                              </div>
                              <div className="text-gray-700 dark:text-gray-300 font-medium">{payslip.gross}</div>
                              <div className="text-red-600 dark:text-red-400 font-medium">{payslip.deductions}</div>
                              <div className="text-green-600 dark:text-green-400 font-bold">{payslip.net}</div>
                              <div>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Download
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
      </main>
    </div>
  );
};

export default EmployeeDashboard;
