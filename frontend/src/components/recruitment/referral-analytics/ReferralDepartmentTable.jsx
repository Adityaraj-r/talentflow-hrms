import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ReferralDepartmentTable = ({ data = [], loading = false }) => {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Department Referral Performance
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Breakdown of referral volume, candidate evaluations, hires, and conversion rates by department
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 sm:p-4">Department</th>
                <th className="p-3.5 sm:p-4 text-center">Referrals</th>
                <th className="p-3.5 sm:p-4 text-center">Hires</th>
                <th className="p-3.5 sm:p-4 text-center">Hire Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading department referral performance...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No department referral activity recorded.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-slate-100">
                      {row.department}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {row.referrals}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {row.hired}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center font-bold">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40">
                        {row.hireRate || "0.0%"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDepartmentTable;
