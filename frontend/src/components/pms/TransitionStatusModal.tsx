import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AppraisalCycleStatus } from "@/api/pmsApi";

const ORDER: AppraisalCycleStatus[] = ["draft", "active", "closed", "processed"];

function nextStatus(current: AppraisalCycleStatus): AppraisalCycleStatus | null {
  const i = ORDER.indexOf(current);
  if (i < 0 || i >= ORDER.length - 1) return null;
  return ORDER[i + 1];
}

function label(s: AppraisalCycleStatus): string {
  switch (s) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "closed":
      return "Closed";
    case "processed":
      return "Processed";
    default:
      return s;
  }
}

interface TransitionStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: AppraisalCycleStatus;
  cycleName: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
}

export function TransitionStatusModal({
  open,
  onOpenChange,
  currentStatus,
  cycleName,
  onConfirm,
  pending,
}: TransitionStatusModalProps) {
  const nxt = useMemo(() => nextStatus(currentStatus), [currentStatus]);
  const valid = nxt !== null;

  const warnProcessed =
    currentStatus === "closed" && nxt === "processed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update cycle status</DialogTitle>
          <DialogDescription className="space-y-3 text-left">
            <span className="block">
              <span className="font-medium text-foreground">{cycleName}</span>
            </span>
            <span className="block">
              Current status: <strong>{label(currentStatus)}</strong>
            </span>
            {!valid ? (
              <span className="block text-amber-600 dark:text-amber-500">
                This cycle is already at the final stage. No further transitions are available.
              </span>
            ) : (
              <>
                <span className="block">
                  Next status: <strong>{label(nxt!)}</strong>
                </span>
                {warnProcessed && (
                  <span className="block rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-foreground">
                    This will trigger bonus calculation for all employees in this cycle. Ensure reviews are
                    finalized before proceeding.
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid || pending}
            onClick={() => void onConfirm()}
          >
            {pending ? "Updating…" : "Confirm transition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
