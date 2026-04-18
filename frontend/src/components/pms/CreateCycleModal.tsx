import { useEffect, useState } from "react";
import { format } from "date-fns";
import performanceApi from "@/services/performanceApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useCreateAppraisalCycle } from "@/hooks/useAppraisalCycles";
import { toast } from "sonner";

type PerfCycle = {
  _id: string;
  name?: string;
  status?: string;
};

function parseCycles(res: unknown): PerfCycle[] {
  if (!res || typeof res !== "object") return [];
  const r = res as { data?: PerfCycle[] };
  if (Array.isArray(r.data)) return r.data;
  return Array.isArray(res) ? (res as PerfCycle[]) : [];
}

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCycleModal({ open, onOpenChange }: CreateCycleModalProps) {
  const createMutation = useCreateAppraisalCycle();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [performanceCycleId, setPerformanceCycleId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [perfCycles, setPerfCycles] = useState<PerfCycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingCycles(true);
        const res = await performanceApi.getCycles();
        if (!cancelled) setPerfCycles(parseCycles(res));
      } catch {
        toast.error("Could not load performance cycles");
        setPerfCycles([]);
      } finally {
        if (!cancelled) setLoadingCycles(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reset = () => {
    setName("");
    setDescription("");
    setPerformanceCycleId("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    if (!performanceCycleId) {
      toast.error("Select a performance cycle");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: trimmed,
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        performanceCycleId,
      });
      toast.success("Appraisal cycle created");
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "error" in err
          ? String((err as { error?: string }).error)
          : "Could not create cycle";
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create appraisal cycle</DialogTitle>
          <DialogDescription>
            Wraps an existing performance cycle with appraisal workflow and bonus settlement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pms-ac-name">Name *</Label>
            <Input
              id="pms-ac-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FY25 H1 Appraisal"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pms-ac-desc">Description</Label>
            <Textarea
              id="pms-ac-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional context for HR and managers"
            />
          </div>
          <div className="space-y-2">
            <Label>Performance cycle *</Label>
            <Select
              value={performanceCycleId}
              onValueChange={setPerformanceCycleId}
              disabled={loadingCycles}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCycles ? "Loading…" : "Select cycle"} />
              </SelectTrigger>
              <SelectContent>
                {perfCycles.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name ?? c._id} {c.status ? `(${c.status})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
