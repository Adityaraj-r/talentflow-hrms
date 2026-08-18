import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  ListTodo
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ApplyLeaveModal from "@/components/dashboard/ApplyLeaveModal";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";

// eslint-disable-next-line no-unused-vars
const EmployeeDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Mock data for graphs & lists (simulating real HRMS data as requested)
  const attendanceData = [
    { name: 'Apr', present: 20 },
    { name: 'May', present: 22 },
    { name: 'Jun', present: 21 },
    { name: 'Jul', present: 22 },
    { name: 'Aug', present: 18 },
  ];

  const taskWorkload = [
    { name: 'To do', value: 0, color: '#64748b' },
    { name: 'Acknowledged', value: 0, color: '#10b981' },
    { name: 'In progress', value: 0, color: '#f59e0b' },
    { name: 'In review', value: 0, color: '#0ea5e9' },
    { name: 'Done', value: 2, color: '#8b5cf6' },
  ];
  
  const totalTasks = taskWorkload.reduce((sum, item) => sum + item.value, 0);

  const pendingTasks = []; // Setting this to empty to match screenshot empty state

  const smartAlerts = [
    {
      id: 1,
      type: 'holiday',
      title: 'Upcoming Holiday',
      desc: 'Independence Day on 15-08-2026. Office closed.',
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100'
    },
    {
      id: 2,
      type: 'task',
      title: 'New task assigned',
      desc: 'Arya Sharma assigned you "Create Database Queries".',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100'
    },
    {
      id: 3,
      type: 'task',
      title: 'New task assigned',
      desc: 'Arya Sharma assigned you "Design database Schema".',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
          {getGreeting()}, {user?.firstName || "Bhavna"}
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Here's a quick overview of your workday and pending activities.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div 
              onClick={() => setIsLeaveModalOpen(true)}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Apply Leave</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Request casual, sick, or planned leave in just a few clicks.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2 */}
            <div 
              onClick={() => navigate('/dashboard/employee/attendance')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Mark attendance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Check in for today and keep your attendance record up to date.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => navigate('/dashboard/employee/tasks')}
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <ListTodo className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">View tasks</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  See assigned work, update status, and track progress.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* LEAVE BALANCE SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Leave balance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">2026 entitlement · Standard policy</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats?.leaveBalance || 30}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Leaves</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats?.leaveBalance || 30}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Available</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">0</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Used</span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100/50 dark:border-slate-700/50">
                <span className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stats?.leaveRequests || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Approval</span>
              </div>
            </div>
          </div>

          {/* PENDING TASKS & APPLICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[220px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pending Tasks</h3>
                <button onClick={() => navigate('/dashboard/employee/tasks')} className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View All</button>
              </div>
              
              {pendingTasks.length > 0 ? (
                <div className="space-y-4 mt-auto mb-auto">
                    {/* Compact empty state matching screenshot since the actual tasks table would be too large here, the screenshot shows empty state usually or 1 task */}
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 opacity-60">
                        <div className="w-10 h-10 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-3">
                            <ListTodo className="w-4 h-4" />
                        </div>
                        <p className="text-sm">No open tasks assigned to you.</p>
                    </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                        <ListTodo className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">No open tasks assigned to you.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[220px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pending Applications</h3>
                <button onClick={() => navigate('/attendance/my-leaves')} className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View All</button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-[13px] text-slate-500 dark:text-slate-400">No leave applications waiting for approval.</p>
              </div>
            </div>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Attendance Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Attendance Summary</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Last 5 Months Performance</p>
              
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8' }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8' }} 
                      ticks={[0, 6, 12, 18, 24]}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="present" fill="#8b5cf6" radius={[4, 4, 4, 4]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-2">
                <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                  50% Attendance Rate
                </div>
                <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                  02/04 Days Present
                </div>
                <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                  02 Days Absent
                </div>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => navigate('/dashboard/employee/attendance')} className="text-[13px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View all</button>
              </div>
            </div>

            {/* Task Workload */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Task Workload</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Your assigned tasks by status</p>
              
              <div className="flex items-center justify-between">
                  <div className="relative w-[150px] h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskWorkload}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {taskWorkload.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[28px] font-bold text-slate-900 dark:text-white">{totalTasks}</span>
                        <span className="text-[13px] text-slate-500 font-medium">tasks</span>
                    </div>
                  </div>

                  <div className="flex-1 pl-8 space-y-2.5">
                     {taskWorkload.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-900 dark:text-white w-2 text-right">{item.value}</span>
                                <span className="text-slate-400 w-8 text-right font-medium">{totalTasks ? Math.round((item.value / totalTasks) * 100) : 0}%</span>
                            </div>
                        </div>
                     ))}
                  </div>
              </div>

              <div className="flex items-center gap-6 mt-6 ml-2">
                 <div className="text-[13px] text-slate-500 font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">0 open</div>
                 <div className="text-[13px] text-slate-500 font-medium">100% complete</div>
              </div>

              <div className="mt-4 text-center">
                <button onClick={() => navigate('/dashboard/employee/tasks')} className="text-[13px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer">View all</button>
              </div>
            </div>

          </div>

        </div>

        {/* SIDEBAR - SMART ALERTS */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Smart Alerts</h3>
            
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

      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSuccess={() => {}}
      />
    </div>
  );
};

export default EmployeeDashboard;
