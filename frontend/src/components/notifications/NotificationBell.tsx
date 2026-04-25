import { useCallback, useMemo, useRef } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkRead } from "@/hooks/useNotifications";
import type { NotificationItem } from "@/api/pmsApi";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const POLL_MS = 30_000;

export function NotificationBell() {
  const { items, refetch } = useNotifications({
    limit: 50,
    skip: 0,
    pollIntervalMs: POLL_MS,
  });

  const markRead = useMarkRead();
  const unreadCount = useMemo(() => items.filter((n: NotificationItem) => !n.readAt).length, [items]);

  /** Track last open cycle to avoid duplicate marking */
  const markingRef = useRef(false);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (!open || markingRef.current) return;
      const unreadIds = items.filter((n: NotificationItem) => !n.readAt).map((n) => n._id);
      if (unreadIds.length === 0) return;
      markingRef.current = true;
      try {
        await Promise.all(unreadIds.map((id: string) => markRead.mutateAsync(id)));
      } finally {
        markingRef.current = false;
        await refetch();
      }
    },
    [items, markRead, refetch]
  );

  const handleSelect = useCallback(
    (n: NotificationItem) => {
      if (!n.readAt) {
        markRead.mutate(n._id);
      }
    },
    [markRead]
  );

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative focus:outline-none" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <NotificationDropdown items={items} onSelect={handleSelect} />
    </DropdownMenu>
  );
}
