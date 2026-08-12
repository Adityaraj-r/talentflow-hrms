import { isSameDay, format, parse } from "date-fns";

export default function DayView({ currentDate, meetings, onMeetingClick }) {
  const dayMeetings = meetings
    .filter(m => isSameDay(new Date(m.date), currentDate))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (dayMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-sm font-medium">No meetings scheduled for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto py-4">
      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 md:ml-4 space-y-8 pb-4">
        {dayMeetings.map((meeting) => (
          <div key={meeting._id} className="relative pl-6 md:pl-8 group cursor-pointer" onClick={() => onMeetingClick(meeting)}>
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary shadow-sm" />
            
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
              <div className="w-24 shrink-0 pt-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{meeting.start_time}</div>
                <div className="text-xs text-slate-500 font-medium">{meeting.end_time}</div>
              </div>
              
              <div className="flex-1 bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="text-base font-bold text-primary">{meeting.title}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md shrink-0">
                    {meeting.meeting_type}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                      {meeting.organizer_id?.firstName?.[0] || 'O'}
                    </span>
                    {meeting.organizer_id?.firstName} {meeting.organizer_id?.lastName}
                  </div>
                  
                  {meeting.participants?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="ml-1">{meeting.participants.length} Participant(s)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
