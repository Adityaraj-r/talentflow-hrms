import React from "react"
import { cn } from "@/lib/utils"

export const StatsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  variant,
  isActive = false,
  onClick,
}) => {

  const styles = {
    blue: {
      card: "bg-blue-500/5 border-blue-500/30",
      hover: "hover:border-blue-500/60",
      active: "border-blue-500 bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      icon: "text-blue-500",
      text: "text-blue-500",
      trendPositive: "text-blue-500 bg-blue-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    amber: {
      card: "bg-amber-500/5 border-amber-500/30",
      hover: "hover:border-amber-500/60",
      active: "border-amber-500 bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      icon: "text-amber-500",
      text: "text-amber-500",
      trendPositive: "text-amber-500 bg-amber-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    emerald: {
      card: "bg-emerald-500/5 border-emerald-500/30",
      hover: "hover:border-emerald-500/60",
      active: "border-emerald-500 bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
      icon: "text-emerald-500",
      text: "text-emerald-500",
      trendPositive: "text-emerald-500 bg-emerald-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    rose: {
      card: "bg-rose-500/5 border-rose-500/30",
      hover: "hover:border-rose-500/60",
      active: "border-rose-500 bg-rose-500/10",
      iconBg: "bg-rose-500/20",
      icon: "text-rose-500",
      text: "text-rose-500",
      trendPositive: "text-emerald-500 bg-emerald-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    slate: {
      card: "bg-slate-500/5 border-slate-500/30",
      hover: "hover:border-slate-500/60",
      active: "border-slate-500 bg-slate-500/10",
      iconBg: "bg-slate-500/20",
      icon: "text-slate-500",
      text: "text-slate-500",
      trendPositive: "text-slate-500 bg-slate-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    yellow: {
      card: "bg-yellow-500/5 border-yellow-500/30",
      hover: "hover:border-yellow-500/60",
      active: "border-yellow-500 bg-yellow-500/10",
      iconBg: "bg-yellow-500/20",
      icon: "text-yellow-600 dark:text-yellow-500",
      text: "text-yellow-600 dark:text-yellow-500",
      trendPositive: "text-emerald-500 bg-emerald-500/20",
      trendNegative: "text-rose-500 bg-rose-500/20",
    },
    darkred: {
      card: "bg-red-800/5 border-red-800/30 dark:bg-red-900/10 dark:border-red-900/40",
      hover: "hover:border-red-800/60",
      active: "border-red-800 bg-red-800/10",
      iconBg: "bg-red-800/20 dark:bg-red-900/30",
      icon: "text-red-700 dark:text-red-500",
      text: "text-red-700 dark:text-red-500",
      trendPositive: "text-emerald-500 bg-emerald-500/20",
      trendNegative: "text-red-700 bg-red-800/20",
    }
  }
  
  // Map common aliases to standard styles
  styles.green = styles.emerald;
  styles.red = styles.rose;
  styles.orange = styles.amber;
  styles.sky = styles.blue;

  let computedVariant = variant || "blue";
  
  // Enforce semantic enterprise colors across all dashboards based on meaning
  const titleLower = (title || "").toLowerCase();
  
  if (titleLower.includes("cancel") || titleLower.includes("reject") || titleLower.includes("decline")) {
    computedVariant = "darkred";
  } else if (titleLower.includes("overdue") || titleLower.includes("critical") || titleLower.includes("late") || titleLower.includes("absent") || titleLower.includes("expiring")) {
    computedVariant = "rose";
  } else if (titleLower.includes("pending") || titleLower.includes("review") || titleLower.includes("draft") || titleLower.includes("waiting") || titleLower.includes("due")) {
    computedVariant = "yellow";
  } else if (titleLower.includes("progress") || titleLower.includes("active") || titleLower.includes("ongoing") || titleLower.includes("leave") || titleLower.includes("approval")) {
    computedVariant = "amber";
  } else if (titleLower.includes("completed") || titleLower.includes("success") || titleLower.includes("approved") || titleLower.includes("present") || titleLower.includes("accepted") || titleLower.includes("released") || titleLower.includes("done")) {
    computedVariant = "emerald";
  } else if (titleLower.includes("total") || titleLower.includes("overview") || titleLower.includes("all")) {
    computedVariant = "blue";
  }

  const s = styles[computedVariant] || styles.blue
  const isTrendPositive = typeof trend === 'number' ? trend >= 0 : true

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between w-full h-[160px] bg-[#0F1629]/90 backdrop-blur-md rounded-[16px] p-6 border shadow-sm transition-all duration-200 ease-in-out",
        s.card,
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        onClick && !isActive && s.hover,
        isActive && s.active,
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <h3 className="text-[16px] font-semibold text-muted-foreground tracking-tight">{title}</h3>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-500 ",
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

    </div>
  )
}
