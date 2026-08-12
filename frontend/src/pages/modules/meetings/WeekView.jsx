import { useState } from "react";
import { format, isSameDay, addDays, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

export default function WeekView({ currentDate, meetings, onMeetingClick }) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, i) => (
          <div key={i} className="py-3 text-center border-r last:border-r-0">
            <div className="text-xs font-semibold text-slate-500 uppercase">{format(day, "EEE")}</div>
            <div className={cn(
              "text-lg font-bold mt-1 w-8 h-8 flex items-center justify-center mx-auto rounded-full",
              isSameDay(day, new Date()) ? "bg-primary text-white" : "text-slate-900 dark:text-slate-100"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 h-[400px] overflow-y-auto">
        {weekDays.map((day, i) => {
          const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day)).sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          return (
            <div key={i} className="border-r last:border-r-0 p-2 space-y-2 min-h-full">
              {dayMeetings.map(meeting => (
                <div 
                  key={meeting._id}
                  onClick={() => onMeetingClick(meeting)}
                  className="bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md p-2 cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-primary truncate" title={meeting.title}>
                    {meeting.title}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mt-1">
                    {meeting.start_time} - {meeting.end_time}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">{meeting.meeting_type}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
