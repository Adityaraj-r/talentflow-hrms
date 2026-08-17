import React from "react";
import { cn } from "@/lib/utils";

export const ReferralStatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "blue",
  isActive = false,
  onClick,
  loading = false,
}) => {
  const styles = {
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
      icon: "text-blue-600 dark:text-blue-400",
      accentBorder: "border-blue-100 dark:border-blue-900/40",
      hoverRing: "group-hover:border-blue-300 dark:group-hover:border-blue-700",
    },
    amber: {
      iconBg: "bg-amber-50 dark:bg-amber-950/50",
      icon: "text-amber-600 dark:text-amber-400",
      accentBorder: "border-amber-100 dark:border-amber-900/40",
      hoverRing: "group-hover:border-amber-300 dark:group-hover:border-amber-700",
    },
    purple: {
      iconBg: "bg-purple-50 dark:bg-purple-950/50",
      icon: "text-purple-600 dark:text-purple-400",
      accentBorder: "border-purple-100 dark:border-purple-900/40",
      hoverRing: "group-hover:border-purple-300 dark:group-hover:border-purple-700",
    },
    cyan: {
      iconBg: "bg-cyan-50 dark:bg-cyan-950/50",
      icon: "text-cyan-600 dark:text-cyan-400",
      accentBorder: "border-cyan-100 dark:border-cyan-900/40",
      hoverRing: "group-hover:border-cyan-300 dark:group-hover:border-cyan-700",
    },
    emerald: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
      icon: "text-emerald-600 dark:text-emerald-400",
      accentBorder: "border-emerald-100 dark:border-emerald-900/40",
      hoverRing: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
    },
    indigo: {
      iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
      icon: "text-indigo-600 dark:text-indigo-400",
      accentBorder: "border-indigo-100 dark:border-indigo-900/40",
      hoverRing: "group-hover:border-indigo-300 dark:group-hover:border-indigo-700",
    },
    rose: {
      iconBg: "bg-rose-50 dark:bg-rose-950/50",
      icon: "text-rose-600 dark:text-rose-400",
      accentBorder: "border-rose-100 dark:border-rose-900/40",
      hoverRing: "group-hover:border-rose-300 dark:group-hover:border-rose-700",
    },
    slate: {
      iconBg: "bg-slate-100 dark:bg-slate-800",
      icon: "text-slate-500 dark:text-slate-400",
      accentBorder: "border-slate-200 dark:border-slate-800",
      hoverRing: "group-hover:border-slate-300 dark:group-hover:border-slate-700",
    },
  };

  const s = styles[variant] || styles.blue;

  return (
    <div
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      className={cn(
        "group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-[124px] transition-all duration-300 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1",
        isActive && "shadow-md bg-slate-50/60 dark:bg-slate-850 border-slate-300 dark:border-slate-700"
      )}
    >
      {/* Background Micro Glow Effect on Hover */}
      <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none bg-current text-indigo-500" />

      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-2xs",
              s.iconBg,
              s.icon,
              s.accentBorder,
              s.hoverRing
            )}
          >
            {React.isValidElement(Icon) ? (
              React.cloneElement(Icon, { className: "w-4.5 h-4.5 transition-transform group-hover:scale-105" })
            ) : (
              <Icon className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
            )}
          </div>
        )}
      </div>

      <div className="mt-1">
        {loading ? (
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md my-1" />
        ) : (
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums group-hover:scale-[1.02] origin-left transition-transform duration-200">
            {value !== undefined && value !== null ? value : "0"}
          </div>
        )}
        {subtitle && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReferralStatsCard;
