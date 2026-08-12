import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, Filter, Loader2, Calendar as CalendarIcon, List as ListIcon, CalendarDays, CalendarRange } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, isAfter, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import meetingService from "@/services/meetingService";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

// Components
import CreateMeetingModal from "./CreateMeetingModal";
import MeetingDetailsModal from "./MeetingDetailsModal";
import WeekView from "./WeekView";
import DayView from "./DayView";
import MonthView from "./MonthView";
import ListView from "./ListView";

export default function Meetings() {
  const { user } = useUser();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week"); // day, week, month, list
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await meetingService.getMeetings();
      setMeetings(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const getHeaderDateText = () => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "day") return format(currentDate, "MMMM d, yyyy");
    return "";
  };

  const upcomingMeetings = meetings
    .filter(m => new Date(`${m.date}T${m.start_time}`) > new Date() && m.status !== 'Cancelled')
    .sort((a, b) => new Date(`${a.date}T${a.start_time}`) - new Date(`${b.date}T${b.start_time}`))
    .slice(0, 5);

  const handleDeleteMeeting = async (meeting) => {
    if (window.confirm(`Are you sure you want to cancel "${meeting.title}"?`)) {
      try {
        await meetingService.deleteMeeting(meeting._id);
        toast.success("Meeting cancelled successfully");
        setSelectedMeeting(null);
        fetchMeetings();
      } catch (error) {
        toast.error("Failed to cancel meeting");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">Meetings</h2>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Your schedule and upcoming meetings</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm">
            
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setView("day")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "day" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" /> Day
              </button>
              <button 
                onClick={() => setView("week")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "week" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Week
              </button>
              <button 
                onClick={() => setView("month")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "month" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                <CalendarRange className="w-3.5 h-3.5" /> Month
              </button>
              <button 
                onClick={() => setView("list")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                <ListIcon className="w-3.5 h-3.5" /> List
              </button>
            </div>

            {/* Navigation / Search */}
            {view !== "list" ? (
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold min-w-[140px] text-center">{getHeaderDateText()}</span>
                  <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search meetings..." className="pl-9 h-9 w-[200px]" />
                </div>
                <Button variant="outline" size="sm" className="h-9"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
              </div>
            )}
          </div>

          {/* Views */}
          {loading ? (
            <div className="h-[400px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {view === "week" && <WeekView currentDate={currentDate} meetings={meetings} onMeetingClick={setSelectedMeeting} />}
              {view === "day" && <DayView currentDate={currentDate} meetings={meetings} onMeetingClick={setSelectedMeeting} />}
              {view === "month" && <MonthView currentDate={currentDate} meetings={meetings} onMeetingClick={setSelectedMeeting} />}
              {view === "list" && <ListView meetings={meetings} onMeetingClick={setSelectedMeeting} onDelete={handleDeleteMeeting} />}
            </>
          )}
        </div>

        {/* Right Sidebar: Upcoming Meetings */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              Upcoming Meetings
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{upcomingMeetings.length}</span>
            </h3>
            
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No upcoming meetings.</p>
                </div>
              ) : (
                upcomingMeetings.map(meeting => (
                  <div 
                    key={meeting._id} 
                    onClick={() => setSelectedMeeting(meeting)}
                    className="group border border-slate-100 dark:border-slate-800 rounded-lg p-3 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                  >
                    <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                      {meeting.title}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-500 font-medium">
                          {isSameDay(new Date(meeting.date), new Date()) ? "Today" : format(new Date(meeting.date), "MMM d")} · {meeting.start_time}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {meeting.organizer_id?.firstName} {meeting.organizer_id?.lastName}
                        </div>
                      </div>
                      {meeting.meeting_link && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-7 text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(meeting.meeting_link, '_blank');
                          }}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>

      {/* Modals */}
      <CreateMeetingModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchMeetings} 
      />
      
      <MeetingDetailsModal 
        open={!!selectedMeeting} 
        onOpenChange={(open) => !open && setSelectedMeeting(null)} 
        meeting={selectedMeeting}
        onDelete={handleDeleteMeeting}
      />
      
    </div>
  );
}
