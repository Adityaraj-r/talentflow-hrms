import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building,
  Briefcase,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Standardized 7-stage recruitment funnel for referrers:
 * 1. Referred
 * 2. Applied
 * 3. Screening
 * 4. Interview
 * 5. Selected
 * 6. Hired / Joined
 * 7. Probation
 */
const STANDARD_STAGES = [
  { key: "referred", label: "Referred", desc: "Invitation sent to candidate" },
  { key: "applied", label: "Applied", desc: "Application form submitted" },
  { key: "screening", label: "Screening", desc: "Profile review & HR screening" },
  { key: "interview", label: "Interview", desc: "Interviews in progress" },
  { key: "selected", label: "Selected", desc: "Selected & offer processed" },
  { key: "hired", label: "Hired / Joined", desc: "Candidate joined organization" },
  { key: "probation", label: "Probation", desc: "Probation evaluation period" },
];

/**
 * Helper to derive stage index & state from referral, application, and reward data.
 */
export function deriveReferralStageInfo(referral = {}, application = {}, reward = null) {
  const refStatus = (referral?.status || "").trim();
  const appStatus = (application?.status || referral?.applicationId?.status || "").trim().toLowerCase();
  
  const lastUpdatedRaw = application?.updatedAt || referral?.applicationId?.updatedAt || referral?.updatedAt || referral?.createdAt;
  const lastUpdated = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Recently";

  // Check terminal states
  if (refStatus === "Expired") {
    return {
      currentStageIndex: 0,
      terminalState: "Invitation Expired",
      isTerminal: true,
      terminalType: "expired",
      currentStageLabel: "Invitation Expired",
      statusNote: "The invitation link expired before the candidate submitted an application.",
      lastUpdated,
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
      lastUpdated,
    };
  }

  if (appStatus === "rejected" || appStatus === "declined" || refStatus === "Rejected") {
    // Determine last completed stage index
    let lastCompletedIndex = 1; // At least Referred & Applied
    if (referral?.firstReviewedAt || appStatus.includes("review") || appStatus.includes("screening")) {
      lastCompletedIndex = 2;
    }
    if (application?.interviewDetails?.date || application?.interviewEvaluations?.length > 0 || appStatus.includes("interview")) {
      lastCompletedIndex = 3;
    }

    return {
      currentStageIndex: lastCompletedIndex,
      terminalState: "Not Selected",
      isTerminal: true,
      terminalType: "rejected",
      currentStageLabel: "Not Selected",
      statusNote: "The candidate was not selected for this position.",
      lastUpdated,
    };
  }

  // Active States mapping
  if (refStatus === "Invited" && !application?._id && !referral?.applicationId) {
    return {
      currentStageIndex: 0,
      isTerminal: false,
      currentStageLabel: "Referred",
      statusNote: "Invitation sent. Waiting for candidate to complete the official application.",
      lastUpdated,
    };
  }

  let stageIdx = 1; // Default: Applied
  let customLabel = "Applied";

  if (appStatus === "applied" || appStatus === "new") {
    stageIdx = 1;
    customLabel = "Applied";
  } else if (
    appStatus === "hr screening" ||
    appStatus === "under review" ||
    appStatus === "shortlisted" ||
    appStatus === "screening"
  ) {
    stageIdx = 2;
    customLabel = "Screening";
  } else if (appStatus.includes("interview")) {
    stageIdx = 3;
    customLabel = "Interview";
  } else if (
    appStatus === "selected" ||
    appStatus === "approved" ||
    appStatus === "offered" ||
    appStatus === "offer accepted" ||
    appStatus === "background verification"
  ) {
    stageIdx = 4;
    customLabel = "Selected";
  } else if (appStatus === "hired" || appStatus === "joined" || refStatus === "Successful") {
    const isProbationCompleted =
      reward?.isProbationCompleted ||
      reward?.rewardStatus === "Eligible" ||
      reward?.rewardStatus === "Approved" ||
      reward?.rewardStatus === "Paid";

    const isPendingProbation = reward?.rewardStatus === "Pending_Probation";

    if (isProbationCompleted) {
      stageIdx = 6;
      customLabel = "Probation Passed";
    } else if (isPendingProbation) {
      stageIdx = 6;
      customLabel = "Probation";
    } else {
      stageIdx = 5;
      customLabel = "Hired / Joined";
    }
  }

  return {
    currentStageIndex: stageIdx,
    isTerminal: false,
    currentStageLabel: customLabel,
    statusNote: null,
    lastUpdated,
  };
}

export default function ReferralProgressTracker({
  referral = {},
  application = {},
  reward = null,
  compact = false,
  showReferrerHeader = false,
}) {
  const stageInfo = deriveReferralStageInfo(referral, application, reward);
  const { currentStageIndex, isTerminal, terminalType, terminalState, currentStageLabel, statusNote, lastUpdated } = stageInfo;

  const candidateName = referral.candidateName || application.name || "Candidate";
  const jobTitle = referral.jobTitle || referral.jobId?.jobTitle || application.jobId?.jobTitle || "Position";

  return (
    <Card className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${compact ? "p-3" : "p-5"}`}>
      <CardContent className="p-0 space-y-5">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base md:text-lg">
                {candidateName}
              </span>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 font-semibold ${
                  isTerminal
                    ? terminalType === "rejected"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                    : currentStageIndex >= 5
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                    : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200"
                }`}
              >
                {currentStageLabel}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <Briefcase className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              {jobTitle}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400">
            <span className="block font-medium">Current recruitment stage</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Last updated: {lastUpdated}
            </span>
          </div>
        </div>

        {showReferrerHeader && (referral.referredByEmployeeId?.name || referral.referredByEmployeeId?.firstName) && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-cyan-600" />
              Referred By:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {referral.referredByEmployeeId?.name ||
                  `${referral.referredByEmployeeId?.firstName || ""} ${referral.referredByEmployeeId?.lastName || ""}`.trim()}
              </strong>
            </span>
            {referral.createdAt && (
              <span className="text-slate-500">
                Referral Date: {new Date(referral.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Status Notice if any */}
        {statusNote && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 border ${
              isTerminal
                ? terminalType === "rejected"
                  ? "bg-rose-50 text-rose-800 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40"
                  : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40"
                : "bg-sky-50 text-sky-800 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/40"
            }`}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{statusNote}</span>
          </div>
        )}

        {/* Multi-stage Progress Stepper */}
        <div className="pt-2">
          {/* Desktop Horizontal Stepper */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-between">
              {/* Background Line */}
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />

              {STANDARD_STAGES.map((stage, idx) => {
                const isPassed = !isTerminal && idx < currentStageIndex;
                const isCurrent = !isTerminal && idx === currentStageIndex;
                const isTerminalAtStage = isTerminal && idx === currentStageIndex + 1;
                const isPassedBeforeTerminal = isTerminal && idx <= currentStageIndex;
                const isFutureAfterTerminal = isTerminal && idx > currentStageIndex + 1;

                if (isFutureAfterTerminal) {
                  // Do not render steps after terminal state
                  return null;
                }

                return (
                  <div key={stage.key} className="relative z-10 flex flex-col items-center group">
                    {/* Circle Indicator */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isPassed || isPassedBeforeTerminal
                          ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950"
                          : isCurrent
                          ? "bg-cyan-600 text-white ring-4 ring-cyan-100 dark:ring-cyan-900 animate-pulse shadow-md"
                          : isTerminalAtStage
                          ? "bg-rose-600 text-white ring-4 ring-rose-100 dark:ring-rose-900 shadow-md"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isPassed || isPassedBeforeTerminal ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isTerminalAtStage ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Stage Label */}
                    <div className="text-center mt-2.5">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-cyan-600 dark:text-cyan-400"
                            : isTerminalAtStage
                            ? "text-rose-600 dark:text-rose-400"
                            : isPassed || isPassedBeforeTerminal
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {isTerminalAtStage ? terminalState : stage.label}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[90px] leading-tight mt-0.5">
                        {isTerminalAtStage ? "Process concluded" : stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="block md:hidden space-y-3">
            {STANDARD_STAGES.map((stage, idx) => {
              const isPassed = !isTerminal && idx < currentStageIndex;
              const isCurrent = !isTerminal && idx === currentStageIndex;
              const isTerminalAtStage = isTerminal && idx === currentStageIndex + 1;
              const isPassedBeforeTerminal = isTerminal && idx <= currentStageIndex;
              const isFutureAfterTerminal = isTerminal && idx > currentStageIndex + 1;

              if (isFutureAfterTerminal) return null;

              return (
                <div key={stage.key} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 border">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isPassed || isPassedBeforeTerminal
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-cyan-600 text-white animate-pulse"
                        : isTerminalAtStage
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    }`}
                  >
                    {isPassed || isPassedBeforeTerminal ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isTerminalAtStage ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-cyan-600 dark:text-cyan-400"
                          : isTerminalAtStage
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isTerminalAtStage ? terminalState : stage.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{isTerminalAtStage ? "Concluded" : stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
