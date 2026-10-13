import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import meetingService from "@/services/meetingService";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

const MEETING_TYPES = [
  "Team Meeting",
  "One-on-One",
  "Interview",
  "Training",
  "HR Meeting",
  "Client Meeting",
  "Other"
];

export default function CreateMeetingModal({ open, onOpenChange, onSuccess }) {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meeting_type: "",
    date: new Date(),
    start_time: "09:00",
    end_time: "10:00",
    participants: [],
    department: "",
    location: "",
    meeting_link: "",
    agenda: "",
    reminder: "15 minutes before"
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await apiClient.get("/api/users");
      // Fallback if users endpoint doesn't return the expected format
      const data = res.data?.data || res.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees", error);
      toast.error("Failed to load participants list");
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (userId) => {
    setFormData((prev) => {
      const current = prev.participants;
      if (current.includes(userId)) {
        return { ...prev, participants: current.filter(id => id !== userId) };
      }
      return { ...prev, participants: [...current, userId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.meeting_type || !formData.date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      setLoading(true);
      const payload = {
        ...formData,
        date: format(formData.date, "yyyy-MM-dd"),
        organizer_id: user?._id || user?.id
      };
      
      await meetingService.createMeeting(payload);
      toast.success("Meeting created successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "", description: "", meeting_type: "", date: new Date(),
        start_time: "09:00", end_time: "10:00", participants: [],
        department: "", location: "", meeting_link: "", agenda: "", reminder: "15 minutes before"
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Meeting Title <span className="text-red-500">*</span></Label>
              <Input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Weekly Team Standup"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Meeting Type <span className="text-red-500">*</span></Label>
              <Select value={formData.meeting_type} onValueChange={(v) => handleSelectChange('meeting_type', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(d) => handleSelectChange('date', d || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Start Time <span className="text-red-500">*</span></Label>
              <Input 
                type="time" 
                name="start_time" 
                value={formData.start_time} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>End Time <span className="text-red-500">*</span></Label>
              <Input 
                type="time" 
                name="end_time" 
                value={formData.end_time} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Meeting Link (Optional)</Label>
              <Input 
                name="meeting_link" 
                value={formData.meeting_link} 
                onChange={handleChange} 
                placeholder="e.g. https://meet.google.com/..."
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Participants</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                {fetchingEmployees ? (
                  <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-2">No users found</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {employees.map(emp => {
                      const isSelected = formData.participants.includes(emp._id);
                      return (
                        <div 
                          key={emp._id}
                          onClick={() => toggleParticipant(emp._id)}
                          className={cn(
                            "text-sm flex items-center p-2 rounded cursor-pointer border transition-colors",
                            isSelected ? "border-primary bg-primary/5 text-primary" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-sm border mr-2 flex items-center justify-center",
                            isSelected ? "bg-primary border-primary" : "border-slate-300"
                          )}>
                            {isSelected && <X className="w-3 h-3 text-white" />}
                          </div>
                          {emp.firstName} {emp.lastName}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Agenda</Label>
              <Textarea 
                name="agenda" 
                value={formData.agenda} 
                onChange={handleChange} 
                placeholder="Meeting agenda and topics..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
