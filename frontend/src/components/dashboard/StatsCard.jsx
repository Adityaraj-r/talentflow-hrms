import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const StatsCard = ({ title, value, description, subtitle, icon, variant = "blue", isLoading, onClick, isActive }) => {
  const isClickable = Boolean(onClick);
  const subText = subtitle || description;

  const styles = {
    blue: {
      card: "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200/80 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-500/15 hover:shadow-blue-500/5",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background",
    },
    green: {
      card: "bg-green-50/80 dark:bg-green-500/10 border-green-200/80 dark:border-green-500/30 hover:border-green-300 dark:hover:border-green-400/50 hover:bg-green-50 dark:hover:bg-green-500/15 hover:shadow-green-500/5",
      icon: "text-green-600 dark:text-green-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background",
    },
    orange: {
      card: "bg-orange-50/80 dark:bg-orange-500/10 border-orange-200/80 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-400/50 hover:bg-orange-50 dark:hover:bg-orange-500/15 hover:shadow-orange-500/5",
      icon: "text-orange-600 dark:text-orange-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-background",
    },
    yellow: {
      card: "bg-yellow-50/80 dark:bg-yellow-500/10 border-yellow-200/80 dark:border-yellow-500/30 hover:border-yellow-300 dark:hover:border-yellow-400/50 hover:bg-yellow-50 dark:hover:bg-yellow-500/15 hover:shadow-yellow-500/5",
      icon: "text-yellow-600 dark:text-yellow-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-background",
    },
    red: {
      card: "bg-red-50/80 dark:bg-red-500/10 border-red-200/80 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-400/50 hover:bg-red-50 dark:hover:bg-red-500/15 hover:shadow-red-500/5",
      icon: "text-red-600 dark:text-red-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background",
    },
    purple: {
      card: "bg-purple-50/80 dark:bg-purple-500/10 border-purple-200/80 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-400/50 hover:bg-purple-50 dark:hover:bg-purple-500/15 hover:shadow-purple-500/5",
      icon: "text-purple-600 dark:text-purple-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-background",
    },
    amber: {
      card: "bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-500/15 hover:shadow-amber-500/5",
      icon: "text-amber-600 dark:text-amber-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-background",
    },
    indigo: {
      card: "bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-200/80 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-400/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:shadow-indigo-500/5",
      icon: "text-indigo-600 dark:text-indigo-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      activeRing: "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-background",
    },
  };

  const s = styles[variant] || styles.blue;

  return (
    <div
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      className={cn(
        "relative rounded-xl border p-6 shadow-sm transition-all duration-300 ease-out cursor-pointer",
        isClickable && "group hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        s.card,
        isActive && s.activeRing,
        !isActive && isClickable && "opacity-85 hover:opacity-100"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", s.label)}>{title}</p>
          {isLoading ? (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <p className={cn("text-3xl font-bold tracking-tight mt-1.5", s.value)}>{value !== undefined && value !== null ? value : "0"}</p>
              {subText && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {subText}
                </p>
              )}
            </>
          )}
        </div>
        {icon && (
          <div className={cn("h-8 w-8 shrink-0 flex items-center justify-center transition-transform duration-300", isClickable && "group-hover:scale-110", s.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;