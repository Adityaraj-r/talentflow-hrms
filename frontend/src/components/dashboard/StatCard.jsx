import React from "react";
import { cn } from "@/lib/utils";

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  borderColor,
  textColor,
  isLoading,
  isActive,
  onClick,
}) => {
  // Extract color theme based on provided border or text color classes
  let color = "blue";
  if (borderColor) {
    if (borderColor.includes("blue")) color = "blue";
    else if (borderColor.includes("green") || borderColor.includes("emerald")) color = "emerald";
    else if (borderColor.includes("yellow") || borderColor.includes("amber") || borderColor.includes("orange")) color = "amber";
    else if (borderColor.includes("red") || borderColor.includes("rose")) color = "rose";
    else if (borderColor.includes("slate") || borderColor.includes("gray")) color = "slate";
  } else if (textColor) {
    if (textColor.includes("blue")) color = "blue";
    else if (textColor.includes("green") || textColor.includes("emerald")) color = "emerald";
    else if (textColor.includes("yellow") || textColor.includes("amber")) color = "amber";
    else if (textColor.includes("red") || textColor.includes("rose")) color = "rose";
    else if (textColor.includes("slate") || textColor.includes("gray")) color = "slate";
  }

  const styles = {
    blue: {
      card: "bg-purple-500/5 border-purple-500/30",
      hover: "hover:border-purple-500/60",
      active: "border-purple-500 bg-purple-500/10",
      iconBg: "bg-purple-500/20",
      text: "text-purple-400",
    },
    amber: {
      card: "bg-amber-500/5 border-amber-500/30",
      hover: "hover:border-amber-500/60",
      active: "border-amber-500 bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      text: "text-amber-400",
    },
    emerald: {
      card: "bg-emerald-500/5 border-emerald-500/30",
      hover: "hover:border-emerald-500/60",
      active: "border-emerald-500 bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
      text: "text-emerald-400",
    },
    rose: {
      card: "bg-rose-500/5 border-rose-500/30",
      hover: "hover:border-rose-500/60",
      active: "border-rose-500 bg-rose-500/10",
      iconBg: "bg-rose-500/20",
      text: "text-rose-400",
    },
    slate: {
      card: "bg-slate-500/5 border-slate-500/30",
      hover: "hover:border-slate-500/60",
      active: "border-slate-500 bg-slate-500/10",
      iconBg: "bg-slate-500/20",
      text: "text-slate-400",
    },
  };

  const s = styles[color] || styles.blue;
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      className={cn(
        "group relative flex flex-col justify-between w-full min-h-[130px] rounded-[16px] p-4 sm:p-5 border shadow-sm transition-all duration-300 ease-out",
        s.card,
        isClickable && "cursor-pointer hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isClickable && !isActive && s.hover,
        isActive && s.active,
        borderColor && `border-l-4 ${borderColor}`
      )}
    >
      {/* Top Row: Title & Icon */}
      <div className="flex items-start justify-between gap-2 w-full relative z-10">
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase leading-tight break-words mt-1">
          {title}
        </span>
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-transform duration-300 shrink-0",
            s.iconBg,
            isClickable && "group-hover:scale-110",
            textColor
          )}
        >
          {Icon && (
            React.isValidElement(Icon)
              ? React.cloneElement(Icon, { className: cn("w-4 h-4 sm:w-5 sm:h-5", Icon.props.className) })
              : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
      </div>

      {/* Bottom Row: Value & Description */}
      <div className="flex flex-col items-start mt-4 w-full relative z-10">
        {isLoading ? (
          <div className="h-8 w-16 bg-muted/50 animate-pulse rounded"></div>
        ) : (
          <span className={cn("text-2xl sm:text-3xl font-bold tracking-tight", textColor || s.text)}>
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

