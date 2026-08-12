import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Users, Video, Link as LinkIcon, FileText, Bell, AlertCircle, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MeetingDetailsModal({ open, onOpenChange, meeting, onEdit, onDelete }) {
  const { user } = useUser();
  if (!meeting) return null;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming": return "bg-blue-100 text-blue-700";
      case "ongoing": return "bg-yellow-100 text-yellow-700";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const canEdit = user?.role?.name?.toLowerCase() === 'hr' || 
                  user?.role?.name?.toLowerCase() === 'admin' || 
                  user?.role?.name?.toLowerCase() === 'superadmin' || 
                  meeting.organizer_id?._id === (user?._id || user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex justify-between items-start pr-4">
            <DialogTitle className="text-xl font-bold">{meeting.title}</DialogTitle>
            <Badge variant="secondary" className={getStatusColor(meeting.status)}>
              {meeting.status}
            </Badge>
          </div>
          <div className="text-sm text-slate-500 font-medium">{meeting.meeting_type}</div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5">Date</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {meeting.date ? format(new Date(meeting.date), "EEEE, MMM d, yyyy") : "TBD"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5">Time</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {meeting.start_time} - {meeting.end_time}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {meeting.meeting_link && (
              <div className="flex items-start gap-3">
                <Video className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Meeting Link</div>
                  <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium flex items-center gap-1.5">
                    {meeting.meeting_link} <LinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {meeting.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Location</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{meeting.location}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-slate-400 mt-0.5" />
              <div className="w-full">
                <div className="text-xs text-slate-500 font-medium mb-2">Organizer & Participants</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border p-2 rounded-lg bg-white dark:bg-slate-950">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={meeting.organizer_id?.profilePicture} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(meeting.organizer_id?.firstName, meeting.organizer_id?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {meeting.organizer_id?.firstName} {meeting.organizer_id?.lastName} <span className="text-xs text-slate-400 ml-1">(Organizer)</span>
                    </span>
                  </div>
                  
                  {meeting.participants?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {meeting.participants.map(p => (
                        <div key={p._id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border px-2 py-1 rounded-md">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={p.profilePicture} />
                            <AvatarFallback className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {getInitials(p.firstName, p.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.firstName} {p.lastName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {meeting.agenda && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Agenda</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{meeting.agenda}</div>
                </div>
              </div>
            )}
            
            {meeting.description && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Description</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{meeting.description}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div>
            {canEdit && (
              <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => onDelete(meeting)}>
                <Trash2 className="w-4 h-4 mr-2" /> Cancel Meeting
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {meeting.meeting_link ? (
              <Button className="bg-primary text-white" onClick={() => window.open(meeting.meeting_link, '_blank')}>
                Join Meeting
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
