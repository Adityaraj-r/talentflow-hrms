import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const StatCard = ({ title, value, description, icon: Icon, borderColor, textColor, isLoading, onClick }) => {
  const isClickable = Boolean(onClick);

  return (
    <Card 
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      className={`relative border-l-4 ${borderColor} bg-card shadow-sm cursor-pointer transition-all duration-300 ease-out h-full min-h-[130px] flex flex-col ${
        isClickable 
          ? "group hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
          : ""
      }`}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col flex-grow justify-between">
        
        {/* Top Row: Title & Icon */}
        <div className="flex items-start justify-between gap-2 w-full">
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase leading-tight break-words mt-1">
            {title}
          </span>
          <div className={`p-1.5 sm:p-2 rounded-lg bg-muted/40 shrink-0 ${textColor} ${isClickable ? "transition-transform duration-300 group-hover:scale-110" : ""}`}>
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
        </div>
        
        {/* Bottom Row: Value & Description */}
        <div className="flex flex-col items-start mt-4 w-full">
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <span className={`text-2xl sm:text-3xl font-bold ${textColor} tracking-tight`}>
              {value !== undefined && value !== null ? value : "0"}
            </span>
          )}
          {description && (
            <span className="text-xs font-medium text-muted-foreground mt-1 truncate w-full">
              {description}
            </span>
          )}
        </div>
        
      </CardContent>
    </Card>
  );
};

export default StatCard;