import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, FileText, DollarSign, Check } from "lucide-react";
import StatsCard from "@/pages/dashboard/StatsCard";

const EmployeeDashboard = ({ stats, isLoading }) => {
  const leaveBalances = [
    { type: "Annual", used: 5, total: 20, color: "bg-blue-500" },
    { type: "Sick", used: 2, total: 10, color: "bg-green-500" },
    { type: "Compassionate", used: 0, total: 5, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leave Balance"
          value={stats.leaveRequests}
          description="Days remaining"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Document Requests"
          value={stats.documentsRequested}
          description="Pending"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Payroll Status"
          value="Processed"
          description="For April"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Tasks Assigned"
          value="8"
          description="This month"
          icon={<Check className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="leave">Leave Balance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Your personal and employment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Name</div>
                    <div className="mt-1 text-lg font-bold">Jane Doe</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Employee ID</div>
                    <div className="mt-1 text-lg font-bold">EMP-12345</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Department</div>
                    <div className="mt-1 text-lg font-bold">IT</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Position</div>
                    <div className="mt-1 text-lg font-bold">Software Engineer</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-3 bg-muted/50 p-3 text-xs font-medium">
                      <div>Email</div>
                      <div>Phone</div>
                      <div>Address</div>
                    </div>
                    <div className="p-3 text-sm">
                      <div className="grid grid-cols-3">
                        <div>jane.doe@company.com</div>
                        <div>+1 (555) 123-4567</div>
                        <div>123 Main St, City, Country</div>
                      </div>
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
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Your available leave balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Leave Days</div>
                    <div className="mt-1 text-2xl font-bold">35</div>
                    <div className="mt-1 text-xs text-muted-foreground">Available this year</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Used Leave</div>
                    <div className="mt-1 text-2xl font-bold">7</div>
                    <div className="mt-1 text-xs text-muted-foreground">This year</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Requests</div>
                    <div className="mt-1 text-2xl font-bold">{stats.leaveRequests}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Awaiting approval</div>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Leave Balances by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leaveBalances.map((leave) => (
                        <div key={leave.type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{leave.type} Leave</div>
                            <div>
                              {leave.total - leave.used}/{leave.total} days remaining
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${leave.color}`}
                              style={{ width: `${((leave.total - leave.used) / leave.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Leave Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Type</div>
                      <div>Period</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Annual Leave",
                          startDate: "2025-04-20",
                          endDate: "2025-04-25",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          type: "Sick Leave",
                          startDate: "2025-03-10",
                          endDate: "2025-03-12",
                          status: "Approved",
                        },
                      ].map((leave) => (
                        <div key={leave.id} className="grid grid-cols-4 p-3 text-sm">
                          <div>{leave.type}</div>
                          <div>
                            {leave.startDate} to {leave.endDate}
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                leave.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              }
                            >
                              {leave.status}
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

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>Your document requests and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Requests</div>
                    <div className="mt-1 text-2xl font-bold">{stats.documentsRequested}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Awaiting processing</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Processed Documents</div>
                    <div className="mt-1 text-2xl font-bold">3</div>
                    <div className="mt-1 text-xs text-muted-foreground">This year</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Last Request</div>
                    <div className="mt-1 text-2xl font-bold">2025-04-15</div>
                    <div className="mt-1 text-xs text-muted-foreground">Salary Certificate</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Document Requests</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Type</div>
                      <div>Requested On</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          type: "Salary Certificate",
                          date: "2025-04-15",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          type: "Employment Certificate",
                          date: "2025-03-20",
                          status: "Processed",
                        },
                      ].map((request) => (
                        <div key={request.id} className="grid grid-cols-4 p-3 text-sm">
                          <div>{request.type}</div>
                          <div>{request.date}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                request.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
                              {request.status === "Pending" ? "View" : "Download"}
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

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Information</CardTitle>
              <CardDescription>Your recent payslips and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Latest Payment</div>
                    <div className="mt-1 text-2xl font-bold">$5,200</div>
                    <div className="mt-1 text-xs text-muted-foreground">April 2025</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">YTD Earnings</div>
                    <div className="mt-1 text-2xl font-bold">$20,800</div>
                    <div className="mt-1 text-xs text-muted-foreground">2025</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Deductions</div>
                    <div className="mt-1 text-2xl font-bold">$1,200</div>
                    <div className="mt-1 text-xs text-muted-foreground">April 2025</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Payslips</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium">
                      <div>Date</div>
                      <div>Net Pay</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          date: "2025-04-15",
                          netPay: "$5,200",
                          status: "Processed",
                        },
                        {
                          id: 2,
                          date: "2025-03-15",
                          netPay: "$5,200",
                          status: "Processed",
                        },
                        {
                          id: 3,
                          date: "2025-02-15",
                          netPay: "$5,200",
                          status: "Processed",
                        },
                      ].map((payslip) => (
                        <div key={payslip.id} className="grid grid-cols-4 p-3 text-sm">
                          <div>{payslip.date}</div>
                          <div>{payslip.netPay}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            >
                              {payslip.status}
                            </Badge>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
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
  );
};

export default EmployeeDashboard;