import React from "react"
import { cn } from "@/lib/utils"

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  variant = "blue",
  isActive = false,
  onClick,
}) => {
  const styles = {
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      icon: "text-blue-600 dark:text-blue-400",
    },
    amber: {
      iconBg: "bg-amber-50 dark:bg-amber-900/30",
      icon: "text-amber-600 dark:text-amber-400",
    },
    emerald: {
      iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    rose: {
      iconBg: "bg-rose-50 dark:bg-rose-900/30",
      icon: "text-rose-600 dark:text-rose-400",
    },
    purple: {
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      icon: "text-purple-600 dark:text-purple-400",
    },
    indigo: {
      iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
      icon: "text-indigo-600 dark:text-indigo-400",
    },
    slate: {
      iconBg: "bg-slate-50 dark:bg-slate-800",
      icon: "text-slate-500 dark:text-slate-400",
    }
  }

  // Map common aliases to standard styles
  styles.green = styles.emerald;
  styles.red = styles.rose;
  styles.orange = styles.amber;
  styles.yellow = styles.amber;
  styles.sky = styles.blue;
  styles.default = styles.slate;

  const s = styles[variant] || styles.slate;

  return (
    <div
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[120px] transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5",
        isActive && "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] bg-slate-50/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700"
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", s.iconBg, s.icon)}>
            {React.isValidElement(Icon) 
              ? React.cloneElement(Icon, { className: "w-4 h-4" }) 
              : <Icon className="w-4 h-4" />}
          </div>
        )}
      </div>
      <span className="text-3xl font-bold text-slate-900 dark:text-white">
        {value !== undefined && value !== null ? value : "0"}
      </span>
    </div>
  )
}
export default StatsCard;
