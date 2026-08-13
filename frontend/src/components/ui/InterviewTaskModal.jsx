import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  MapPin,
  Video,
  FileText,
  User,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Download,
  Eye,
  Building2,
  Clock,
  MapIcon,
  Copy,
  Info,
  Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

const InterviewTaskModal = ({ open, onOpenChange, task, intData }) => {
  const [candidateApp, setCandidateApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!open || !intData?.candidateName) return;
      setLoading(true);
      try {
        const res = await apiClient.get("/applications");
        const data = res?.data?.data || res?.data || res || [];
        if (active) {
          const match = (Array.isArray(data) ? data : []).find(
            (app) => (app.name || "").toLowerCase() === (intData.candidateName || "").toLowerCase()
          );
          setCandidateApp(match || null);
        }
      } catch (error) {
        console.error("Failed to fetch candidate details:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [open, intData?.candidateName]);

  if (!task || !intData) return null;

  const uploadBaseUrl = (() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api"
    return apiUrl.replace(/\/api\/?$/, "")
  })()

  const candidate = candidateApp || {};
  const displayEmail = candidate.email || intData?.candidateEmail || intData?.email || task?.candidateEmail || "";
  const displayPhone = candidate.phone || intData?.candidatePhone || intData?.phone || task?.candidatePhone || "";
  const displayResume = candidate.resume || intData?.candidateResume || intData?.resume || task?.candidateResume || "";
  const displayLinks = candidate.links || intData?.candidateLinks || [];
  const job = candidateApp?.jobId || {};
  const recruiterName = candidateApp?.recruiterId?.firstName 
    ? `${candidateApp.recruiterId.firstName} ${candidateApp.recruiterId.lastName || ''}` 
    : task?.assignedBy?.firstName 
      ? `${task.assignedBy.firstName} ${task.assignedBy.lastName || ''}` 
      : "Assigned Recruiter";

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30";
      case "in progress":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30";
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30";
      case "rescheduled":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30";
    }
  };

  const isOnline = intData.mode?.toLowerCase() === "online";
  const linkText = intData.meetingLink || "";
  const locationAddress = linkText && linkText !== 'N/A' && !linkText.includes('http') ? linkText : 'Head Office, 123 Corporate Tower, 4th Floor, Cyber City, State, 110001';
  const hasMapLink = linkText.includes("maps.google") || linkText.includes("goo.gl/maps") || linkText.includes("map");

  const getMeetingPlatform = (link) => {
    if (!link) return "Video Call";
    if (link.includes("meet.google")) return "Google Meet";
    if (link.includes("zoom.us")) return "Zoom";
    if (link.includes("teams.microsoft")) return "Microsoft Teams";
    if (link.includes("webex")) return "Webex";
    return "Video Platform";
  };

  const getResumeUrl = (resumePath) => {
    if (!resumePath) return ""
    if (resumePath.startsWith("http://") || resumePath.startsWith("https://")) return resumePath
    const filename = resumePath.replace(/^\/?(uploads\/)?/, "")
    return `${uploadBaseUrl}/uploads/${filename}`
  }

  const openResume = () => {
    if (displayResume) {
      window.open(getResumeUrl(displayResume), "_blank");
    } else {
      toast.error("No resume available");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Meeting link copied!");
  };

  const interviewTime = intData.startTime && intData.endTime ? `${intData.startTime} - ${intData.endTime}` : intData.startTime || "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto max-h-[85vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
            <div className="flex items-start gap-1.5">
              <div className="h-6 w-6 shrink-0 text-sm rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-base font-bold border border-blue-200 dark:border-blue-800 shadow-sm">
                {candidate.name ? candidate.name.charAt(0).toUpperCase() : intData.candidateName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {intData.candidateName}
                  {candidateApp && (
                    <span className="text-[11px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      #{candidate._id?.slice(-6).toUpperCase() || candidateApp._id?.slice(-6).toUpperCase()}
                    </span>
                  )}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium"><Briefcase className="w-4 h-4 text-slate-400" /> {job?.title || job?.jobTitle || "Applied Position"}</span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {job?.department?.name || job?.department || "Department"}</span>
                  {candidate.experience && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                      <span className="flex items-center gap-1.5">Exp: {candidate.experience}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500">
                   <span>Recruiter: <span className="font-medium text-slate-700 dark:text-slate-300">{recruiterName}</span></span>
                   {candidateApp && (
                     <>
                        <span>&bull;</span>
                        <span>Stage: <span className="font-medium text-blue-600 dark:text-blue-400">{candidateApp.status || "Interview"}</span></span>
                     </>
                   )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
               <Badge variant="outline" className={cn("text-[11px] font-bold px-3 py-1 shadow-sm", getStatusColor(intData.interviewStatus))}>
                 {intData.interviewStatus || "Upcoming"}
               </Badge>
               <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                 Task: {task.status.replace("_", " ")}
               </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 space-y-1 bg-white dark:bg-slate-950 flex-1 overflow-hidden">
          <div>
            <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white mb-1">Interview Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <InfoItem label="Round" value={candidateApp?.status || "Technical Interview"} icon={Info} />
              <InfoItem label="Date" value={intData.interviewDate || "N/A"} icon={CalendarClock} />
              <InfoItem label="Interview Time" value={interviewTime} icon={Clock} />
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Type</p>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5 truncate">
                    {isOnline ? "🟢 Online" : "🏢 Offline"}
                  </span>
                </div>
              </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-1 flex flex-col">
              <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Interview Location
              </h3>
              <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-1.5 shadow-sm">
                {isOnline ? (
                  <div className="space-y-1">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Meeting Platform</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-blue-500" /> {getMeetingPlatform(linkText)}
                      </p>
                    </div>
                    {linkText && linkText !== "N/A" ? (
                      <div className="space-y-1">
                        <div className="p-1.5.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 truncate text-sm text-slate-600 dark:text-slate-400">
                          {linkText}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button onClick={() => window.open(linkText, "_blank")} size="sm" className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Video className="w-4 h-4" /> Join Meeting
                          </Button>
                          <Button onClick={() => copyToClipboard(linkText)} size="sm" variant="outline" className="gap-1.5">
                            <Copy className="w-4 h-4" /> Copy Link
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-center">
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Meeting link not available.</p>
                        <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 mt-1">Please check with HR or the Recruiter.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Office Address</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-start gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="leading-snug">
                          {linkText && linkText !== 'N/A' && !linkText.includes("http") 
                            ? linkText : "Head Office\n123 Corporate Tower, 4th Floor\nCyber City\nState, 110001"}
                        </span>
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(linkText && linkText !== 'N/A' && !linkText.includes('http') ? linkText : 'Head Office, 123 Corporate Tower, 4th Floor, Cyber City, State, 110001')}`, "_blank")} size="sm" variant="outline" className="w-full gap-1.5">
                        <MapIcon className="w-4 h-4" /> View on Google Maps
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1 flex flex-col">
              <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Contact & Resume
              </h3>
              <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-1.5 shadow-sm space-y-5">
                {loading ? (
                   <div className="space-y-1">
                     <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                     <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                   </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="truncate font-medium">{displayEmail || "No email available"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="font-medium">{displayPhone || "No phone available"}</span>
                      </div>
                      {displayLinks && displayLinks.length > 0 && (
                        <div className="flex gap-1.5 pt-1 pl-11">
                          {displayLinks.map((l, i) => (
                             <a key={i} href={l} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                               <Globe className="w-4 h-4" />
                             </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">📄 Resume</p>
                        {displayResume && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-[9px]">Available</Badge>}
                      </div>
                      {displayResume ? (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={displayResume.split('/').pop()}>
                            {displayResume.split('/').pop()}
                          </p>
                          <div className="flex gap-1.5">
                            <Button onClick={() => window.open(getResumeUrl(displayResume), "_blank")} size="sm" className="flex-1 gap-1.5 h-7 text-[11px]"> <span title="View" className="flex items-center justify-center w-full h-full text-slate-600 hover:text-slate-800"><Eye className="h-4 w-4" /><span className="sr-only">View</span></span></Button>
                            <Button onClick={() => {
                               const a = document.createElement('a');
                               a.href = getResumeUrl(displayResume);
                               a.download = `${candidate.name || intData?.candidateName || 'Candidate'}_Resume.pdf`;
                               a.click();
                            }} size="sm" variant="outline" className="flex-1 gap-1.5 h-7 text-[11px]"> <span title="Download" className="flex items-center justify-center w-full h-full "><Download className="h-4 w-4" /><span className="sr-only">Download</span></span></Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-[11px] text-slate-500 italic">No resume uploaded.</p>
                        </div>
                      )}
                    </div></>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-1">
              <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Instructions
              </h3>
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 p-1.5 max-h-[48px] overflow-hidden text-ellipsis">
                {intData.instructions?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {intData.instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        <span className="leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic flex items-center h-full justify-center">No specific instructions provided.</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
               <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Recruiter Notes
              </h3>
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 p-1.5 max-h-[48px] overflow-hidden text-ellipsis text-[11px] text-slate-700 dark:text-slate-300">
                {task.description && !task.description.includes('Candidate Name:') ? (
                  <p className="leading-relaxed">{task.description}</p>
                ) : (
                  <p className="text-slate-500 italic flex items-center h-full justify-center">No recruiter notes.</p>
                )}
              </div>
            </div>
          </div>

          {candidateApp?.jobId?.jobDescription && (
             <div className="space-y-1">
               <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                 <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                 Attachments
               </h3>
               <div className="flex gap-1.5 overflow-x-auto pb-2">
                 <div className="flex items-center justify-between p-1.5 min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                    <div className="flex items-center gap-1.5 pr-4">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium ">Job Description</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </Button>
                 </div>
               </div>
             </div>
          )}

        </div>


      </DialogContent>
    </Dialog>
  );
};

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-start gap-1.5 text-[11px] font-medium text-slate-900 dark:text-slate-100 break-words leading-snug">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
        <span>{value}</span>
      </div>
    </div>
  );
}

export default InterviewTaskModal;
