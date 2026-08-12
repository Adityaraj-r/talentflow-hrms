import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function MonthView({ currentDate, meetings, onMeetingClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days to display
  const startDate = monthStart;
  const endDate = monthEnd;
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Add empty slots for days before the 1st of the month
  const startDayOfWeek = startDate.getDay(); // 0 is Sunday
  // Adjust to make Monday first day of week (1 is Monday, 0 is Sunday -> 7)
  const emptyDaysAtStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const blanks = Array.from({ length: emptyDaysAtStart }).map((_, i) => null);

  const allCells = [...blanks, ...days];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-3 text-center border-r last:border-r-0">
            <div className="text-xs font-semibold text-slate-500 uppercase">{day}</div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {allCells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[100px] border-r border-b bg-slate-50/50 dark:bg-slate-900/50" />;
          }
          
          const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day)).sort((a, b) => a.start_time.localeCompare(b.start_time));
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="min-h-[120px] border-r border-b p-1 flex flex-col">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary text-white" : "text-slate-700 dark:text-slate-300"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                {dayMeetings.map(meeting => (
                  <div 
                    key={meeting._id}
                    onClick={() => onMeetingClick(meeting)}
                    className="bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-1 rounded-[4px] text-[10px] font-semibold cursor-pointer truncate transition-colors"
                    title={meeting.title}
                  >
                    {meeting.start_time} - {meeting.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
