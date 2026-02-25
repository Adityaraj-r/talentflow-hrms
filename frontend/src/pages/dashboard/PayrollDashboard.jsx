import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Users,Calendar, Check } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const PayrollDashboard = ({ stats, isLoading }) => {
  const payrollStatus = [
    { name: "Processed", count: 145, color: "bg-green-500" },
    { name: "Pending", count: 10, color: "bg-yellow-500" },
    { name: "Issues", count: 1, color: "bg-red-500" },
  ];

  const deductionTypes = [
    { type: "Taxes", amount: 125000, count: 156, color: "bg-blue-500" },
    { type: "Insurance", amount: 32000, count: 150, color: "bg-green-500" },
    { type: "Retirement", amount: 45000, count: 140, color: "bg-yellow-500" },
    { type: "Other", amount: 5000, count: 20, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.employees}
          description="On payroll"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Payroll Processed"
          value="145"
          description="This month"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Pending Payments"
          value="10"
          description="Awaiting processing"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Total Deductions"
          value="$207,000"
          description="This month"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="payroll">
        <TabsList>
          <TabsTrigger value="payroll">Payroll Status</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Status</CardTitle>
              <CardDescription>Overview of current payroll processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex h-8 items-center">
                    {payrollStatus.map((status, index) => (
                      <div
                        key={status.name}
                        className={`h-full ${status.color} ${index === 0 ? "rounded-l-md" : ""} ${
                          index === payrollStatus.length - 1 ? "rounded-r-md" : ""
                        }`}
                        style={{ width: `${(status.count / stats.employees) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {payrollStatus.map((status) => (
                      <div key={status.name}>
                        <div className="font-medium">{status.count}</div>
                        <div className="text-muted-foreground">{status.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Payroll</div>
                    <div className="mt-1 text-2xl font-bold">$1,245,000</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Payments</div>
                    <div className="mt-1 text-2xl font-bold">10</div>
                    <div className="mt-1 text-xs text-muted-foreground">To be processed</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Issues Reported</div>
                    <div className="mt-1 text-2xl font-bold">1</div>
                    <div className="mt-1 text-xs text-muted-foreground">Requiring resolution</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Pending Payroll Actions</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Employee</div>
                      <div>Department</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          department: "IT",
                          amount: "$5,200",
                          status: "Pending",
                        },
                        {
                          id: 2,
                          name: "Alice Johnson",
                          department: "HR",
                          amount: "$4,800",
                          status: "Pending",
                        },
                        {
                          id: 3,
                          name: "Bob Williams",
                          department: "Finance",
                          amount: "$6,000",
                          status: "Issue",
                        },
                      ].map((payment) => (
                        <div key={payment.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium">{payment.name}</div>
                          <div>{payment.department}</div>
                          <div>{payment.amount}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={
                                payment.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {payment.status}
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

        <TabsContent value="deductions">
          <Card>
            <CardHeader>
              <CardTitle>Deductions Overview</CardTitle>
              <CardDescription>Breakdown of payroll deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Deductions</div>
                    <div className="mt-1 text-2xl font-bold">$207,000</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Employees Affected</div>
                    <div className="mt-1 text-2xl font-bold">156</div>
                    <div className="mt-1 text-xs text-muted-foreground">With deductions</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Deduction</div>
                    <div className="mt-1 text-2xl font-bold">$1,327</div>
                    <div className="mt-1 text-xs text-muted-foreground">Per employee</div>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deductions by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deductionTypes.map((deduction) => (
                        <div key={deduction.type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{deduction.type}</div>
                            <div>
                              ${deduction.amount.toLocaleString()} ({deduction.count} employees)
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${deduction.color}`}
                              style={{ width: `${(deduction.amount / 207000) * 100}%` }}
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of processed payrolls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Total Payments</div>
                    <div className="mt-1 text-2xl font-bold">$3,735,000</div>
                    <div className="mt-1 text-xs text-muted-foreground">This quarter</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Payments Processed</div>
                    <div className="mt-1 text-2xl font-bold">468</div>
                    <div className="mt-1 text-xs text-muted-foreground">This quarter</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Payment</div>
                    <div className="mt-1 text-2xl font-bold">$7,981</div>
                    <div className="mt-1 text-xs text-muted-foreground">Per employee</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Payroll Runs</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Date</div>
                      <div>Employees</div>
                      <div>Total Amount</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {[
                        {
                          id: 1,
                          date: "2025-04-15",
                          employees: 156,
                          amount: "$1,245,000",
                          status: "Completed",
                        },
                        {
                          id: 2,
                          date: "2025-03-15",
                          employees: 155,
                          amount: "$1,230,000",
                          status: "Completed",
                        },
                        {
                          id: 3,
                          date: "2025-02-15",
                          employees: 154,
                          amount: "$1,260,000",
                          status: "Completed",
                        },
                      ].map((run) => (
                        <div key={run.id} className="grid grid-cols-5 p-3 text-sm">
                          <div>{run.date}</div>
                          <div>{run.employees}</div>
                          <div>{run.amount}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            >
                              {run.status}
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

export default PayrollDashboard;