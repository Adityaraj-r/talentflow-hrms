import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye, Archive } from "lucide-react";
import { format } from "date-fns";
import type { AppraisalCycle, AppraisalCycleStatus } from "@/api/pmsApi";
import { useAppraisalCycles, useDeleteCycle, useTransitionCycle } from "@/hooks/useAppraisalCycles";
import { CreateCycleModal } from "@/components/pms/CreateCycleModal";
import { TransitionStatusModal } from "@/components/pms/TransitionStatusModal";
import { toast } from "sonner";

function normalizeRole(role: unknown): string {
  const r = typeof role === "string" ? role : (role as { name?: string })?.name || "";
  return r.toUpperCase().replace(/\s+/g, "_");
}

function statusBadgeVariant(
  status: AppraisalCycleStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "closed":
      return "secondary";
    case "processed":
      return "outline";
    default:
      return "secondary";
  }
}

function cycleLabel(status: AppraisalCycleStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AppraisalCyclesPage() {
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

  const canCreate = role === "HR_MANAGER" || role === "HR_OFFICER";
  const canTransition = role === "HR_MANAGER" || role === "HR_OFFICER";
  const canDelete = role === "HR_MANAGER";

  const { cycles, loading, error, refetch } = useAppraisalCycles();
  const transition = useTransitionCycle();
  const del = useDeleteCycle();

  const [createOpen, setCreateOpen] = useState(false);
  const [transitionCycle, setTransitionCycle] = useState<AppraisalCycle | null>(null);
  const [deleteCycle, setDeleteCycle] = useState<AppraisalCycle | null>(null);

  const sorted = useMemo(
    () => [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [cycles]
  );

  const handleTransitionConfirm = async () => {
    if (!transitionCycle) return;
    const order: AppraisalCycleStatus[] = ["draft", "active", "closed", "processed"];
    const i = order.indexOf(transitionCycle.status);
    const nxt = order[i + 1];
    if (!nxt || nxt === "draft") {
      toast.error("Invalid transition");
      return;
    }
    try {
      await transition.mutateAsync({
        id: transitionCycle._id,
        status: nxt as Exclude<AppraisalCycleStatus, "draft">,
      });
      toast.success("Status updated");
      setTransitionCycle(null);
    } catch {
      toast.error("Could not update status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteCycle) return;
    try {
      await del.mutateAsync(deleteCycle._id);
      toast.success("Cycle archived");
      setDeleteCycle(null);
      await refetch();
    } catch {
      toast.error("Could not delete cycle");
    }
  };

  if (!canSee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appraisal cycles</CardTitle>
          <CardDescription>You do not have access to this area.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Appraisal cycles</h1>
            <p className="text-muted-foreground">
              Payroll bonus settlement is tied to cycle status (draft → active → closed → processed).
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create cycle
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              No appraisal cycles yet.
              {canCreate ? " Create one to wrap a performance cycle." : ""}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All cycles</CardTitle>
              <CardDescription>{sorted.length} cycle(s)</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-center font-medium">Dates</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-left">{c.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground whitespace-nowrap">
                        {format(new Date(c.startDate), "MMM d, yyyy")} –{" "}
                        {format(new Date(c.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canTransition ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex"
                                onClick={() => setTransitionCycle(c)}
                              >
                                <Badge variant={statusBadgeVariant(c.status)} className="cursor-pointer">
                                  {cycleLabel(c.status)}
                                </Badge>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Change status</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant={statusBadgeVariant(c.status)}>{cycleLabel(c.status)}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      className="rounded-md hover:scale-105 transition-transform"
      asChild
    >
     <Link
  to={`/pms/appraisal-cycles/${c._id}`}
  className="inline-flex items-center justify-center"
>
  <Eye className="h-4 w-4" />
</Link>
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Review</p>
  </TooltipContent>
</Tooltip>
                          {canDelete && (
                            <Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md text-destructive hover:scale-105 transition-transform"
      onClick={() => setDeleteCycle(c)}
      aria-label="Delete cycle"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Delete</p>
  </TooltipContent>
</Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <CreateCycleModal open={createOpen} onOpenChange={setCreateOpen} />

        <TransitionStatusModal
          open={Boolean(transitionCycle)}
          onOpenChange={(o) => !o && setTransitionCycle(null)}
          currentStatus={transitionCycle?.status ?? "draft"}
          cycleName={transitionCycle?.name ?? ""}
          onConfirm={handleTransitionConfirm}
          pending={transition.isPending}
        />

        <Dialog open={Boolean(deleteCycle)} onOpenChange={(o) => !o && setDeleteCycle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive appraisal cycle?</DialogTitle>
              <DialogDescription>
                This soft-deletes the wrapper for{" "}
                <strong>{deleteCycle?.name}</strong>. Performance reviews are not deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" type="button" onClick={() => setDeleteCycle(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                disabled={del.isPending}
                onClick={() => void confirmDelete()}> <span title="Archive" className="flex items-center justify-center w-full h-full "><Archive className="h-4 w-4" /><span className="sr-only">Archive</span></span></Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
