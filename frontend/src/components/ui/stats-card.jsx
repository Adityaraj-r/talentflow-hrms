import React from "react"
import { cn } from "@/lib/utils"

export const StatsCard = ({
  title,
  value,
  subtitle,
  description,
  trend,
  trendLabel,
  icon: Icon,
  variant = "blue",
  isActive = false,
  onClick,
}) => {
  const styles = {
    blue: {
      card: "border-blue-200/50 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5",
      active: "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] border-transparent",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      icon: "text-blue-600 dark:text-blue-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-blue-500",
      trendPositive: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    amber: {
      card: "border-amber-200/50 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5",
      active: "ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_15px_rgba(245,158,11,0.1)] border-transparent",
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      icon: "text-amber-600 dark:text-amber-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-amber-500",
      trendPositive: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    emerald: {
      card: "border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5",
      active: "ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] border-transparent",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-emerald-500",
      trendPositive: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    rose: {
      card: "border-rose-200/50 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5",
      active: "ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] border-transparent",
      iconBg: "bg-rose-100 dark:bg-rose-500/20",
      icon: "text-rose-600 dark:text-rose-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-rose-500",
      trendPositive: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    purple: {
      card: "border-purple-200/50 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/5",
      active: "ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_15px_rgba(168,85,247,0.1)] border-transparent",
      iconBg: "bg-purple-100 dark:bg-purple-500/20",
      icon: "text-purple-600 dark:text-purple-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-purple-500",
      trendPositive: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    indigo: {
      card: "border-indigo-200/50 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/5",
      active: "ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] dark:shadow-[0_0_15px_rgba(99,102,241,0.1)] border-transparent",
      iconBg: "bg-indigo-100 dark:bg-indigo-500/20",
      icon: "text-indigo-600 dark:text-indigo-400",
      label: "text-slate-600 dark:text-slate-400",
      value: "text-slate-900 dark:text-white",
      progress: "bg-indigo-500",
      trendPositive: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
  }

  // Map common aliases to standard styles
  styles.green = styles.emerald;
  styles.red = styles.rose;
  styles.orange = styles.amber;
  styles.yellow = styles.amber;
  styles.sky = styles.blue;

  const s = styles[variant] || styles.blue
  const isTrendPositive = typeof trend === 'number' ? trend >= 0 : true
  const subText = subtitle || description || trendLabel;

  return (
    <div
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      className={cn(
        "group relative flex flex-col justify-between w-full min-h-[140px] bg-background rounded-[16px] p-5 border shadow-sm transition-all duration-300 ease-out overflow-hidden",
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        s.card,
        isActive && s.active,
        !isActive && onClick && "opacity-90 hover:opacity-100"
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {Icon && (
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full transition-transform duration-500 group-hover:rotate-[12deg] group-hover:scale-110 shrink-0",
            s.iconBg
          )}>
            {React.isValidElement(Icon) 
              ? React.cloneElement(Icon, { className: cn("w-5 h-5", s.icon) }) 
              : <Icon className={cn("w-5 h-5", s.icon)} />}
          </div>
        )}
      </div>

      {/* Value and Subtitle Row */}
      <div className="flex flex-col relative z-10 mt-3">
        <div className="flex items-end gap-3">
          <span className="text-2xl sm:text-3xl font-bold text-foreground leading-none tracking-tight">
            {value !== undefined && value !== null ? value : "0"}
          </span>
          {trend !== undefined && (
            <span className={cn(
              "flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-0.5",
              isTrendPositive ? s.trendPositive : s.trendNegative
            )}>
              {isTrendPositive ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        {subText && (
          <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
            {subText}
          </p>
        )}
      </div>

      {/* Animated Bottom Progress Line */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-muted/30">
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out", 
            s.progress,
            "w-0 group-hover:w-full",
            isActive && "w-full"
          )} 
        />
      </div>
    </div>
  )
}
