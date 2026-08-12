import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, Check, X, Briefcase, BarChart, ArrowUpRight, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ManagerDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const teamPerformance = [
    { name: "John Smith", performance: 85, tasksCompleted: 12, tasksPending: 3 },
    { name: "Emily Davis", performance: 92, tasksCompleted: 15, tasksPending: 1 },
    { name: "Michael Chen", performance: 78, tasksCompleted: 10, tasksPending: 5 },
    { name: "Sarah Johnson", performance: 88, tasksCompleted: 13, tasksPending: 2 },
  ];

  const pendingApprovals = [
    {
      id: 1,
      type: "Leave Request",
      requestedBy: "John Smith",
      date: "2025-04-20",
      status: "Pending",
      icon: <Calendar className="h-4 w-4 text-green-600" />,
    },
    {
      id: 2,
      type: "Overtime Request",
      requestedBy: "Emily Davis",
      date: "2025-04-19",
      status: "Pending",
      icon: <Briefcase className="h-4 w-4 text-blue-600" />,
    },
    {
      id: 3,
      type: "Expense Claim",
      requestedBy: "Michael Chen",
      date: "2025-04-18",
      status: "Pending",
      icon: <Briefcase className="h-4 w-4 text-yellow-600" />,
    },
  ];

  const smartAlerts = [
    {
      id: 1,
      type: 'approval',
      title: 'Approvals Pending',
      desc: `${stats?.pendingApprovals || 3} requests from your team await review.`,
      icon: <Calendar className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-100'
    },
    {
      id: 2,
      type: 'performance',
      title: 'Performance Cycle',
      desc: 'Quarterly appraisals are due in 15 days.',
      icon: <BarChart className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-100'
    },
    {
      id: 3,
      type: 'task',
      title: 'Overdue Tasks',
      desc: '4 tasks assigned to your team are overdue.',
      icon: <CheckCircle className="w-4 h-4 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
      iconBg: 'bg-rose-100'
    }
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50/50 flex items-center justify-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
          {getGreeting()}, {user?.firstName || "Manager"}
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Here's a quick overview of your team's performance and pending tasks.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div 
              onClick={() => navigate('/all-employees')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">My Team</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  View direct reports and manage team availability.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2 */}
            <div 
              onClick={() => {}} // Could link to specific approvals page
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Approve Requests</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Review leaves, claims, and overtime submissions.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => navigate('/pms/appraisal-cycles')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <BarChart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Appraisals</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Evaluate team goals and submit quarterly reviews.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* TEAM OVERVIEW STATS */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Department Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Key metrics for your direct reports</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.employees || 12}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Team Size</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-500 mb-2">{stats.pendingApprovals || 3}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Approvals</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-green-600 dark:text-green-500 mb-2">52</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tasks Completed</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-500 mb-2">87%</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Performance</span>
              </div>
            </div>
          </div>

          {/* PERFORMANCE & PENDING ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Team Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Team Performance</h3>
              </div>
              <div className="space-y-4">
                  {teamPerformance.map((member) => (
                      <div key={member.name} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center justify-between">
                             <p className="text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                             <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{member.performance}%</span>
                          </div>
                          <Progress value={member.performance} className="h-1.5" />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                             <span>{member.tasksCompleted} Completed</span>
                             <span>{member.tasksPending} Pending</span>
                          </div>
                      </div>
                  ))}
              </div>
            </div>

            {/* Pending Approvals List */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pending Approvals</h3>
              </div>
              
              {pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                    {pendingApprovals.map(approval => (
                      <div key={approval.id} className="flex flex-col gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-100 dark:border-slate-600">
                                    {approval.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{approval.type}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{approval.requestedBy} • {approval.date}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button className="flex-1 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-semibold border border-transparent hover:border-green-200 transition-colors">
                               Approve
                             </button>
                             <button className="flex-1 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold border border-transparent hover:border-rose-200 transition-colors">
                               Reject
                             </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-12 h-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                        <Check className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">No pending requests to approve.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* SIDEBAR - SMART ALERTS */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Management Alerts</h3>
            
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
