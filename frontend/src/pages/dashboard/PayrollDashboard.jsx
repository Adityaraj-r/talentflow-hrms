import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, FileText, Users, Calendar, Check, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "@/components/dashboard/StatsCard";
import { usePayrollDashboard } from "@/hooks/usePayrollDashboard";

const PayrollDashboard = ({ stats: _stats, isLoading: _isLoading }) => {
  const { user } = useAuth();
  const { dashboard, loading, refreshing, refresh } = usePayrollDashboard();
  const navigate = useNavigate();
  const isLoading = _isLoading || loading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

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
      
      {/* 1. GREETING HEADER & DATA FRESHNESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Payroll Operations
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, <span className="font-bold">{user?.firstName || "Payroll Specialist"}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back. Here's today's HR Operations Overview.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200 font-medium">Just now</strong></span>
          </div>
          <Button onClick={refresh} disabled={loading || refreshing} variant="outline" size="sm" className="cursor-pointer">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
          title="Payroll Processed"
          value={payrollProcessed}
          subtitle="96% completed"
          icon={<IndianRupee className="h-5 w-5" />}
          variant="green"
          isLoading={isLoading}
          onClick={() => navigate('/payroll/salary-slip')}
        />
        <StatsCard
          title="Pending Payments"
          value={pendingPaymentsCount}
          subtitle="3 awaiting approval"
          icon={<FileText className="h-5 w-5" />}
          variant="purple"
          isLoading={isLoading}
          onClick={() => navigate('/payroll')}
        />
        <StatsCard
          title="Total Deductions"
          value={`₹${totalDeductions.toLocaleString()}`}
          subtitle="PF & ESI statutory deductions"
          icon={<IndianRupee className="h-5 w-5" />}
          variant="orange"
          isLoading={isLoading}
          onClick={() => navigate('/payroll')}
        />
      </div>

      {/* 3. TABS WITH DYNAMIC COUNTERS & ACTIVE HIGHLIGHT */}
      <Tabs defaultValue="payroll">
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
          <TabsTrigger 
            value="payroll" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Payroll Status ({stats.employees || 128})
          </TabsTrigger>
          <TabsTrigger 
            value="deductions" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Deductions ({deductionTypes?.length || 4})
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
          >
            Payment History ({paymentHistory?.length || 5})
          </TabsTrigger>
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