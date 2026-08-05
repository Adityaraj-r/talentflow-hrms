import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Download, 
  Briefcase, 
  Building2, 
  Mail, 
  User,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from "@/components/dashboard/StatsCard";
import ApplyLeaveModal from "@/components/dashboard/ApplyLeaveModal"; 

const EmployeeDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [documentRequestsCount, setDocumentRequestsCount] = useState(stats?.documentsRequested || 5);

  const roleStr = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();
  const isHr = roleStr.includes('HR');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Hardcoded balances for UI demo
  const leaveBalances = [
    { type: "Annual", used: 5, total: 20, color: "bg-blue-500" },
    { type: "Sick", used: 2, total: 10, color: "bg-emerald-500" },
    { type: "Casual", used: 0, total: 5, color: "bg-purple-500" },
  ];

  const handleLeaveSuccess = () => {
    console.log("Leave applied successfully - Refreshing data...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 space-y-8 font-sans transition-colors duration-300">
      
      {/* 1. HEADER SECTION & DATA FRESHNESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Employee Portal
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, <span className="font-bold">{user?.firstName || "Malhar"}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back. Here's today's overview.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200 font-medium">Just now</strong></span>
        </div>
      </div>

      {/* 2. STATS ROW (KPI Cards matching Attendance Analytics design) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leave Balance"
          value={stats?.leaveBalance || 12}
          subtitle="35 total allocated"
          icon={<Calendar className="h-5 w-5" />}
          variant="blue"
          isLoading={isLoading}
          onClick={() => navigate('/attendance/my-leaves')}
        />
        <StatsCard
          title="Document Requests"
          value={documentRequestsCount}
          subtitle="Avg processing: 1.4 days"
          icon={<FileText className="h-5 w-5" />}
          variant="purple"
          isLoading={isLoading}
          onClick={() => navigate(isHr ? (roleStr.includes('OFFICER') ? '/role/hr_officer/document-requests' : '/role/hr_manager/document-requests') : '/role/employee/document-requests')}
        />
        <StatsCard
          title="Payroll Status"
          value="Processed"
          subtitle="Disbursed for Jan 2026"
          icon={<DollarSign className="h-5 w-5" />}
          variant="green"
          isLoading={isLoading}
          onClick={() => navigate('/payroll/salary-slip')}
        />
        <StatsCard
          title="Tasks Assigned"
          value="8"
          subtitle="3 pending review"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="orange"
          isLoading={isLoading}
          onClick={() => navigate('/dashboard/employee/tasks')}
        />
      </div>

      {/* 3. ACTION BAR */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-[#1e1b4b]/50 border border-blue-100 dark:border-blue-800/50 p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
            {/* Main Action Button */}
            <Button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium border-none px-6 shadow-md cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Calendar className="mr-2 h-4 w-4" /> Apply for Leave
            </Button>
            
            {/* Secondary Actions - Adaptive Role-Based Buttons */}
            {isHr ? (
              <Button 
                  onClick={() => navigate(roleStr.includes('OFFICER') ? '/role/hr_officer/document-requests' : '/role/hr_manager/document-requests')}
                  variant="outline" 
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
              >
                  <FileCheck className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" /> Pending Approvals
              </Button>
            ) : (
              <Button 
                  onClick={() => navigate('/role/employee/document-requests')}
                  variant="outline" 
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
              >
                  <FileText className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" /> Request Document
              </Button>
            )}
            
            <Button 
                onClick={() => navigate('/dashboard/employee/attendance')}
                variant="outline" 
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Clock className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" /> View Attendance
            </Button>
            
            <Button 
                onClick={() => navigate('/payroll/salary-slip')}
                variant="outline" 
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
                <Download className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Download Payslip
            </Button>
        </div>
      </div>

      {/* 4. TABS SECTION WITH DYNAMIC COUNTERS & ACTIVE HIGHLIGHT */}
      <Tabs defaultValue="leave" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800">
            <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl gap-1 h-auto">
                <TabsTrigger 
                    value="profile" 
                    className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
                >
                    My Profile
                </TabsTrigger>
                <TabsTrigger 
                    value="leave" 
                    className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
                >
                    Leave Balance ({stats?.leaveBalance || 12})
                </TabsTrigger>
                <TabsTrigger 
                    value="documents" 
                    className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
                >
                    Documents ({documentRequestsCount})
                </TabsTrigger>
                <TabsTrigger 
                    value="payroll" 
                    className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-slate-900 dark:hover:text-slate-200"
                >
                    Payroll
                </TabsTrigger>
            </TabsList>
        </div>

        {/* --- LEAVE TAB CONTENT --- */}
        <TabsContent value="leave" className="space-y-6">
            <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Leave Balance
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Your available leave balances and requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Summary Stats */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                       <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">35</div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-1">Total Leave Days</div>
                       </div>
                       <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">7</div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-1">Days Used</div>
                       </div>
                       <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                            <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">3</div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-1">Pending Requests</div>
                       </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-6">
                        {leaveBalances.map((leave) => (
                            <div key={leave.type} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">{leave.type} Leave</span>
                                    <span className="text-slate-500 dark:text-slate-400">{leave.total - leave.used} / {leave.total} days left</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${leave.color}`} 
                                        style={{ width: `${((leave.total - leave.used) / leave.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- PROFILE TAB CONTENT --- */}
        <TabsContent value="profile">
            <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">My Profile</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Your personal and employment details</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {user?.firstName} {user?.lastName}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Employee ID</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" /> {user?.employeeId || "EMP-12345"}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Department</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" /> {user?.department || "Information Technology"}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {user?.email}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- DOCUMENTS TAB CONTENT (Polished Empty State) --- */}
        <TabsContent value="documents">
            <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-full text-purple-600 dark:text-purple-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">No document history available</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Your requested documents and file history will appear here once submitted and processed.
                  </p>
                </div>
            </Card>
        </TabsContent>

        {/* --- PAYROLL TAB CONTENT (Polished Empty State) --- */}
        <TabsContent value="payroll">
             <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">No payroll records available</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Payroll information will appear once payroll for the current period has been processed.
                  </p>
                </div>
            </Card>
        </TabsContent>

      </Tabs>

      {/* MODAL */}
      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSuccess={handleLeaveSuccess}
      />

    </div>
  );
};

export default EmployeeDashboard;