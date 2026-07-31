import React from "react"
import { cn } from "@/lib/utils"

export const StatsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  variant = "blue",
  isActive = false,
  onClick,
}) => {
  const styles = {
    blue: {
      card: "border-blue-200/50 dark:border-blue-500/20",
      active: "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] border-transparent",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      icon: "text-blue-600 dark:text-blue-400",
      progress: "bg-blue-500",
      trendPositive: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    amber: {
      card: "border-amber-200/50 dark:border-amber-500/20",
      active: "ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_15px_rgba(245,158,11,0.1)] border-transparent",
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      icon: "text-amber-600 dark:text-amber-400",
      progress: "bg-amber-500",
      trendPositive: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    emerald: {
      card: "border-emerald-200/50 dark:border-emerald-500/20",
      active: "ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] border-transparent",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      progress: "bg-emerald-500",
      trendPositive: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    },
    rose: {
      card: "border-rose-200/50 dark:border-rose-500/20",
      active: "ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] border-transparent",
      iconBg: "bg-rose-100 dark:bg-rose-500/20",
      icon: "text-rose-600 dark:text-rose-400",
      progress: "bg-rose-500",
      trendPositive: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20",
      trendNegative: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
    }
  }

  // Map common aliases to standard styles
  styles.green = styles.emerald;
  styles.red = styles.rose;
  styles.orange = styles.amber;
  styles.sky = styles.blue;

  const s = styles[variant] || styles.blue
  const isTrendPositive = typeof trend === 'number' ? trend >= 0 : true

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between w-full h-[160px] bg-background rounded-[16px] p-6 border shadow-sm transition-all duration-300 ease-out overflow-hidden",
        onClick && "cursor-pointer hover:-translate-y-[4px] hover:shadow-md",
        s.card,
        isActive && s.active,
        !isActive && onClick && "opacity-90 hover:opacity-100"
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <h3 className="text-[16px] font-semibold text-muted-foreground tracking-tight">{title}</h3>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-110",
          s.iconBg
        )}>
          {Icon && (
            React.isValidElement(Icon) 
              ? React.cloneElement(Icon, { className: cn("w-5 h-5", s.icon) }) 
              : <Icon className={cn("w-5 h-5", s.icon)} />
          )}
        </div>
      </div>

      {/* Value and Subtitle Row */}
      <div className="flex flex-col relative z-10 mt-auto">
        <div className="flex items-end gap-3">
          <span className="text-[40px] font-bold text-foreground leading-none tracking-tight">{value}</span>
          {trend !== undefined && (
            <span className={cn(
              "flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium mb-1",
              isTrendPositive ? s.trendPositive : s.trendNegative
            )}>
              {isTrendPositive ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <p className="text-[14px] font-medium text-muted-foreground mt-1 truncate">
          {subtitle || trendLabel || "Total records"}
        </p>
      </div>

      {/* Animated Bottom Progress Line */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-muted/30">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-out", 
            s.progress,
            "w-0 group-hover:w-full",
            isActive && "w-full"
          )} 
        />
      </div>
    </div>
  )
}
