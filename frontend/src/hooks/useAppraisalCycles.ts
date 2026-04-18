import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppraisalCycle, AppraisalCycleStatus } from "@/api/pmsApi";
import {
  createAppraisalCycle,
  deleteAppraisalCycle,
  fetchAppraisalCycleById,
  fetchAppraisalCycles,
  transitionAppraisalCycleStatus,
  type CreateAppraisalCyclePayload,
} from "@/api/pmsApi";

export const appraisalCyclesKeys = {
  all: ["appraisalCycles"] as const,
  list: (filters?: { status?: AppraisalCycleStatus; includeDeleted?: boolean }) =>
    [...appraisalCyclesKeys.all, "list", filters ?? {}] as const,
  detail: (id: string | undefined) => [...appraisalCyclesKeys.all, "detail", id ?? ""] as const,
};

export function useAppraisalCycles(filters?: {
  status?: AppraisalCycleStatus;
  includeDeleted?: boolean;
}) {
  const query = useQuery({
    queryKey: appraisalCyclesKeys.list(filters),
    queryFn: () => fetchAppraisalCycles(filters),
  });

  return {
    cycles: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useAppraisalCycle(id: string | undefined) {
  const query = useQuery({
    queryKey: appraisalCyclesKeys.detail(id),
    queryFn: () => fetchAppraisalCycleById(id as string),
    enabled: Boolean(id),
  });

  return {
    cycle: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export function useCreateAppraisalCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppraisalCyclePayload) => createAppraisalCycle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.all });
    },
  });
}

export function useTransitionCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Exclude<AppraisalCycleStatus, "draft">;
    }) => transitionAppraisalCycleStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: appraisalCyclesKeys.all });

      const previousDetail = queryClient.getQueryData<AppraisalCycle>(
        appraisalCyclesKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData<AppraisalCycle[]>({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === appraisalCyclesKeys.all[0] &&
          q.queryKey[1] === "list",
      });

      queryClient.setQueriesData<AppraisalCycle[]>(
        {
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === appraisalCyclesKeys.all[0] &&
            q.queryKey[1] === "list",
        },
        (old) => {
          if (!old) return old;
          return old.map((c) => (c._id === id ? { ...c, status } : c));
        }
      );

      queryClient.setQueryData<AppraisalCycle>(appraisalCyclesKeys.detail(id), (old) =>
        old ? { ...old, status } : old
      );

      return { previousDetail, previousLists };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previousDetail !== undefined) {
        queryClient.setQueryData(appraisalCyclesKeys.detail(id), ctx.previousDetail);
      }
      if (ctx?.previousLists) {
        for (const [key, data] of ctx.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.all });
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.detail(id) });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppraisalCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appraisalCyclesKeys.all });
    },
  });
}
