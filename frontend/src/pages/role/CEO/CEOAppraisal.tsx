import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { reviewApi } from "@/services/reviewApi";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Loader2, ClipboardList, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  displayDepartment,
  displayPersonName,
  formatWorkflowStageLabel,
} from "@/lib/pmsDisplay";

type ReviewRow = {
  _id: string;
  status?: string;
  requiresCeoReview?: boolean;
  overallRating?: number;
  adminFeedback?: string;
  cycleId?: { _id?: string; name?: string };
  employeeId?: {
    firstName?: string;
    lastName?: string;
    department?: string;
    designation?: string;
  };
  reviewerId?: {
    firstName?: string;
    lastName?: string;
    designation?: string;
    email?: string;
  };
};

function normalizeStatus(status: string | undefined): string {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseList(res: unknown): ReviewRow[] {
  if (!res || typeof res !== "object") return [];
  const r = res as { data?: ReviewRow[] };
  return Array.isArray(r.data) ? r.data : [];
}

export default function CEOAppraisal() {
  const { user } = useUser();
  const roleUpper = String(user?.role || "")
    .toUpperCase()
    .replace(/\s+/g, "_");
  const isCeo = roleUpper === "CEO";

  const canSeePerformance = user?.can?.("performance", "read") === true;
  const canWrite = user?.can?.("performance", "write") === true;

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await reviewApi.getAllReviews({});
      const all = parseList(res);
      const queue = all.filter((r) => {
        if (!r.requiresCeoReview) return false;
        const st = normalizeStatus(r.status);
        const raw = String(r.status || "").toLowerCase();
        return (
          st === "hr_reviewed" ||
          st === "hrreviewed" ||
          raw.includes("hr review")
        );
      });
      setReviews(queue);
    } catch {
      toast.error("Failed to load CEO review queue");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const actionsDisabled = useMemo(() => !canWrite, [canWrite]);

  const pendingStats = useMemo(() => {
    const n = reviews.length;
    const rated = reviews.filter((r) => (Number(r.overallRating) || 0) > 0);
    const avg =
      rated.length > 0
        ? rated.reduce((s, r) => s + (Number(r.overallRating) || 0), 0) /
          rated.length
        : 0;
    return { count: n, avgRating: avg };
  }, [reviews]);

  const submitCeo = async (reviewId: string) => {
    try {
      setPendingId(reviewId);
      await reviewApi.ceoReview(reviewId, {
        ceoComments: comments[reviewId] ?? "",
      });
      toast.success("CEO sign-off recorded");
      setComments((prev) => ({ ...prev, [reviewId]: "" }));
      await load();
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      toast.error(err?.error || err?.message || "Could not submit");
    } finally {
      setPendingId(null);
    }
  };

  if (!isCeo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance sign-off</CardTitle>
          <CardDescription>This view is restricted to the CEO role.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canSeePerformance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance sign-off</CardTitle>
          <CardDescription>
            You do not have permission to view the performance module.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          CEO performance sign-off
        </h1>
        <p className="text-muted-foreground">
          Reviews at HR review that require executive approval before calibration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" />
              Pending sign-offs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {pendingStats.count}
            </p>
            <p className="text-sm text-muted-foreground">
              Reviews waiting for CEO action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Avg rating (pending queue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {pendingStats.count === 0
                ? "—"
                : `${pendingStats.avgRating.toFixed(1)} / 5`}
            </p>
            <p className="text-sm text-muted-foreground">
              Only includes reviews with a manager rating entered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending CEO review</CardTitle>
          <CardDescription>
            {!canWrite
              ? "Write permission required to submit sign-off."
              : "Review HR context, add executive comments, and sign off."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No reviews awaiting CEO sign-off.
            </div>
          ) : (
            reviews.map((r) => (
              <div
                key={r._id}
                className="space-y-4 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {displayPersonName(r.employeeId)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {displayDepartment(r.employeeId)}
                      {r.employeeId?.designation
                        ? ` · ${r.employeeId.designation}`
                        : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cycle: {r.cycleId?.name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Line manager: {displayPersonName(r.reviewerId)}
                      {r.reviewerId?.designation
                        ? ` · ${r.reviewerId.designation}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {formatWorkflowStageLabel(r.status)}
                    </p>
                    {r.overallRating != null && r.overallRating > 0 && (
                      <p className="text-sm font-medium text-amber-600">
                        Manager rating: {r.overallRating} / 5
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/role/hr_manager/review/${r._id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Workflow detail
                    </Link>
                  </Button>
                </div>

                {r.adminFeedback ? (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      HR feedback (read before sign-off)
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{r.adminFeedback}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No HR narrative captured yet — confirm HR review step on the
                    workflow screen.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`ceo-${r._id}`}>CEO comments</Label>
                  <Textarea
                    id={`ceo-${r._id}`}
                    rows={3}
                    value={comments[r._id] ?? ""}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        [r._id]: e.target.value,
                      }))
                    }
                    disabled={actionsDisabled}
                    placeholder="Executive commentary"
                  />
                  <Button
                    size="sm"
                    disabled={actionsDisabled || pendingId === r._id}
                    onClick={() => submitCeo(r._id)}
                  >
                    {pendingId === r._id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit CEO sign-off"
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
