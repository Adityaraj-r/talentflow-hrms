import React from "react";
import { IndianRupee, FileText, Users, Calendar, RefreshCw, ArrowUpRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayrollDashboard } from "@/hooks/usePayrollDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Issue":
      case "Failed":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
      case "Completed":
      case "Processed":
      case "Paid":
      case "Disbursed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300";
    }
  };

  const smartAlerts = [
    {
      id: 1,
      type: 'pending',
      title: 'Pending Approvals',
      desc: `${pendingPaymentsCount || 0} payroll payments are awaiting final approval.`,
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-100'
    },
    {
      id: 2,
      type: 'issues',
      title: 'Discrepancy Alerts',
      desc: `${issuesReported || 0} anomalies detected in recent payroll runs.`,
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
      iconBg: 'bg-rose-100'
    },
    {
      id: 3,
      type: 'success',
      title: 'Payroll Progress',
      desc: 'Current month payroll processing is on track.',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100'
    }
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50/50 flex items-center justify-center text-slate-500">Loading dashboard...</div>;
  }

  // Workaround since Clock is not imported above but used in smartAlerts
  const Clock = Calendar; 

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
            {getGreeting()}, {user?.firstName || "Payroll Specialist"}
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Manage payroll runs, deductions, and financial summaries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refresh} disabled={loading || refreshing} variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm rounded-[12px]">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => navigate('/payroll')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Run Payroll</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Initiate new payroll cycles and disburse salaries.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/payroll')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Manage Deductions</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Review PF, ESI, tax, and other statutory deductions.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/all-employees')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Employee Directory</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Access employee financial records and details.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OVERVIEW STATS */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Current Cycle Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Key metrics for the current payroll period</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">₹{(totalPayroll || 0).toLocaleString()}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Payroll</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-500 mb-2">{pendingPaymentsCount || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Payments</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mb-2">{payrollProcessed || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Processed</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-500 mb-2">₹{(totalDeductions || 0).toLocaleString()}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Deductions</span>
              </div>
            </div>

            {/* Progress Bar */}
            {payrollStatus && payrollStatus.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-semibold mb-3">Processing Status</h4>
                    <div className="flex h-3 items-center rounded-full overflow-hidden">
                        {payrollStatus.map((status, index) => (
                        <div
                            key={status.name}
                            className={`h-full ${status.color}`}
                            style={{ width: `${(status.count / Math.max(stats.employees || 1, 1)) * 100}%` }}
                        ></div>
                        ))}
                    </div>
                    <div className="flex justify-between gap-4 mt-3 flex-wrap">
                        {payrollStatus.map((status) => (
                        <div key={status.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <span className={`w-2.5 h-2.5 rounded-full ${status.color}`}></span>
                            {status.name} ({status.count})
                        </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Pending Actions</h3>
              <div className="space-y-4">
                  {pendingPayrollActions?.length > 0 ? (
                      pendingPayrollActions.map((payment) => (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{payment.name}</p>
                              <p className="text-xs text-slate-500">{payment.department}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                              <span className="font-medium text-sm">{payment.amount}</span>
                              <Badge variant="outline" className={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                              <button className="text-purple-600 hover:text-purple-700 text-xs font-semibold">Process</button>
                          </div>
                      </div>
                      ))
                  ) : (
                      <div className="p-4 text-center text-sm text-slate-500">No pending actions</div>
                  )}
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Deductions Breakdown</h3>
              <div className="space-y-4">
                  {deductionTypes?.length > 0 ? (
                      deductionTypes.map((deduction) => (
                      <div key={deduction.type} className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-900 dark:text-white">{deduction.type}</span>
                          <span className="text-slate-600 dark:text-slate-400 text-xs">₹{(deduction.amount || 0).toLocaleString()} • {deduction.count} emp</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                              className={`h-full rounded-full ${deduction.color}`}
                              style={{ width: `${Math.min(((deduction.amount || 0) / Math.max(totalDeductions || 1, 1)) * 100, 100)}%` }}
                          ></div>
                          </div>
                      </div>
                      ))
                  ) : (
                      <div className="p-4 text-center text-sm text-slate-500">No deductions found</div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR - SMART ALERTS */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Payroll Alerts</h3>
            
            <div className="space-y-4">
              {smartAlerts.length > 0 ? (
                smartAlerts.map(alert => (
                  <div key={alert.id} className={cn("p-4 rounded-[16px] border shadow-sm", alert.bg)}>
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-0.5">
                         {alert.icon}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-900">{alert.title}</h4>
                        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                          {alert.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-[16px] border border-slate-200 bg-slate-50 text-center text-[13px] text-slate-500">
                  No new alerts.
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Payment History</h4>
                <div className="space-y-3">
                    {paymentHistory?.recentRuns?.slice(0, 3).map(run => (
                        <div key={run.id} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{run.date}</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{run.amount}</span>
                        </div>
                    ))}
                    <Button variant="link" className="w-full text-xs h-auto p-0 text-purple-600" onClick={() => navigate('/payroll')}>View Full History</Button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;
