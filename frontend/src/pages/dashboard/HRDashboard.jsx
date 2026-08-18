import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  FileCheck, 
  ArrowUpRight,
  Briefcase
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ApplyLeaveModal from "@/components/dashboard/ApplyLeaveModal";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

const HRDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const roleStr = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();
  const isOfficer = roleStr.includes('OFFICER');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Mock data for graphs & lists (simulating HRMS data)
  const recruitmentData = [
    { name: 'Applied', value: 42, color: '#64748b' },
    { name: 'Screening', value: 28, color: '#0ea5e9' },
    { name: 'Interview', value: 15, color: '#f59e0b' },
    { name: 'Offer', value: 8, color: '#8b5cf6' },
    { name: 'Hired', value: 5, color: '#10b981' },
  ];
  
  const totalCandidates = recruitmentData[0].value;

  const hrSmartAlerts = [
    {
      id: 1,
      type: 'leave',
      title: 'Leave Approvals Pending',
      desc: `${stats?.leaveRequests || 14} employee leave requests require your review.`,
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100'
    },
    {
      id: 2,
      type: 'document',
      title: 'Document Requests',
      desc: `${stats?.documentsRequested || 8} new document requests from employees.`,
      icon: <FileCheck className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100'
    },
    {
      id: 3,
      type: 'recruitment',
      title: 'Open Positions',
      desc: `${stats?.openPositions || 5} active job postings need attention.`,
      icon: <Briefcase className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100'
    }
  ];

  const recentLeaves = [
    { id: 1, name: "John Doe", type: "Annual Leave", status: "Pending" },
    { id: 2, name: "Alice Johnson", type: "Sick Leave", status: "Pending" },
    { id: 3, name: "Bob Williams", type: "Compassionate Leave", status: "Pending" }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
          {getGreeting()}, {user?.firstName || "HR Manager"}
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Here's a quick overview of company operations and pending HR activities.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div 
              onClick={() => navigate('/attendance/leave-management')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Review Leaves</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Manage and approve employee leave applications.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2 */}
            <div 
              onClick={() => navigate(isOfficer ? '/role/hr_officer/document-requests' : '/role/hr_manager/document-requests')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Process Documents</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Handle letters, salary slips, and other requests.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => navigate('/all-employees')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Manage Employees</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  View staff directory, records, and overall headcount.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* HR OVERVIEW STATS */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">HR Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Key operational metrics at a glance</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.employees || 128}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Employees</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.openPositions || 5}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Open Positions</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.leaveRequests || 14}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Leaves</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats.documentsRequested || 8}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Docs</span>
              </div>
            </div>
          </div>

          {/* PIPELINE & PENDING ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recruitment Pipeline */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recruitment Pipeline</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Current candidate status</p>
              
              <div className="flex items-center justify-between">
                  <div className="relative w-[150px] h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={recruitmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {recruitmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[28px] font-bold text-slate-900 dark:text-white">{totalCandidates}</span>
                        <span className="text-[13px] text-slate-500 font-medium">total</span>
                    </div>
                  </div>

                  <div className="flex-1 pl-8 space-y-2.5">
                     {recruitmentData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-900 dark:text-white w-4 text-right">{item.value}</span>
                            </div>
                        </div>
                     ))}
                  </div>
              </div>

              <div className="mt-6 text-center">
                <button onClick={() => navigate('/recruitment/analytics')} className="text-[13px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View recruitment</button>
              </div>
            </div>

            {/* Recent Pending Leaves */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[220px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Leave Requests</h3>
                <button onClick={() => navigate('/attendance/leave-management')} className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View All</button>
              </div>
              
              {recentLeaves.length > 0 ? (
                <div className="space-y-4 mt-auto mb-auto">
                    {recentLeaves.map(leave => (
                      <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <div>
                           <p className="text-sm font-semibold text-slate-900 dark:text-white">{leave.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{leave.type}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {leave.status}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                        <Calendar className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">No pending leave requests.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* SIDEBAR - SMART ALERTS */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Smart Alerts</h3>
            
            <div className="space-y-4">
              {hrSmartAlerts.length > 0 ? (
                hrSmartAlerts.map(alert => (
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

      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSuccess={() => {}}
      />
    </div>
  );
};

export default HRDashboard;
