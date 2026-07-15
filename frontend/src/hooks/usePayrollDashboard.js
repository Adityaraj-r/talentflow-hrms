import { useState, useEffect, useCallback } from "react";
import * as payrollService from "@/services/payrollService";
import * as reportsService from "@/services/reports.service";

export const usePayrollDashboard = () => {
  const [dashboard, setDashboard] = useState({
    stats: {
      employees: 0,
    },
    payrollProcessed: 0,
    pendingPaymentsCount: 0,
    totalDeductions: 0,
    issuesReported: 0,
    totalPayroll: 0,
    payrollStatus: [
      { name: "Processed", count: 0, color: "bg-green-500" },
      { name: "Pending", count: 0, color: "bg-yellow-500" },
      { name: "Issues", count: 0, color: "bg-red-500" },
    ],
    deductionTypes: [],
    pendingPayrollActions: [],
    paymentHistory: {
      totalPayments: 0,
      paymentsProcessed: 0,
      averagePayment: 0,
      recentRuns: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const now = new Date();
      const currentMonth = now.toLocaleString("default", { month: "long" });
      const currentYear = now.getFullYear();

      // Fetch all required data in parallel
      const [
        summaryRes,
        pendingRes,
        complianceRes,
        ticketsRes,
        analyticsRes,
      ] = await Promise.all([
        reportsService.getSummary({}),
        payrollService.getPendingPayroll(currentMonth, currentYear),
        payrollService.getPayrollComplianceSummary(currentMonth, currentYear),
        payrollService.getTickets({ status: "Open" }),
        payrollService.getPayrollAnalytics(currentYear),
      ]);

      const totalEmployees = summaryRes?.data?.headcount || 0;
      const pendingCount = pendingRes?.data?.total || 0;
      const pendingActions = (pendingRes?.data?.pending || []).map((p) => ({
        id: p._id,
        name: `${p.firstName} ${p.lastName}`,
        department: p.department?.name || p.department || "N/A",
        amount: "Pending",
        status: "Pending",
      }));

      const complianceData = complianceRes?.data || {};
      const totals = complianceData.totals || {};
      const totalDeductions = totals.statutory || 0;
      
      const deductionTypes = [
        { type: "Taxes (TDS)", amount: totals.tds || 0, count: complianceData.employeeLines || 0, color: "bg-blue-500" },
        { type: "PF", amount: totals.pf || 0, count: complianceData.employeeLines || 0, color: "bg-green-500" },
        { type: "ESI", amount: totals.esi || 0, count: complianceData.employeeLines || 0, color: "bg-yellow-500" },
        { type: "PT", amount: totals.pt || 0, count: complianceData.employeeLines || 0, color: "bg-purple-500" },
      ].filter(d => d.amount > 0);

      const issuesCount = ticketsRes?.data?.data?.length || ticketsRes?.data?.length || 0;

      const runs = analyticsRes?.data?.runs || [];
      const currentMonthRun = runs.find((r) => r.month === currentMonth && r.year === currentYear);
      
      const payrollProcessed = currentMonthRun?.headcount || 0;
      const totalPayroll = currentMonthRun?.totalNet || 0;

      const payrollStatus = [
        { name: "Processed", count: payrollProcessed, color: "bg-green-500" },
        { name: "Pending", count: pendingCount, color: "bg-yellow-500" },
        { name: "Issues", count: issuesCount, color: "bg-red-500" },
      ];

      // Payment History Calculations
      const totalPaymentsThisYear = runs.reduce((acc, r) => acc + (r.totalNet || 0), 0);
      const paymentsProcessedThisYear = runs.reduce((acc, r) => acc + (r.headcount || 0), 0);
      const averagePayment = paymentsProcessedThisYear > 0 ? (totalPaymentsThisYear / paymentsProcessedThisYear) : 0;
      
      const recentRuns = runs.slice(0, 5).map((r, i) => ({
        id: i + 1,
        date: `${r.month} ${r.year}`,
        employees: r.headcount,
        amount: `₹${(r.totalNet || 0).toLocaleString()}`,
        status: r.status,
      }));

      setDashboard({
        stats: { employees: totalEmployees },
        payrollProcessed,
        pendingPaymentsCount: pendingCount,
        totalDeductions,
        issuesReported: issuesCount,
        totalPayroll,
        payrollStatus,
        deductionTypes,
        pendingPayrollActions: pendingActions,
        paymentHistory: {
          totalPayments: totalPaymentsThisYear,
          paymentsProcessed: paymentsProcessedThisYear,
          averagePayment,
          recentRuns,
        },
      });

    } catch (err) {
      console.error("Payroll Dashboard Error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = () => fetchDashboardData(true);

  return {
    dashboard,
    loading,
    refreshing,
    error,
    refresh,
  };
};
