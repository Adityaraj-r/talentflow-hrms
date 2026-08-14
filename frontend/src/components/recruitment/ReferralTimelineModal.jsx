import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import {
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Award,
  Loader2,
  FileText,
  Send,
  AlertCircle,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function ReferralTimelineModal({ referralId, open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (!referralId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/referrals/${referralId}/timeline`);
      if (res?.data) setData(res.data);
    } catch (err) {
      console.error("Failed to load referral timeline", err);
    } finally {
      setLoading(false);
    }
  }, [referralId]);

  useEffect(() => {
    if (open && referralId) {
      fetchTimeline();
    }
  }, [open, referralId, fetchTimeline]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-950">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Referral Lifecycle Timeline
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Unified read-only chronological record from initial referral submission to reward status.
              </DialogDescription>
            </div>
            {data?.currentReferralStatus && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {data.currentReferralStatus}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col justify-center items-center text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-purple-600" />
            Loading timeline events...
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Unable to load timeline for this referral.
          </div>
        ) : (
          <div className="space-y-4 text-xs py-2">
            {/* Context Summary Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="font-semibold text-slate-500 block">Candidate</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{data.candidateName}</span>
                <span className="text-[11px] text-slate-500 block">{data.candidateEmail}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Position</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{data.jobTitle}</span>
                <span className="text-[11px] text-slate-500 block">{data.department}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Referred By</span>
                <span className="font-bold text-purple-700 dark:text-purple-400">{data.referredBy}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                  Reward: {data.rewardStatus}
                </span>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {data.timeline?.map((ev, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full border-2 bg-white dark:bg-slate-950 flex items-center justify-center ${
                      ev.type === "hiring" || ev.type === "reward"
                        ? "border-emerald-500 text-emerald-500"
                        : ev.type === "interview"
                        ? "border-purple-500 text-purple-500"
                        : ev.type === "application"
                        ? "border-blue-500 text-blue-500"
                        : "border-slate-400 text-slate-400"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        ev.type === "hiring" || ev.type === "reward"
                          ? "bg-emerald-500"
                          : ev.type === "interview"
                          ? "bg-purple-500"
                          : ev.type === "application"
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <div className="p-3 rounded-lg border bg-white dark:bg-slate-900/80 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs md:text-sm">
                        {ev.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ev.description}</p>
                    {ev.actor && (
                      <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
                        By: <span className="text-slate-700 dark:text-slate-300 font-semibold">{ev.actor}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
