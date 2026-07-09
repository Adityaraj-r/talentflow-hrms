import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  Star,
  Target,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { reviewApi, goalApi } from "@/services/reviewApi";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayPersonName,
  displayDepartment,
  formatDateDDMMMYYYY,
  formatWorkflowStageLabel,
  initialsFromPerson,
  type PersonLike,
} from "@/lib/pmsDisplay";

function normalizeWorkflowKey(status: string | undefined): string {
  const raw = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const legacy: Record<string, string> = {
    pending: "goals_pending",
    self_assessment_done: "self_assessment_done",
    manager_review_done: "manager_review_done",
    hr_reviewed: "hr_reviewed",
    ceo_reviewed: "ceo_reviewed",
    completed: "final_approved",
    approved: "final_approved",
  };
  return legacy[raw] ?? raw;
}

type StepDef = {
  key: string;
  label: string;
  description: string;
};

const BASE_STEPS: StepDef[] = [
  {
    key: "goals_pending",
    label: "Goal setting",
    description: "Employee defines goals for the cycle.",
  },
  {
    key: "goals_locked",
    label: "Goals confirmed",
    description: "Goals locked before self-assessment.",
  },
  {
    key: "self_assessment_done",
    label: "Self-assessment",
    description: "Employee self-rating submitted.",
  },
  {
    key: "manager_review_done",
    label: "Manager review",
    description: "Line manager ratings and comments.",
  },
  {
    key: "hr_reviewed",
    label: "HR review",
    description: "HR validation and narrative.",
  },
];

const TAIL_STEPS: StepDef[] = [
  {
    key: "ceo_reviewed",
    label: "CEO review",
    description: "Executive sign-off when required.",
  },
  {
    key: "calibrated",
    label: "Calibration",
    description: "Fairness adjustments to ratings.",
  },
  {
    key: "final_approved",
    label: "Final approval",
    description: "Record locked — immutable after this.",
  },
  {
    key: "feedback_released",
    label: "Feedback released",
    description: "Employee may view results.",
  },
];

function buildSteps(requiresCeo: boolean): StepDef[] {
  if (requiresCeo) return [...BASE_STEPS, ...TAIL_STEPS];
  const tail = TAIL_STEPS.filter((s) => s.key !== "ceo_reviewed");
  return [...BASE_STEPS, ...tail];
}

function getActiveStepIndex(statusKey: string, requiresCeo: boolean): number {
  const steps = buildSteps(requiresCeo);
  const keys = steps.map((s) => s.key);
  const idx = (k: string) => keys.indexOf(k);

  switch (statusKey) {
    case "goals_pending":
      return 0;
    case "goals_locked":
      return 1;
    case "self_assessment_done":
      return 2;
    case "manager_review_done":
      return idx("hr_reviewed");
    case "hr_reviewed":
      if (requiresCeo) return idx("ceo_reviewed");
      return idx("calibrated");
    case "ceo_reviewed":
      return idx("calibrated");
    case "calibrated":
      return idx("final_approved");
    case "final_approved":
      return idx("feedback_released");
    case "feedback_released":
      return keys.length - 1;
    default: {
      const i = keys.indexOf(statusKey);
      return i >= 0 ? i : 0;
    }
  }
}

function parseReviewPayload(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;

  let doc: unknown = r;
  if ("data" in r && r.data !== undefined && r.data !== null) {
    doc = r.data;
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  let out = doc as Record<string, unknown>;
  const inner = out.data;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    "_id" in (inner as object)
  ) {
    out = inner as Record<string, unknown>;
  }
  return "_id" in out ? out : null;
}

function parseGoalsPayload(res: unknown): Record<string, unknown>[] {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  const inner = r.data;
  if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  return [];
}

function stepAuditLine(
  stepKey: string,
  review: Record<string, unknown>,
  requiresCeo: boolean
): string | null {
  const emp = review.employeeId as PersonLike | undefined;
  const rev = review.reviewerId as PersonLike | undefined;
  const appr = review.approvedBy as PersonLike | undefined;
  const calBy = review.calibratedBy as PersonLike | undefined;

  switch (stepKey) {
    case "goals_pending":
      return review.createdAt
        ? `Opened · ${formatDateDDMMMYYYY(review.createdAt as string)}`
        : null;
    case "goals_locked":
      return `Goals locked · ${formatDateDDMMMYYYY(review.updatedAt as string)}`;
    case "self_assessment_done":
      return review.selfRating != null
        ? `${displayPersonName(emp)} · ${formatDateDDMMMYYYY(review.updatedAt as string)}`
        : null;
    case "manager_review_done":
      return review.submittedAt
        ? `${displayPersonName(rev)} · ${formatDateDDMMMYYYY(review.submittedAt as string)}`
        : null;
    case "hr_reviewed":
      return review.adminFeedback ||
        String(review.status || "").includes("hr")
        ? `HR · ${formatDateDDMMMYYYY(review.updatedAt as string)}`
        : null;
    case "ceo_reviewed":
      return review.ceoReviewedAt
        ? `CEO · ${formatDateDDMMMYYYY(review.ceoReviewedAt as string)}`
        : requiresCeo && review.ceoComments
          ? `CEO comments on file · ${formatDateDDMMMYYYY(review.updatedAt as string)}`
          : null;
    case "calibrated":
      return review.calibratedAt
        ? `${displayPersonName(calBy)} · ${formatDateDDMMMYYYY(review.calibratedAt as string)}`
        : null;
    case "final_approved":
      return review.approvedAt
        ? `${displayPersonName(appr)} · ${formatDateDDMMMYYYY(review.approvedAt as string)}`
        : null;
    case "feedback_released":
      return review.feedbackReleasedAt
        ? `Released · ${formatDateDDMMMYYYY(review.feedbackReleasedAt as string)}`
        : null;
    default:
      return null;
  }
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Logged-in user
  const { user } = useUser();

  const roleUpper = String(user?.role || "")
    .toUpperCase()
    .replace(/\s+/g, "_");

  const isEmployee = roleUpper === "EMPLOYEE";
  const isCeo = roleUpper === "CEO";
  const isHr =
    roleUpper === "HR_MANAGER" ||
    roleUpper === "HR_OFFICER";

  const canWrite =
    user?.can?.("performance", "write") === true;

  const canDelete =
    user?.can?.("performance", "delete") === true;

  const [review, setReview] =
    useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(true);

  const [goals, setGoals] =
    useState<Record<string, unknown>[]>([]);

  const [goalsLoading, setGoalsLoading] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalWeight, setGoalWeight] = useState("10");
  const [creatingGoal, setCreatingGoal] = useState(false);

  const [hrFeedback, setHrFeedback] = useState("");
  const [ceoComments, setCeoComments] = useState("");
  const [calibrationNotes, setCalibrationNotes] = useState("");
  const [finalizeNotes, setFinalizeNotes] = useState("");

  const [pending, setPending] =
    useState<string | null>(null);

 const loadReview = useCallback(async () => {
  if (!id) return;

  try {
    setLoading(true);

    const res = await reviewApi.getReviewById(id!);

    const reviewData = parseReviewPayload(res);

    if (reviewData && reviewData._id) {
      setReview(reviewData);
    } else {
      toast.error("Review not found");
      setReview(null);
    }
  } catch (error: unknown) {
    const err = error as { error?: string; message?: string };
    toast.error(err?.error || err?.message || "Failed to load review");
    setReview(null);
  } finally {
    setLoading(false);
  }
}, [id, isEmployee]);

const loadGoals = useCallback(async () => {
  if (!id) return;

  try {
    setGoalsLoading(true);

    const res = await reviewApi.getGoalsForReview(id);

    setGoals(parseGoalsPayload(res));
  } catch (error: unknown) {
    const err = error as { error?: string; message?: string };
    toast.error(err?.error || err?.message || "Could not load goals");
    setGoals([]);
  } finally {
    setGoalsLoading(false);
  }
}, [id]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  useEffect(() => {
    if (review?._id) loadGoals();
  }, [review?._id, loadGoals]);

  useEffect(() => {
    if (!review) return;
    setHrFeedback(String(review.adminFeedback ?? ""));
    setCeoComments(String(review.ceoComments ?? ""));
    setCalibrationNotes(String(review.calibrationNotes ?? ""));
  }, [review]);

  const requiresCeo = Boolean(review?.requiresCeoReview);
  const steps = useMemo(() => buildSteps(requiresCeo), [requiresCeo]);

  const statusKey = normalizeWorkflowKey(review?.status as string | undefined);

  const activeStepIndex = useMemo(
    () => getActiveStepIndex(statusKey, requiresCeo),
    [statusKey, requiresCeo]
  );

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      setPending(label);
      await fn();
      toast.success("Saved");
      await loadReview();
    } catch (error: unknown) {
      const err = error as { error?: string; message?: string };
      toast.error(err?.error || err?.message || "Request failed");
    } finally {
      setPending(null);
    }
  };

  const handleHrReview = () =>
    run("hr", () => reviewApi.hrReview(id!, { adminFeedback: hrFeedback }));

  const handleCeoReview = () =>
    run("ceo", () => reviewApi.ceoReview(id!, { ceoComments }));

  const handleCalibrate = () =>
    run("cal", () =>
      reviewApi.calibrate(id!, {
        calibrationNotes,
      })
    );

  const handleFinalize = () =>
    run("fin", () =>
      reviewApi.approveReview(id!, { feedback: finalizeNotes })
    );

  const handleRelease = () => run("rel", () => reviewApi.releaseFeedback(id!));

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) {
      toast.error("Please enter a goal title");
      return;
    }
    const emp = review?.employeeId as PersonLike | undefined;
    const cyc = review?.cycleId as Record<string, string> | undefined;
    const employeeId = emp?._id;
    const cycleId = cyc?._id;
    if (!employeeId || !cycleId) {
      toast.error("Missing employee or cycle reference");
      return;
    }
    try {
      setCreatingGoal(true);
      await goalApi.createGoal({
        employeeId,
        cycleId,
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        weight: Number(goalWeight) || 10,
      });
      toast.success("Goal added");
      setGoalTitle("");
      setGoalDescription("");
      setGoalWeight("10");
      await loadGoals();
    } catch (error: unknown) {
      const err = error as { error?: string; message?: string };
      toast.error(err?.error || err?.message || "Failed to add goal");
    } finally {
      setCreatingGoal(false);
    }
  };

  const renderStepPanel = (step: StepDef, stepIndex: number) => {
    const isDone = stepIndex < activeStepIndex;
    const isCurrent = stepIndex === activeStepIndex;
    const audit = stepAuditLine(step.key, review ?? {}, requiresCeo);

    let panel: React.ReactNode = null;

    if (
      isCurrent &&
      step.key === "hr_reviewed" &&
      statusKey === "manager_review_done" &&
      isHr &&
      canWrite
    ) {
      panel = (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label htmlFor={`hr-${id}`}>HR feedback</Label>
          <Textarea
            id={`hr-${id}`}
            rows={3}
            value={hrFeedback}
            onChange={(e) => setHrFeedback(e.target.value)}
            placeholder="Comments before advancing past manager review"
          />
          <Button size="sm" disabled={pending === "hr"} onClick={handleHrReview}>
            {pending === "hr" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit HR review"
            )}
          </Button>
        </div>
      );
    }

    if (
      isCurrent &&
      step.key === "ceo_reviewed" &&
      statusKey === "hr_reviewed" &&
      requiresCeo &&
      isCeo &&
      canWrite
    ) {
      panel = (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label htmlFor={`ceo-${id}`}>CEO comments</Label>
          <Textarea
            id={`ceo-${id}`}
            rows={3}
            value={ceoComments}
            onChange={(e) => setCeoComments(e.target.value)}
          />
          <Button size="sm" disabled={pending === "ceo"} onClick={handleCeoReview}>
            {pending === "ceo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit CEO sign-off"
            )}
          </Button>
        </div>
      );
    }

    const mayCalibrate =
      canDelete &&
      step.key === "calibrated" &&
      isCurrent &&
      ((requiresCeo && statusKey === "ceo_reviewed") ||
        (!requiresCeo && statusKey === "hr_reviewed"));

    if (mayCalibrate) {
      panel = (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label htmlFor={`cal-${id}`}>Calibration notes</Label>
          <Textarea
            id={`cal-${id}`}
            rows={3}
            value={calibrationNotes}
            onChange={(e) => setCalibrationNotes(e.target.value)}
            placeholder="Optional session notes"
          />
          <Button size="sm" disabled={pending === "cal"} onClick={handleCalibrate}>
            {pending === "cal" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit calibration"
            )}
          </Button>
        </div>
      );
    }

    if (
      canDelete &&
      step.key === "final_approved" &&
      isCurrent &&
      statusKey === "calibrated"
    ) {
      panel = (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label htmlFor={`fin-${id}`}>Final approval notes</Label>
          <Textarea
            id={`fin-${id}`}
            rows={2}
            value={finalizeNotes}
            onChange={(e) => setFinalizeNotes(e.target.value)}
          />
          <Button size="sm" disabled={pending === "fin"} onClick={handleFinalize}>
            {pending === "fin" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Final approval (immutable)"
            )}
          </Button>
        </div>
      );
    }

    if (
      canDelete &&
      step.key === "feedback_released" &&
      isCurrent &&
      statusKey === "final_approved"
    ) {
      panel = (
        <div className="mt-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending === "rel"}
            onClick={handleRelease}
          >
            {pending === "rel" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Release feedback to employee"
            )}
          </Button>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex gap-4 rounded-lg border p-4 transition-colors",
          isCurrent && "border-primary bg-primary/5",
          !isCurrent && !isDone && "opacity-60"
        )}
      >
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : isCurrent ? (
            <Circle className="h-5 w-5 fill-primary/20 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {stepIndex + 1}. {step.label}
            </span>
            {isDone && (
              <Badge variant="secondary" className="text-[10px]">
                Done
              </Badge>
            )}
            {isCurrent && <Badge className="text-[10px]">Current</Badge>}
            {!isDone && !isCurrent && (
              <Badge variant="outline" className="text-[10px]">
                Upcoming
              </Badge>
            )}
            {(step.key === "final_approved" || step.key === "feedback_released") &&
              isDone && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              )}
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          {(isDone || (!isCurrent && audit)) && audit ? (
            <p className="text-xs text-muted-foreground">{audit}</p>
          ) : null}
          {panel}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] space-y-4 bg-background p-4 md:p-6">
        <Skeleton className="mx-auto h-12 max-w-4xl" />
        <div className="mx-auto max-w-4xl space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        <UserCircle className="mx-auto mb-3 h-12 w-12 opacity-40" />
        <p className="font-medium">Review not found</p>
        <Button variant="link" className="mt-2" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const emp = review.employeeId as PersonLike | undefined;
  const rev = review.reviewerId as PersonLike | undefined;
  const cycle = review.cycleId as Record<string, string> | undefined;
  const empName = displayPersonName(emp, review as { employeeName?: string });
  const empDept = displayDepartment(emp, review as { employeeName?: string });
  const revName = displayPersonName(rev);
  const feedbackReleased =
    statusKey === "feedback_released" ||
    String(review.status || "").toLowerCase().includes("feedback");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-14 w-14 border">
              {emp?.profilePhoto ? (
                <AvatarImage src={emp.profilePhoto} alt="" />
              ) : null}
              <AvatarFallback className="text-lg">
                {initialsFromPerson(emp)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {empName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {emp?.designation ? `${emp.designation} · ` : ""}
                {empDept}
              </p>
              <p className="text-sm text-muted-foreground">
                {cycle?.name ?? "Cycle"}{" "}
                {cycle?.startDate && cycle?.endDate
                  ? `· ${formatDateDDMMMYYYY(cycle.startDate)} – ${formatDateDDMMMYYYY(cycle.endDate)}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs">
              {formatWorkflowStageLabel(String(review.status ?? ""))}
            </Badge>
            {requiresCeo ? (
              <Badge variant="secondary" className="text-[10px]">
                CEO sign-off required
              </Badge>
            ) : null}
          </div>
        </div>

        {feedbackReleased ? (
          <Card className="border-green-500/40 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-400">
                Final feedback released
              </CardTitle>
              <CardDescription>
                You can review overall results below. Released{" "}
                {review.feedbackReleasedAt
                  ? formatDateDDMMMYYYY(review.feedbackReleasedAt as string)
                  : ""}
                .
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Pipeline stages</CardTitle>
            <CardDescription>
              Completed steps show actor / date where available from workflow
              timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.key}>{renderStepPanel(step, i)}</div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canWrite && statusKey === "goals_pending" ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <Label htmlFor={`goal-title-${id}`}>New goal title</Label>
                <Textarea
                  id={`goal-title-${id}`}
                  rows={1}
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Improve client communication"
                />
                <Label htmlFor={`goal-desc-${id}`}>Description (optional)</Label>
                <Textarea
                  id={`goal-desc-${id}`}
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Details or success criteria"
                />
                <div className="flex items-end gap-3">
                  <div className="w-24 space-y-1">
                    <Label htmlFor={`goal-weight-${id}`}>Weight %</Label>
                    <input
                      id={`goal-weight-${id}`}
                      type="number"
                      min={1}
                      max={100}
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <Button size="sm" disabled={creatingGoal} onClick={handleCreateGoal}>
                    {creatingGoal ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add goal"
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
            {goalsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : goals.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No goals recorded for this cycle yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {goals.map((g) => (
                  <li
                    key={String(g._id)}
                    className="rounded-lg border bg-muted/20 p-3 text-sm"
                  >
                    <p className="font-medium">{String(g.title ?? "Goal")}</p>
                    {g.description ? (
                      <p className="mt-1 text-muted-foreground">{String(g.description)}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Status: {String(g.status ?? "—")}</span>
                      <span>Weight: {String(g.weight ?? "—")}%</span>
                      <span>Progress: {String(g.progress ?? 0)}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {(review.selfRating != null || review.selfComments) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Self-assessment</CardTitle>
              <CardDescription>Submitted by employee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Self rating: </span>
                {review.selfRating != null ? `${review.selfRating} / 5` : "—"}
              </p>
              {review.selfComments ? (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {String(review.selfComments)}
                </p>
              ) : (
                <p className="text-muted-foreground">No comments</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Employee</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-semibold">{empName}</p>
              <p className="text-muted-foreground">{emp?.email ?? "N/A"}</p>
              <p className="text-muted-foreground">{empDept}</p>
              {emp?.designation ? (
                <p className="text-muted-foreground">{emp.designation}</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reviewer (manager)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-semibold">{revName}</p>
              <p className="text-muted-foreground">{rev?.email ?? "N/A"}</p>
              {rev?.designation ? (
                <p className="text-muted-foreground">{rev.designation}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall rating</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6",
                    star <= Math.round(Number(review.overallRating) || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-xl font-bold tabular-nums">
              {Number(review.overallRating || 0).toFixed(1)} / 5
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Competencies (manager)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(review.competencies) &&
              (review.competencies as object[]).length > 0 ? (
              (
                review.competencies as {
                  name?: string;
                  rating?: number;
                  comments?: string;
                }[]
              ).map((comp, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{comp.name}</p>
                    {comp.comments && (
                      <p className="text-sm text-muted-foreground">
                        {comp.comments}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {comp.rating}/5
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No competency rows yet.
              </p>
            )}
          </CardContent>
        </Card>

        {review.managerComments ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manager comments</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {String(review.managerComments)}
            </CardContent>
          </Card>
        ) : null}

        {review.adminFeedback ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">HR feedback</CardTitle>
              <CardDescription>
                {review.updatedAt
                  ? `Recorded · ${formatDateDDMMMYYYY(review.updatedAt as string)}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {String(review.adminFeedback)}
            </CardContent>
          </Card>
        ) : null}

        {review.ceoComments ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">CEO comments</CardTitle>
              {review.ceoReviewedAt ? (
                <CardDescription>
                  {formatDateDDMMMYYYY(review.ceoReviewedAt as string)}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {String(review.ceoComments)}
            </CardContent>
          </Card>
        ) : null}

        {review.calibrationNotes ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calibration</CardTitle>
              {review.calibratedAt ? (
                <CardDescription>
                  {formatDateDDMMMYYYY(review.calibratedAt as string)}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {String(review.calibrationNotes)}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Strengths</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {String(review.strengths || "—")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Areas for improvement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {String(review.areasForImprovement || "—")}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
