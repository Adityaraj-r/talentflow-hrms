import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, Edit, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function ListView({ meetings, onMeetingClick, onEdit, onDelete }) {
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalItems = meetings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedMeetings = meetings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming": return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "ongoing": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
      case "completed": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      case "cancelled": return "bg-red-100 text-red-700 hover:bg-red-200";
      default: return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border rounded-xl flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-sm font-medium">No meetings found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead>Meeting</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMeetings.map((meeting) => {
            const canEdit = user?.role?.name?.toLowerCase() === 'hr' || 
                            user?.role?.name?.toLowerCase() === 'admin' || 
                            user?.role?.name?.toLowerCase() === 'superadmin' || 
                            meeting.organizer_id?._id === (user?._id || user?.id);

            return (
              <TableRow key={meeting._id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <TableCell className="font-medium" onClick={() => onMeetingClick(meeting)}>
                  <div className="text-sm text-slate-900 dark:text-slate-100">{meeting.title}</div>
                  {meeting.department && <div className="text-[10px] text-slate-400">{meeting.department}</div>}
                </TableCell>
                <TableCell onClick={() => onMeetingClick(meeting)}>
                  {meeting.date ? format(new Date(meeting.date), "MMM d, yyyy") : "TBD"}
                </TableCell>
                <TableCell onClick={() => onMeetingClick(meeting)}>
                  {meeting.start_time} - {meeting.end_time}
                </TableCell>
                <TableCell onClick={() => onMeetingClick(meeting)}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                      {meeting.organizer_id?.firstName?.[0] || 'O'}
                    </span>
                    <span className="text-sm">{meeting.organizer_id?.firstName}</span>
                  </div>
                </TableCell>
                <TableCell onClick={() => onMeetingClick(meeting)}>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    {meeting.meeting_type}
                  </span>
                </TableCell>
                <TableCell onClick={() => onMeetingClick(meeting)}>
                  <Badge variant="secondary" className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => onMeetingClick(meeting)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => onDelete(meeting)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {totalItems > 0 && (
        <div className="p-4 border-t">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
