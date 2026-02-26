import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const StatCard = ({ title, value, description, icon: Icon, borderColor, textColor, isLoading }) => {
  return (
    <Card className={`border-l-4 ${borderColor} bg-card shadow-sm hover:shadow-md transition-shadow h-full min-h-[130px] flex flex-col`}>
      {/* Reduced padding slightly from p-5 to p-4 to give the text more horizontal breathing room */}
      <CardContent className="p-4 sm:p-5 flex flex-col flex-grow justify-between">
        
        {/* Top Row: Title & Icon */}
        <div className="flex items-start justify-between gap-2 w-full">
          {/* 1. Removed 'truncate' and 'tracking-wider'
            2. Added 'break-words' and 'leading-tight' so it wraps neatly to two lines if needed 
          */}
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase leading-tight break-words mt-1">
            {title}
          </span>
          {/* Added shrink-0 so the icon never gets squished by long text */}
          <div className={`p-1.5 sm:p-2 rounded-lg bg-muted/30 shrink-0 ${textColor}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <span className="text-xs font-medium text-muted-foreground mt-1 truncate w-full">
            {description}
          </span>
        </div>
        
      </CardContent>
    </Card>
  );
};

export default StatCard;