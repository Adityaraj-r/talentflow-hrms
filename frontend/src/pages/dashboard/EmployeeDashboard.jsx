import { useState } from "react";
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
  User 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import ApplyLeaveModal from "@/components/dashboard/ApplyLeaveModal"; 

const EmployeeDashboard = ({ stats = {}, isLoading = false }) => {
  const { user } = useAuth();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Employee Portal</h2>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-slate-800 dark:text-white">{user?.firstName || "Vishal"}</span>! Here's what's happening today.
        </p>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Leave Balance */}
        <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.leaveBalance || 12}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Days remaining this year</p>
          </CardContent>
        </Card>

        {/* Document Requests */}
        <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Document Requests</CardTitle>
            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.documentsRequested || 5}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending approval</p>
          </CardContent>
        </Card>

        {/* Payroll Status */}
        <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Payroll Status</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Processed</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For January 2026</p>
          </CardContent>
        </Card>

        {/* Tasks Assigned */}
        <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Tasks Assigned</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">8</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active this month</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. ACTION BAR */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-[#1e1b4b]/50 border border-blue-100 dark:border-blue-800/50 p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
            {/* Main Action Button */}
            <Button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium border-none px-6 shadow-md"
            >
                <Calendar className="mr-2 h-4 w-4" /> Apply for Leave
            </Button>
            
            {/* Secondary Actions - Adaptive Outline Buttons */}
            <Button variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent">
                <FileText className="mr-2 h-4 w-4" /> Request Document
            </Button>
            
            <Button variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent">
                <Clock className="mr-2 h-4 w-4" /> View Attendance
            </Button>
            
            <Button variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white bg-transparent">
                <Download className="mr-2 h-4 w-4" /> Download Payslip
            </Button>
        </div>
      </div>

      {/* 4. TABS SECTION */}
      <Tabs defaultValue="leave" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800">
            <TabsList className="bg-transparent p-0 h-auto space-x-6">
                {["profile", "leave", "documents", "payroll"].map((tab) => (
                    <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className="capitalize bg-transparent border-b-2 border-transparent 
                        data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 
                        data-[state=active]:bg-transparent 
                        data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 
                        text-slate-500 dark:text-slate-400 
                        rounded-none px-2 py-3 transition-all hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        {tab === "leave" ? "Leave Balance" : tab === "profile" ? "My Profile" : tab}
                    </TabsTrigger>
                ))}
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

        {/* Other tabs placeholders */}
        <TabsContent value="documents">
            <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">Document history will appear here.</p>
            </Card>
        </TabsContent>
        <TabsContent value="payroll">
             <Card className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">Payroll details will appear here.</p>
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