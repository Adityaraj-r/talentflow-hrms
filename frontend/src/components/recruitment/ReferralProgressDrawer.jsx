import React, { useEffect } from "react";
import {
  X,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STANDARD_STAGES = [
  { key: "referred", label: "Referred", desc: "Invitation sent to candidate" },
  { key: "applied", label: "Applied", desc: "Application form submitted" },
  { key: "screening", label: "Screening", desc: "Profile review & HR screening" },
  { key: "interview", label: "Interview", desc: "Interviews in progress" },
  { key: "selected", label: "Selected", desc: "Selected & offer processed" },
  { key: "hired", label: "Hired / Joined", desc: "Candidate joined organization" },
  { key: "probation", label: "Probation", desc: "Probation evaluation period" },
];

export function deriveDrawerStageInfo(referral = {}, application = {}, reward = null) {
  const refStatus = (referral?.status || "").trim();
  const appStatus = (application?.status || referral?.applicationId?.status || "").trim().toLowerCase();

  const refDateRaw = referral?.createdAt || referral?.referralDate || referral?.updatedAt;
  const refDateFormatted = refDateRaw
    ? new Date(refDateRaw).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Recently";

  // Calculate elapsed hours for SLA tracking
  const createdTimestamp = refDateRaw ? new Date(refDateRaw).getTime() : Date.now();
  const nowTimestamp = Date.now();
  const elapsedHours = Math.max(0, Math.floor((nowTimestamp - createdTimestamp) / (1000 * 60 * 60)));

  // SLA Status Evaluation
  let slaStatus = "within";
  if (elapsedHours > 48) {
    slaStatus = "breached";
  } else if (elapsedHours > 24) {
    slaStatus = "at_risk";
  }

  // Terminal States
  if (refStatus === "Expired") {
    return {
      currentStageIndex: 0,
      terminalState: "Invitation Expired",
      isTerminal: true,
      terminalType: "expired",
      currentStageLabel: "Invitation Expired",
      statusNote: "The invitation link expired before the candidate applied.",
      refDateFormatted,
      elapsedHours,
      slaStatus,
    };
  }

  if (refStatus === "Cancelled" || refStatus === "Withdrawn") {
    return {
      currentStageIndex: 0,
      terminalState: "Withdrawn",
      isTerminal: true,
      terminalType: "withdrawn",
      currentStageLabel: "Withdrawn",
      statusNote: "This referral invitation or application was withdrawn.",
      refDateFormatted,
      elapsedHours,
      slaStatus,
    };
  }

  if (appStatus === "rejected" || appStatus === "declined" || refStatus === "Rejected") {
    let lastIndex = 1;
    if (referral?.firstReviewedAt || appStatus.includes("review") || appStatus.includes("screening")) {
      lastIndex = 2;
    }
    if (application?.interviewDetails?.date || appStatus.includes("interview")) {
      lastIndex = 3;
    }

    return {
      currentStageIndex: lastIndex,
      terminalState: "Not Selected",
      isTerminal: true,
      terminalType: "rejected",
      currentStageLabel: "Not Selected",
      statusNote: "The candidate was not selected for this position.",
      refDateFormatted,
      elapsedHours,
      slaStatus,
    };
  }

  // Active Pipeline Mapping
  if (refStatus === "Invited" && !application?._id && !referral?.applicationId) {
    return {
      currentStageIndex: 0,
      isTerminal: false,
      currentStageLabel: "Referred",
      statusNote: "Invitation sent to candidate. Awaiting candidate application form.",
      refDateFormatted,
      elapsedHours,
      slaStatus,
    };
  }

  let stageIdx = 1;
  let label = "Applied";

  if (appStatus === "applied" || appStatus === "new") {
    stageIdx = 1;
    label = "Applied";
  } else if (appStatus.includes("screening") || appStatus.includes("review") || appStatus.includes("shortlisted")) {
    stageIdx = 2;
    label = "Screening";
  } else if (appStatus.includes("interview")) {
    stageIdx = 3;
    label = "Interview";
  } else if (appStatus.includes("select") || appStatus.includes("offer") || appStatus.includes("background")) {
    stageIdx = 4;
    label = "Selected";
  } else if (appStatus === "hired" || appStatus === "joined" || refStatus === "Successful") {
    const isProbationDone = reward?.isProbationCompleted || reward?.rewardStatus === "Eligible" || reward?.rewardStatus === "Paid";
    if (isProbationDone) {
      stageIdx = 6;
      label = "Probation Passed";
    } else {
      stageIdx = 5;
      label = "Hired / Joined";
    }
  }

  return {
    currentStageIndex: stageIdx,
    isTerminal: false,
    currentStageLabel: label,
    statusNote: null,
    refDateFormatted,
    elapsedHours,
    slaStatus,
  };
}

export default function ReferralProgressDrawer({
  open = false,
  onClose,
  referral = {},
  application = {},
  reward = null,
  onViewCandidate,
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !referral) return null;

  const candidateName = referral.candidateName || application.name || "Candidate";
  const candidateEmail = referral.candidateEmail || application.email || "";
  const jobTitle = referral.jobTitle || referral.jobId?.jobTitle || application.jobId?.jobTitle || "Position";
  const department = referral.department || referral.jobId?.department || application.jobId?.department || "Department";

  const stageInfo = deriveDrawerStageInfo(referral, application, reward);
  const { currentStageIndex, isTerminal, terminalType, terminalState, currentStageLabel, statusNote, refDateFormatted, elapsedHours, slaStatus } = stageInfo;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-300">
          
          {/* ─────────────────────────────────────────────────────────────
              DRAWER HEADER
             ───────────────────────────────────────────────────────────── */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Referral Progress</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Candidate recruitment pipeline status & SLA turnaround
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Drawer (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DRAWER CONTENT BODY (SCROLLABLE)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            
            {/* Candidate & Position Identity Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    {candidateName}
                  </h3>
                  {candidateEmail && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {candidateEmail}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50 text-xs font-semibold"
                >
                  {department}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {jobTitle}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Ref: {refDateFormatted}
                </span>
              </div>
            </div>

            {/* Current Stage Highlight Box */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Current Recruitment Stage
                </span>
                <p className="text-base font-black text-indigo-950 dark:text-indigo-100 mt-0.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  {isTerminal ? terminalState : currentStageLabel}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-bold px-3 py-1 ${
                  isTerminal
                    ? terminalType === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                {isTerminal ? "Concluded" : "Active Pipeline"}
              </Badge>
            </div>

            {/* SLA Status Indicator Box */}
            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SLA Performance
              </span>
              <div className="flex items-center justify-between">
                {slaStatus === "within" && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    🟢 Within SLA
                  </span>
                )}
                {slaStatus === "at_risk" && (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    🟡 SLA At Risk
                  </span>
                )}
                {slaStatus === "breached" && (
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    🔴 SLA Breached
                  </span>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {elapsedHours} hours elapsed
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {slaStatus === "within" && "Review processing is on schedule (<24h)."}
                {slaStatus === "at_risk" && `${48 - elapsedHours} hours remaining before SLA threshold.`}
                {slaStatus === "breached" && "Review target (48h) exceeded. HR attention required."}
              </p>
            </div>

            {/* Status Notice if any */}
            {statusNote && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>{statusNote}</span>
              </div>
            )}

            {/* 7-Stage Vertical Progress Timeline Stream */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recruitment Stage Timeline
              </h4>

              <div className="relative pl-6 space-y-4 pt-1 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {STANDARD_STAGES.map((stage, idx) => {
                  const isPassed = !isTerminal && idx < currentStageIndex;
                  const isCurrent = !isTerminal && idx === currentStageIndex;
                  const isTerminalAtStage = isTerminal && idx === currentStageIndex + 1;
                  const isPassedBeforeTerminal = isTerminal && idx <= currentStageIndex;
                  const isFutureAfterTerminal = isTerminal && idx > currentStageIndex + 1;

                  if (isFutureAfterTerminal) return null;

                  return (
                    <div key={stage.key} className="relative flex items-start gap-3 group">
                      {/* Timeline Dot Indicator */}
                      <div
                        className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isPassed || isPassedBeforeTerminal
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 shadow-md animate-pulse"
                            : isTerminalAtStage
                            ? "bg-rose-600 text-white shadow-md"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isPassed || isPassedBeforeTerminal ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isTerminalAtStage ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Stage Details Card */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 w-full">
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs font-bold ${
                              isCurrent
                                ? "text-indigo-600 dark:text-indigo-400"
                                : isTerminalAtStage
                                ? "text-rose-600 dark:text-rose-400"
                                : isPassed || isPassedBeforeTerminal
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {isTerminalAtStage ? terminalState : stage.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                          {isTerminalAtStage ? "Process concluded" : stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DRAWER FOOTER ACTIONS
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between gap-3">
            {onViewCandidate ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-semibold cursor-pointer border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                onClick={() => {
                  onViewCandidate(referral);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Candidate Details
              </Button>
            ) : <div />}

            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold cursor-pointer"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
