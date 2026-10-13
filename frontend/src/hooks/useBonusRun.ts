import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchBonusPreview, runBonusForCycle, type BonusPreviewRow, type BonusRunResult } from "@/api/pmsApi";
import { appraisalCyclesKeys } from "@/hooks/useAppraisalCycles";

export function bonusPreviewKey(cycleId: string | null | undefined) {
  return ["bonusPreview", cycleId ?? ""] as const;
}

/** Read-only preview for a CLOSED / PROCESSED appraisal cycle */
export function useBonusPreview(cycleId: string | null | undefined) {
  const query = useQuery({
    queryKey: bonusPreviewKey(cycleId ?? null),
    queryFn: () => fetchBonusPreview(cycleId as string),
    enabled: Boolean(cycleId),
  });

  return {
    preview: query.data ?? ([] as BonusPreviewRow[]),
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export function useRunBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cycleId: string): Promise<BonusRunResult> => runBonusForCycle(cycleId),
    onSuccess: (data, cycleId) => {
      toast.success(
        `Bonus run completed (${data.processed} processed, ${data.skipped} skipped)`
      );
      if (data.errors.length > 0) {
        toast.message("Some rows logged warnings — see detail page.", {
          description: data.errors.slice(0, 3).join(" · "),
        });
      }
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.detail(cycleId) });
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.all });
      queryClient.invalidateQueries({ queryKey: bonusPreviewKey(cycleId) });
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "error" in err
          ? String((err as { error?: string }).error)
          : err instanceof Error
            ? err.message
            : "Bonus run failed";
      toast.error(msg);
    },
  });
}
