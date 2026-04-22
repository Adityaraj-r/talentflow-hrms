import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationItem } from "@/api/pmsApi";
import { fetchNotifications, markNotificationRead } from "@/api/pmsApi";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (params?: { limit?: number; skip?: number; unreadOnly?: boolean }) =>
    [...notificationsKeys.all, params ?? {}] as const,
};

export function useNotifications(filters?: {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
  pollIntervalMs?: number;
}) {
  const interval = filters?.pollIntervalMs ?? false;

  const query = useQuery({
    queryKey: notificationsKeys.list({
      limit: filters?.limit,
      skip: filters?.skip,
      unreadOnly: filters?.unreadOnly,
    }),
    queryFn: () =>
      fetchNotifications({
        limit: filters?.limit ?? 30,
        skip: filters?.skip ?? 0,
        unreadOnly: filters?.unreadOnly,
      }),
    refetchInterval: typeof interval === "number" ? interval : false,
  });

  const items = query.data?.items ?? [];
  const unreadCount = items.filter((n: NotificationItem) => !n.readAt).length;

  return {
    items,
    total: query.data?.total ?? 0,
    unreadCount,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.all });
      const previous = queryClient.getQueriesData({ queryKey: notificationsKeys.all });

      queryClient.setQueriesData<{ items: NotificationItem[]; total: number }>(
        {
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === notificationsKeys.all[0],
        },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((n) =>
              n._id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
            ),
          };
        }
      );

      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
