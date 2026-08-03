import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { reviewApi } from "@/services/reviewApi";
import { performanceApi } from "@/services/performanceApi";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Gauge,
  SlidersHorizontal,
  Send,
  Lock,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  displayDepartment,
  displayPersonName,
  formatDateDDMMMYYYY,
  formatWorkflowStageLabel,
  type PersonLike,
} from "@/lib/pmsDisplay";

function normalizeWorkflowKey(status: string | undefined): string {
  const raw = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const legacy: Record<string, string> = {
    pending: "goals_pending",
    completed: "final_approved",
    approved: "final_approved",
  };
  return legacy[raw] ?? raw;
}

function parseList<T>(res: unknown): T[] {
  if (!res || typeof res !== "object") return [];
  const r = res as { data?: T[] };
  if (Array.isArray(r.data)) return r.data;
  const raw = res as unknown as T[];
  return Array.isArray(raw) ? raw : [];
}

type ReviewRow = {
  _id: string;
  status?: string;
  overallRating?: number;
  requiresCeoReview?: boolean;
  createdAt?: string;
  cycleId?: { _id?: string; name?: string };
  employeeId?: PersonLike;
};

type CycleRow = {
  _id: string;
  name?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

function exportReviewsCsv(rows: ReviewRow[], filename: string) {
  const header = [
    "Employee",
    "Department",
    "Designation",
    "Cycle",
    "Stage",
    "Rating",
    "Created",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) => {
      const name = displayPersonName(r.employeeId);
      const dept = displayDepartment(r.employeeId).replace(/,/g, ";");
      const des = String(r.employeeId?.designation ?? "").replace(/,/g, ";");
      const cycl = String(r.cycleId?.name ?? "").replace(/,/g, ";");
      const stage = formatWorkflowStageLabel(r.status).replace(/,/g, ";");
      const rating =
        r.overallRating != null && r.overallRating > 0
          ? String(r.overallRating)
          : "";
      const created = r.createdAt
        ? formatDateDDMMMYYYY(r.createdAt)
        : "";
      return [name, dept, des, cycl, stage, rating, created]
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(",");
    }),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HRManagerAppraisal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Performance Appraisal (HR Manager)
        </h1>
        <p className="text-muted-foreground">
          Cycle overview, workflow stage per review, and HR-only actions (matrix:
          delete permission).
        </p>
      </div>
      <Tabs defaultValue="cycles">
        <TabsList>
          <TabsTrigger value="cycles">Cycles & reviews</TabsTrigger>
          <TabsTrigger value="all">All reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="cycles">
          <CyclesAndReviewsTab />
        </TabsContent>
        <TabsContent value="all">
          <AllReviewsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CyclesAndReviewsTab() {
  const { user } = useUser();
  const canDelete = user?.can?.("performance", "delete") === true;

  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [reviewsByCycle, setReviewsByCycle] = useState<
    Record<string, ReviewRow[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const cRes = (await performanceApi.getCycles()) as {
          data?: CycleRow[];
        };
        const cyclesPayload = Array.isArray(cRes?.data)
          ? cRes.data
          : parseList<CycleRow>(cRes);
        const allRes = await reviewApi.getAllReviews({});
        const reviews = parseList<ReviewRow>(allRes as { data?: ReviewRow[] });
        if (cancelled) return;

        const byCycle: Record<string, ReviewRow[]> = {};
        for (const rev of reviews) {
          const cid = String(rev.cycleId?._id ?? "");
          if (!cid) continue;
          if (!byCycle[cid]) byCycle[cid] = [];
          byCycle[cid].push(rev);
        }

        setCycles(cyclesPayload);
        setReviewsByCycle(byCycle);
      } catch {
        toast.error("Failed to load performance data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const allRes = await reviewApi.getAllReviews({});
      const reviews = parseList<ReviewRow>(allRes as { data?: ReviewRow[] });
      const byCycle: Record<string, ReviewRow[]> = {};
      for (const rev of reviews) {
        const cid = String(rev.cycleId?._id ?? "");
        if (!cid) continue;
        if (!byCycle[cid]) byCycle[cid] = [];
        byCycle[cid].push(rev);
      }
      setReviewsByCycle(byCycle);
    } catch {
      toast.error("Could not refresh reviews");
    }
  }, []);

  const handleHrAction = async (
    action: "calibrate" | "finalize" | "release",
    reviewId: string,
    extra?: Record<string, unknown>
  ) => {
    try {
      if (action === "calibrate") await reviewApi.calibrate(reviewId, extra ?? {});
      if (action === "finalize") await reviewApi.finalizeReview(reviewId);
      if (action === "release") await reviewApi.releaseFeedback(reviewId);
      toast.success("Updated");
      await refreshReviews();
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      toast.error(err?.error || err?.message || "Action failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {cycles.length === 0 ? (
        <Card>
          <CardContent className="rounded-xl border border-dashed py-14 text-center text-muted-foreground">
            No appraisal cycles yet. Create one under Manage Cycles.
          </CardContent>
        </Card>
      ) : (
        cycles.map((cycle) => {
          const list = reviewsByCycle[cycle._id] ?? [];
          return (
            <Card key={cycle._id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{cycle.name}</CardTitle>
                    <CardDescription>
                      {cycle.status} ·{" "}
                      {cycle.startDate && cycle.endDate
                        ? `${formatDateDDMMMYYYY(cycle.startDate)} – ${formatDateDDMMMYYYY(cycle.endDate)}`
                        : ""}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/role/hr_manager/appraisal/view/${cycle._id}`}>
                      Cycle detail
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                    No reviews assigned in this cycle yet.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
                  <thead className="bg-muted/40">
  <tr className="border-b">
    <th className="w-[22%] px-4 py-3 text-left font-semibold">Employee</th>
    <th className="w-[15%] px-4 py-3 text-left font-semibold">Dept</th>
    <th className="w-[18%] px-4 py-3 text-center font-semibold">Designation</th>
    <th className="w-[18%] px-4 py-3 text-center font-semibold">Stage</th>
    <th className="w-[10%] px-4 py-3 text-center font-semibold">Rating</th>
    <th className="w-[8%] px-4 py-3 text-center font-semibold">Detail</th>
    <th className="w-[9%] px-4 py-3 text-center font-semibold">HR Actions</th>
  </tr>
</thead>
                    <tbody className="divide-y">
                      {list.map((r) => {
                        const st = (r.status || "").toLowerCase().replace(/\s+/g, "_");
                        const reqCeo = Boolean(r.requiresCeoReview);
                        const showCal =
                          canDelete &&
                          ((reqCeo && st === "ceo_reviewed") ||
                            (!reqCeo && st === "hr_reviewed"));
                        const showFin = canDelete && st === "calibrated";
                        const showRel = canDelete && st === "final_approved";
                        const empName = displayPersonName(r.employeeId);
                        const empDept = displayDepartment(r.employeeId);
                        return (
                         <tr key={r._id} className="transition-colors duration-200 hover:bg-muted/40 even:bg-muted/5"
>
                            <td className="py-4 px-4 font-semibold text-foreground">{empName}</td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {empDept}
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground">
                              {r.employeeId?.designation ?? "—"}
                            </td>
                           <td className="py-4 px-4 text-center">
                                  <div className="flex items- justify-center">
                                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                      {formatWorkflowStageLabel(r.status)}
                                    </span>
                                  </div>
                                </td>
                            <td className="py-4 px-4 text-center tabular-nums">
                              {r.overallRating != null && r.overallRating > 0
                                ? `${r.overallRating}/5`
                                : "—"}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  to={`/role/hr_manager/review/${r._id}`}
                                  className="inline-flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Open
                                </Link>
                              </Button>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {showCal && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 rounded-md hover:scale-105 transition-transform"
                                    title="Calibrate"
                                    onClick={() =>
                                      handleHrAction("calibrate", r._id, {
                                        calibrationNotes:
                                          "Adjusted via HR hub quick action",
                                      })
                                    }
                                  >
                                    <SlidersHorizontal className="h-4 w-4" />
                                  </Button>
                                )}
                                {showFin && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 rounded-md hover:scale-105 transition-transform"
                                    title="Final approval"
                                    onClick={() =>
                                      handleHrAction("finalize", r._id)
                                    }
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                                {showRel && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 rounded-md hover:scale-105 transition-transform"
                                    title="Release feedback"
                                    onClick={() =>
                                      handleHrAction("release", r._id)
                                    }
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                                {!showCal && !showFin && !showRel && (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function AllReviewsTab() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cycleFilter, setCycleFilter] = useState<string>("__all");
  const [deptFilter, setDeptFilter] = useState<string>("__all");
  const [stageFilter, setStageFilter] = useState<string>("__all");
  const [ratingMin, setRatingMin] = useState<string>("");
  const [ratingMax, setRatingMax] = useState<string>("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await reviewApi.getAllReviews({});
        setReviews(parseList<ReviewRow>(res as { data?: ReviewRow[] }));
      } catch {
        toast.error("Failed to fetch all reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const departments = useMemo(() => {
    const s = new Set<string>();
    for (const r of reviews) {
      const d = r.employeeId?.department?.trim();
      if (d) s.add(d);
    }
    return Array.from(s).sort();
  }, [reviews]);

  const cycleNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) {
      const id = r.cycleId?._id;
      const n = r.cycleId?.name;
      if (id && n) map.set(String(id), n);
    }
    return map;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const rMin = ratingMin === "" ? null : Number(ratingMin);
    const rMax = ratingMax === "" ? null : Number(ratingMax);
    return reviews.filter((r) => {
      const name = displayPersonName(r.employeeId).toLowerCase();
      const dept = displayDepartment(r.employeeId).toLowerCase();
      const des = String(r.employeeId?.designation ?? "").toLowerCase();
      const cycle = r.cycleId?.name?.toLowerCase() ?? "";
      const stage = formatWorkflowStageLabel(r.status).toLowerCase();
      const stKey = normalizeWorkflowKey(r.status);
      const rating = Number(r.overallRating) || 0;

      if (cycleFilter !== "__all" && String(r.cycleId?._id ?? "") !== cycleFilter)
        return false;
      if (
        deptFilter !== "__all" &&
        String(r.employeeId?.department ?? "") !== deptFilter
      )
        return false;
      if (stageFilter !== "__all" && stKey !== stageFilter) return false;
      if (rMin != null && !Number.isNaN(rMin) && rating > 0 && rating < rMin)
        return false;
      if (rMax != null && !Number.isNaN(rMax) && rating > 0 && rating > rMax)
        return false;

      if (!q) return true;
      return (
        name.includes(q) ||
        dept.includes(q) ||
        des.includes(q) ||
        cycle.includes(q) ||
        stage.includes(q)
      );
    });
  }, [
    reviews,
    searchQuery,
    cycleFilter,
    deptFilter,
    stageFilter,
    ratingMin,
    ratingMax,
  ]);

  const STAGE_KEYS = [
    "goals_pending",
    "goals_locked",
    "self_assessment_done",
    "manager_review_done",
    "hr_reviewed",
    "ceo_reviewed",
    "calibrated",
    "final_approved",
    "feedback_released",
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>All reviews</CardTitle>
            <CardDescription>
              Filter by cycle, department, stage, or rating band. Export
              matches to CSV.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() =>
              exportReviewsCsv(
                filtered,
                `pms-reviews-${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV ({filtered.length})
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, dept, designation, cycle…"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={cycleFilter} onValueChange={setCycleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All cycles</SelectItem>
              {Array.from(cycleNames.entries()).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All stages</SelectItem>
              {STAGE_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {formatWorkflowStageLabel(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            max={5}
            step={0.1}
            placeholder="Min rating"
            value={ratingMin}
            onChange={(e) => setRatingMin(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            max={5}
            step={0.1}
            placeholder="Max rating"
            value={ratingMax}
            onChange={(e) => setRatingMax(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            {reviews.length === 0
              ? "No reviews in the system yet."
              : "No reviews match your filters."}
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
          <thead>
  <tr className="border-b text-muted-foreground">
    <th className="py-3 px-4 text-left font-medium">Employee</th>
    <th className="py-3 px-4 text-left font-medium">Department</th>
    <th className="py-3 px-4 text-center font-medium">Designation</th>
    <th className="py-3 px-4 text-center font-medium">Cycle</th>
    <th className="py-3 px-4 text-center font-medium">Stage</th>
    <th className="py-3 px-4 text-center font-medium">Rating</th>
    <th className="py-3 px-4 text-center font-medium">Open</th>
  </tr>
</thead>
            <tbody className="divide-y">
              {filtered.map((review) => (
                <tr key={review._id}  className="hover:bg-muted/40 transition-colors">
                 <td className="py-3 px-4 font-medium text-left">
                    {displayPersonName(review.employeeId)}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {displayDepartment(review.employeeId)}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {review.employeeId?.designation ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                     {review.cycleId?.name ?? "—"}
                   </td>
                    <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {formatWorkflowStageLabel(review.status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">
                    {review.overallRating != null && review.overallRating > 0
                      ? `${review.overallRating}/5`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="sm" className="rounded-md hover:scale-105 transition-transform" asChild>
                      <Link to={`/role/hr_manager/review/${review._id}`}>
                        <Gauge className="mr-1 h-4 w-4" />
                        Workflow
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
