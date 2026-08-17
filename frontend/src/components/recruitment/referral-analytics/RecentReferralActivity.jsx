import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

const getStatusBadge = (status) => {
  switch (status) {
    case "Successful":
    case "Hired":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">Hired</Badge>;
    case "Applied":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">Applied</Badge>;
    case "In Process":
    case "Selected":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">In Interview</Badge>;
    case "Rejected":
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">Rejected</Badge>;
    case "Pending_24h":
    case "Pending_48h":
    case "Invited":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">Pending</Badge>;
    default:
      return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400">{status || "Submitted"}</Badge>;
  }
};

export const RecentReferralActivity = ({
  activities = [],
  onViewTimeline,
  loading = false,
}) => {
  return (
    <Card className="group border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Clock className="h-4 w-4" />
            </div>
            Recent Referral Activity
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live stream of candidate referrals, SLA timelines, and current hiring stages
          </CardDescription>
        </div>
        {activities.length > 0 && (
          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
            {activities.length} Total Records
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Scrollable Container capped at 7 visible rows (~400px height) */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-3.5 sm:p-4">Candidate</th>
                <th className="p-3.5 sm:p-4">Referred By</th>
                <th className="p-3.5 sm:p-4">Position</th>
                <th className="p-3.5 sm:p-4">Department</th>
                <th className="p-3.5 sm:p-4">Date</th>
                <th className="p-3.5 sm:p-4">Current Stage</th>
                <th className="p-3.5 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading recent referral activity...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No recent referral activity recorded.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-slate-100">
                      {item.candidateName}
                      <div className="text-[11px] font-normal text-slate-500">{item.candidateEmail}</div>
                    </td>
                    <td className="p-3.5 sm:p-4 font-medium text-slate-800 dark:text-slate-200">
                      {item.referredBy || "Employee"}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-800 dark:text-slate-200 font-medium">
                      {item.jobTitle || "Job Position"}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-400">
                      {item.department || "General"}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500 dark:text-slate-400">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {getStatusBadge(item.slaStatus || item.status)}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs cursor-pointer"
                        onClick={() => onViewTimeline(item._id)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Timeline
                      </Button>
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

export default RecentReferralActivity;
