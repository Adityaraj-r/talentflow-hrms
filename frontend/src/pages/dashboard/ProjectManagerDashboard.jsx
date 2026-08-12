import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Target
} from "lucide-react";

const ProjectManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const stats = [
    { title: "Total Projects", value: "24", icon: <ClipboardList className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { title: "Team Members", value: "156", icon: <Users className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { title: "Pending Tasks", value: "42", icon: <Clock className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { title: "Critical Issues", value: "3", icon: <AlertTriangle className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" }
  ];

  const recentProjects = [
    { name: "Pipeline Expansion - Phase 2", progress: 75, status: "On Track", team: 12, color: "bg-emerald-500" },
    { name: "Refinery Safety Audit", progress: 45, status: "In Progress", team: 8, color: "bg-blue-500" },
    { name: "Equipment Modernization", progress: 90, status: "Near Complete", team: 15, color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
            {getGreeting()}, {user?.firstName || "Project Manager"}
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Overview of projects, tasks, and team performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm rounded-[12px]">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Task Board</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Manage tasks, sprints, and assignments.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Project Planning</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Create roadmaps and allocate resources.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              className="bg-[#f3f0ff] dark:bg-purple-900/20 rounded-[20px] p-6 cursor-pointer hover:shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 text-purple-700 dark:text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Team Performance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Review velocity and team metrics.
                </p>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OVERVIEW STATS */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Operations Overview</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`rounded-[16px] p-5 border ${stat.bg} flex flex-col justify-center items-center text-center cursor-pointer transition-transform hover:-translate-y-1`}>
                        <div className={`mb-3 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</span>
                    </div>
                ))}
            </div>
          </div>

          {/* RECENT PROJECTS */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Projects</h3>
                <Button variant="link" className="text-purple-600 p-0 h-auto font-medium">View All</Button>
            </div>
            
            <div className="space-y-6">
              {recentProjects.map((project, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{project.name}</h4>
                      <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200">
                        {project.team} members
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`${project.color} h-full rounded-full transition-all`} 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-500">{project.status}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <div className="xl:w-[320px] shrink-0 h-full">
          <div className="sticky top-[88px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Action Items</h3>
            
            <div className="space-y-4">
                <div className="p-4 rounded-[16px] border border-rose-100 bg-rose-50 cursor-pointer hover:shadow-sm transition-all group">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-900">Safety Incidents</h4>
                            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                                Review 2 pending incident reports from site alpha.
                            </p>
                            <span className="text-rose-600 text-xs font-semibold flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Review Reports <ArrowUpRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-[16px] border border-amber-100 bg-amber-50 cursor-pointer hover:shadow-sm transition-all group">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-900">Timesheet Approvals</h4>
                            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                                14 timesheets awaiting manager approval this week.
                            </p>
                            <span className="text-amber-600 text-xs font-semibold flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Approve Now <ArrowUpRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-[16px] border border-blue-100 bg-blue-50 cursor-pointer hover:shadow-sm transition-all group">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-900">Milestone Due</h4>
                            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                                Phase 2 delivery is scheduled for this Friday.
                            </p>
                            <span className="text-blue-600 text-xs font-semibold flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                View Milestone <ArrowUpRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
