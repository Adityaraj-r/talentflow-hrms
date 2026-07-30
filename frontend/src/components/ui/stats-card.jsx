import { cn } from "@/lib/utils";

export const StatsCard = ({ title, value, icon, variant = "blue", isActive, onClick }) => {
  const styles = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background",
    },
    green: {
      card: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background",
    },
    orange: {
      card: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
      icon: "text-orange-600 dark:text-orange-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-background",
    },
    yellow: {
      card: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30",
      icon: "text-yellow-600 dark:text-yellow-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-background",
    },
    red: {
      card: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background",
    },
    purple: {
      card: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
      icon: "text-purple-600 dark:text-purple-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-background",
    },
    amber: {
      card: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
      label: "text-gray-600 dark:text-gray-400",
      value: "text-gray-900 dark:text-white",
      activeRing: "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-background",
    },
  };

  const s = styles[variant] || styles.blue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:scale-105",
        s.card,
        isActive && s.activeRing,
        !isActive && onClick && "opacity-80 hover:opacity-100"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm", s.label)}>{title}</p>
          <p className={cn("text-3xl font-bold mt-2", s.value)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8", s.icon)}>{icon}</div>
      </div>
    </div>
  );
};
