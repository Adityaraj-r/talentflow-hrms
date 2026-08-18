import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ChevronLeft, ChevronRight, ArrowUpRight, Award } from "lucide-react";

export const TopReferrersTable = ({
  data = [],
  pagination = { currentPage: 1, totalPages: 1, totalRecords: 0 },
  search = "",
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onEmployeeClick,
  loading = false,
}) => {
  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Users className="h-4 w-4" />
            </div>
            Top Referrers & Operational Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Employee referral performance. Click any employee row to inspect their referral activity history.
          </CardDescription>
        </div>

        <form onSubmit={onSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search employee by name or ID..."
              className="pl-8 h-9 text-xs bg-white dark:bg-slate-850"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-9 text-xs cursor-pointer">
            Search
          </Button>
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 sm:p-4">Employee</th>
                <th className="p-3.5 sm:p-4">Department</th>
                <th className="p-3.5 sm:p-4 text-center">Referrals</th>
                <th className="p-3.5 sm:p-4 text-center">Applied</th>
                <th className="p-3.5 sm:p-4 text-center">Interviews</th>
                <th className="p-3.5 sm:p-4 text-center">Hired</th>
                <th className="p-3.5 sm:p-4 text-center">Success Rate</th>
                <th className="p-3.5 sm:p-4 text-center">Quality Rating</th>
                <th className="p-3.5 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading employee referral records...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No referral activity found matching search filters.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const total = row.totalReferrals || 0;
                  const hired = row.hired || 0;
                  const rate = total > 0 ? `${((hired / total) * 100).toFixed(1)}%` : "0.0%";

                  return (
                    <tr
                      key={row.employeeId || row.employeeCode}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                      onClick={() => onEmployeeClick(row.employeeId)}
                    >
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{row.employeeName}</div>
                        <div className="text-[11px] text-slate-500">{row.employeeCode}</div>
                      </td>
                      <td className="p-3.5 sm:p-4 font-medium text-slate-700 dark:text-slate-300">{row.department}</td>
                      <td className="p-3.5 sm:p-4 text-center font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                        {row.totalReferrals}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {row.applied}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {row.inProcess}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {row.hired}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {rate}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center">
                        {row.qualityScore?.status === "Not_Available" ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            Not Available
                          </Badge>
                        ) : row.qualityScore?.status === "Limited_Data" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            Limited Data
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`font-bold ${
                              row.qualityScore?.rating === "Strong"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                                : row.qualityScore?.rating === "Good"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {row.qualityScore?.scoreText || rate} ({row.qualityScore?.rating || "Active"})
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                          View History <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} employees)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.currentPage <= 1}
                onClick={() => onPageChange(pagination.currentPage - 1)}
                className="h-8 text-xs cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => onPageChange(pagination.currentPage + 1)}
                className="h-8 text-xs cursor-pointer"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopReferrersTable;
