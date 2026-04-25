import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { reviewApi } from "@/services/reviewApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, ArrowLeft, Coins } from "lucide-react";
import type { AppraisalCycleStatus, BonusPreviewRow, BonusRunResult } from "@/api/pmsApi";
import { useAppraisalCycle } from "@/hooks/useAppraisalCycles";
import { useBonusPreview, useRunBonus } from "@/hooks/useBonusRun";
import { TransitionStatusModal } from "@/components/pms/TransitionStatusModal";
import { useTransitionCycle } from "@/hooks/useAppraisalCycles";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatRatingBandLabel } from "@/constants/appraisalRatingBands";
import { displayPersonName, type PersonLike } from "@/lib/pmsDisplay";

function normalizeRole(role: unknown): string {
  const r = typeof role === "string" ? role : (role as { name?: string })?.name || "";
  return r.toUpperCase().replace(/\s+/g, "_");
}

type ReviewRow = {
  _id: string;
  employeeId?: PersonLike & { _id?: string };
};

function parseReviews(res: unknown): ReviewRow[] {
  if (!res || typeof res !== "object") return [];
  const r = res as { data?: ReviewRow[] };
  return Array.isArray(r.data) ? r.data : [];
}

const STEPS: AppraisalCycleStatus[] = ["draft", "active", "closed", "processed"];

function BonusPreviewTable({
  rows,
  nameByUserId,
}: {
  rows: BonusPreviewRow[];
  nameByUserId: Map<string, string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        No preview rows — add finalized reviews with ratings and salary structures.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Employee</th>
            <th className="pb-2 pr-3 font-medium">Rating band</th>
            <th className="pb-2 pr-3 font-medium">Bonus %</th>
            <th className="pb-2 font-medium text-right">Bonus amt</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.reviewId}>
              <td className="py-2 pr-3">
                {nameByUserId.get(row.userId) ?? `User ${row.userId.slice(-6)}`}
              </td>
              <td className="py-2 pr-3">{formatRatingBandLabel(row.ratingBand)}</td>
              <td className="py-2 pr-3 tabular-nums">
                {row.skippedReason ? "—" : `${row.bonusPercent}%`}
              </td>
              <td className="py-2 text-right tabular-nums">
                {row.skippedReason ? (
                  <span className="text-muted-foreground">{row.skippedReason}</span>
                ) : (
                  row.bonusAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AppraisalCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const role = normalizeRole(user?.role);

  const canSee =
    role === "HR_MANAGER" ||
    role === "HR_OFFICER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "SUPER ADMIN" ||
    role === "CEO" ||
    role === "FINANCE_MANAGER";

  const canTransition = role === "HR_MANAGER" || role === "HR_OFFICER";
  const canRunBonus = role === "HR_MANAGER" || role === "FINANCE_MANAGER";

  const { cycle, loading, error } = useAppraisalCycle(id);
  const status = cycle?.status;

  const previewEnabled =
    Boolean(id) && (status === "closed" || status === "processed");
  const { preview, loading: previewLoading } = useBonusPreview(previewEnabled ? id : null);

  const runBonus = useRunBonus();
  const transition = useTransitionCycle();

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [runSummary, setRunSummary] = useState<BonusRunResult | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["pmsReviews", cycle?.performanceCycleId],
    queryFn: async () =>
      parseReviews(await reviewApi.getAllReviews({ cycleId: cycle!.performanceCycleId })),
    enabled: Boolean(cycle?.performanceCycleId) && canSee,
  });

  const nameByUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of reviewsQuery.data ?? []) {
      const uid =
        typeof r.employeeId === "object" && r.employeeId && "_id" in r.employeeId
          ? String((r.employeeId as { _id?: string })._id)
          : "";
      if (uid) m.set(uid, displayPersonName(r.employeeId));
    }
    return m;
  }, [reviewsQuery.data]);

  const stepIndex = status ? STEPS.indexOf(status) : -1;

  const handleTransition = async () => {
    if (!cycle) return;
    const i = STEPS.indexOf(cycle.status);
    const nxt = STEPS[i + 1];
    if (!nxt || nxt === "draft") return;
    try {
      await transition.mutateAsync({
        id: cycle._id,
        status: nxt as Exclude<AppraisalCycleStatus, "draft">,
      });
      toast.success("Status updated");
      setTransitionOpen(false);
    } catch {
      toast.error("Transition failed");
    }
  };

  /** Refresh idempotent totals after processed (HR/Finance). */
  const refreshRunSummary = async () => {
    if (!cycle?._id) return;
    try {
      const res = await runBonus.mutateAsync(cycle._id);
      setRunSummary(res);
    } catch {
      /* toast handled in hook */
    }
  };

  if (!canSee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appraisal cycle</CardTitle>
          <CardDescription>Access denied.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading || !id) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ?? "Cycle not found"}
        </CardContent>
      </Card>
    );
  }

  const cycleTitle = cycle.name;

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pms/appraisal-cycles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cycleTitle}</h1>
          <p className="text-muted-foreground">
            {format(new Date(cycle.startDate), "PPP")} – {format(new Date(cycle.endDate), "PPP")}
          </p>
          {cycle.description ? (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{cycle.description}</p>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lifecycle</CardTitle>
            <CardDescription>DRAFT → ACTIVE → CLOSED → PROCESSED</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                      idx <= stepIndex
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-sm capitalize ${
                      idx === stepIndex ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <span className="mx-1 text-muted-foreground hidden sm:inline">→</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {canTransition ? (
                <Button type="button" onClick={() => setTransitionOpen(true)}>
                  Transition status
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button type="button" disabled variant="outline">
                        Transition status
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Only HR Manager or HR Officer can change status.</TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>

        {status === "closed" && (
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Bonus preview</CardTitle>
                <CardDescription>
                  Estimates from finalized reviews and latest salary structure (read-only).
                </CardDescription>
              </div>
              {canRunBonus && (
                <Button
                  type="button"
                  onClick={() => void runBonus.mutateAsync(cycle._id).then(setRunSummary)}
                  disabled={runBonus.isPending}
                >
                  {runBonus.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Coins className="mr-2 h-4 w-4" />
                  )}
                  Run bonus
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <BonusPreviewTable rows={preview} nameByUserId={nameByUserId} />
              )}
              {runSummary && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Last run: {runSummary.processed} processed, {runSummary.skipped} skipped · Run ID{" "}
                  <code className="text-xs">{runSummary.bonusRunId}</code>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {status === "processed" && (
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Bonus settlement</CardTitle>
                <CardDescription>
                  Bonus run is idempotent. Refresh to reconcile totals with payroll snapshots.
                </CardDescription>
              </div>
              {canRunBonus && (
                <Button type="button" variant="outline" onClick={() => void refreshRunSummary()} disabled={runBonus.isPending}>
                  {runBonus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Refresh summary
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Bonus run ID:</span>{" "}
                  <code>{cycle.bonusRunId ?? "—"}</code>
                </p>
                {runSummary ? (
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Processed: {runSummary.processed}</li>
                    <li>Skipped: {runSummary.skipped}</li>
                    <li>Errors / warnings: {runSummary.errors.length}</li>
                  </ul>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    {canRunBonus
                      ? "Use “Refresh summary” to load the latest idempotent run totals."
                      : "Totals are available to HR Manager and Finance Manager."}
                  </p>
                )}
                {runSummary && runSummary.errors.length > 0 && (
                  <pre className="mt-3 max-h-40 overflow-auto rounded bg-background p-2 text-xs">
                    {runSummary.errors.join("\n")}
                  </pre>
                )}
              </div>
              {previewLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <BonusPreviewTable rows={preview} nameByUserId={nameByUserId} />
              )}
            </CardContent>
          </Card>
        )}

        <TransitionStatusModal
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
          currentStatus={cycle.status}
          cycleName={cycle.name}
          onConfirm={handleTransition}
          pending={transition.isPending}
        />
      </div>
    </TooltipProvider>
  );
}
