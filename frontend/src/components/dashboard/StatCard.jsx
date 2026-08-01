import React from "react";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value, description, icon: Icon, borderColor, textColor, isLoading, isActive, onClick }) => {
  // Extract color name from classes like border-l-blue-500 or text-blue-500
  let color = "blue";
  if (borderColor) {
    if (borderColor.includes("blue")) color = "blue";
    else if (borderColor.includes("green") || borderColor.includes("emerald")) color = "emerald";
    else if (borderColor.includes("yellow") || borderColor.includes("amber") || borderColor.includes("orange")) color = "amber";
    else if (borderColor.includes("red") || borderColor.includes("rose")) color = "rose";
    else if (borderColor.includes("purple") || borderColor.includes("violet")) color = "blue"; // fallback
    else if (borderColor.includes("slate") || borderColor.includes("gray")) color = "slate";
  } else if (textColor) {
    if (textColor.includes("blue")) color = "blue";
    else if (textColor.includes("green")) color = "emerald";
    else if (textColor.includes("yellow") || textColor.includes("amber")) color = "amber";
    else if (textColor.includes("red")) color = "rose";
  }


  const styles = {
    blue: {
      card: "bg-blue-500/5 border-blue-500/30",
      hover: "hover:border-blue-500/60",
      active: "border-blue-500 bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      icon: "text-blue-400",
      text: "text-blue-400",
      trendPositive: "text-blue-400 bg-blue-500/20",
      trendNegative: "text-rose-400 bg-rose-500/20",
    },
    amber: {
      card: "bg-amber-500/5 border-amber-500/30",
      hover: "hover:border-amber-500/60",
      active: "border-amber-500 bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      icon: "text-amber-400",
      text: "text-amber-400",
      trendPositive: "text-amber-400 bg-amber-500/20",
      trendNegative: "text-rose-400 bg-rose-500/20",
    },
    emerald: {
      card: "bg-emerald-500/5 border-emerald-500/30",
      hover: "hover:border-emerald-500/60",
      active: "border-emerald-500 bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
      icon: "text-emerald-400",
      text: "text-emerald-400",
      trendPositive: "text-emerald-400 bg-emerald-500/20",
      trendNegative: "text-rose-400 bg-rose-500/20",
    },
    rose: {
      card: "bg-rose-500/5 border-rose-500/30",
      hover: "hover:border-rose-500/60",
      active: "border-rose-500 bg-rose-500/10",
      iconBg: "bg-rose-500/20",
      icon: "text-rose-400",
      text: "text-rose-400",
      trendPositive: "text-emerald-400 bg-emerald-500/20",
      trendNegative: "text-rose-400 bg-rose-500/20",
    },
    slate: {
      card: "bg-slate-500/5 border-slate-500/30",
      hover: "hover:border-slate-500/60",
      active: "border-slate-500 bg-slate-500/10",
      iconBg: "bg-slate-500/20",
      icon: "text-slate-400",
      text: "text-slate-400",
      trendPositive: "text-slate-400 bg-slate-500/20",
      trendNegative: "text-rose-400 bg-rose-500/20",
    }
  }

  const s = styles[color] || styles.blue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between w-full min-h-[130px] bg-[#0F1629]/90 backdrop-blur-md rounded-[16px] p-4 sm:p-5 border shadow-sm transition-all duration-200 ease-in-out",
        s.card,
        (onClick || isActive) && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        (onClick || isActive) && !isActive && s.hover,
        isActive && s.active,
      )}
    >
      {/* Top Row: Title & Icon */}
      <div className="flex items-start justify-between gap-2 w-full relative z-10">
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase leading-tight break-words mt-1">
          {title}
        </span>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-transform duration-500 shrink-0",
          s.iconBg
        )}>
          {Icon && (React.isValidElement(Icon) ? React.cloneElement(Icon, { className: "w-4 h-4 sm:w-5 sm:h-5" }) : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />)}
        </div>
      </div>
      
      {/* Bottom Row: Value & Description */}
      <div className="flex flex-col items-start mt-4 w-full relative z-10">
        {isLoading ? (
          <div className="h-8 w-16 bg-muted/50 animate-pulse rounded"></div>
        ) : (
          <span className={cn("text-2xl sm:text-3xl font-bold tracking-tight", s.text)}>
            {value !== undefined && value !== null ? value : "0"}
          </span>
        )}
        {description && (
          <span className="text-xs font-medium text-muted-foreground mt-1 truncate w-full">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;

