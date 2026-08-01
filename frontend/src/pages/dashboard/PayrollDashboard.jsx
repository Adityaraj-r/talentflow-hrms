import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, FileText, Users, Calendar, Check, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatsCard from "@/components/dashboard/StatsCard";
import { usePayrollDashboard } from "@/hooks/usePayrollDashboard";

const PayrollDashboard = ({ isLoading: _isLoading }) => {
  const [activeTab, setActiveTab] = useState("payroll");
  const { dashboard, loading, refreshing, refresh } = usePayrollDashboard();
  const navigate = useNavigate();
  const isLoading = _isLoading || loading;

  const {
    stats,
    payrollProcessed,
    pendingPaymentsCount,
    totalDeductions,
    issuesReported,
    totalPayroll,
    payrollStatus,
    deductionTypes,
    pendingPayrollActions,
    paymentHistory,
  } = dashboard;

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "Issue":
      case "Failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "Completed":
      case "Processed":
      case "Paid":
      case "Disbursed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Dashboard</h2>
          <p className="text-muted-foreground">Overview of payroll processing and analytics.</p>
        </div>
        <Button onClick={refresh} disabled={loading || refreshing} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.employees}
          description="On payroll"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
          isActive={activeTab === "payroll"}
          onClick={() => setActiveTab("payroll")}
        />
        <StatsCard
          title="Payroll Processed"
          value={payrollProcessed}
          description="This month"
          icon={<IndianRupee className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
          isActive={activeTab === "payroll"}
          onClick={() => setActiveTab("payroll")}
        />
        <StatsCard
          title="Pending Payments"
          value={pendingPaymentsCount}
          description="Awaiting processing"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
          isActive={activeTab === "payroll"}
          onClick={() => setActiveTab("payroll")}
        />
        <StatsCard
          title="Total Deductions"
          value={`₹${totalDeductions.toLocaleString()}`}
          description="This month"
          icon={<IndianRupee className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
          isActive={activeTab === "deductions"}
          onClick={() => setActiveTab("deductions")}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                        style={{ width: `${(status.count / Math.max(stats.employees, 1)) * 100}%` }}
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
                    <div className="mt-1 text-2xl font-bold">₹{totalPayroll.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Pending Payments</div>
                    <div className="mt-1 text-2xl font-bold">{pendingPaymentsCount}</div>
                    <div className="mt-1 text-xs text-muted-foreground">To be processed</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Issues Reported</div>
                    <div className="mt-1 text-2xl font-bold">{issuesReported}</div>
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
                      {pendingPayrollActions.length > 0 ? (
                        pendingPayrollActions.map((payment) => (
                          <div key={payment.id} className="grid grid-cols-5 p-3 text-sm items-center">
                            <div className="font-medium truncate" title={payment.name}>{payment.name}</div>
                            <div className="truncate" title={payment.department}>{payment.department}</div>
                            <div>{payment.amount}</div>
                            <div>
                              <Badge variant="outline" className={getStatusBadgeVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </div>
                            <div>
                              <Button variant="ghost" size="sm">
                                Process
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No pending actions
                        </div>
                      )}
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
                    <div className="mt-1 text-2xl font-bold">₹{totalDeductions.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-muted-foreground">This month</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Employees Affected</div>
                    <div className="mt-1 text-2xl font-bold">{Math.max(...deductionTypes.map(d => d.count), 0)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">With deductions</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Deduction</div>
                    <div className="mt-1 text-2xl font-bold">
                      ₹{totalDeductions > 0 && Math.max(...deductionTypes.map(d => d.count), 0) > 0 
                        ? Math.round(totalDeductions / Math.max(...deductionTypes.map(d => d.count), 0)).toLocaleString() 
                        : 0}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Per employee</div>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deductions by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deductionTypes.length > 0 ? (
                        deductionTypes.map((deduction) => (
                          <div key={deduction.type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">{deduction.type}</div>
                              <div>
                                ₹{deduction.amount.toLocaleString()} ({deduction.count} employees)
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full ${deduction.color}`}
                                style={{ width: `${Math.min((deduction.amount / Math.max(totalDeductions, 1)) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No deductions found for this month
                        </div>
                      )}
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
                    <div className="mt-1 text-2xl font-bold">₹{paymentHistory.totalPayments.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-muted-foreground">This year</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Payments Processed</div>
                    <div className="mt-1 text-2xl font-bold">{paymentHistory.paymentsProcessed}</div>
                    <div className="mt-1 text-xs text-muted-foreground">This year</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Average Payment</div>
                    <div className="mt-1 text-2xl font-bold">₹{Math.round(paymentHistory.averagePayment).toLocaleString()}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Per employee</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Payroll Runs</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium">
                      <div>Month</div>
                      <div>Employees</div>
                      <div>Total Amount</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {paymentHistory.recentRuns.length > 0 ? (
                        paymentHistory.recentRuns.map((run) => (
                          <div key={run.id} className="grid grid-cols-5 p-3 text-sm items-center">
                            <div>{run.date}</div>
                            <div>{run.employees}</div>
                            <div>{run.amount}</div>
                            <div>
                              <Badge variant="outline" className={getStatusBadgeVariant(run.status)}>
                                {run.status}
                              </Badge>
                            </div>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/payroll')}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No recent payroll runs
                        </div>
                      )}
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