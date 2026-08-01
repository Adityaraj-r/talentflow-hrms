import React from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PriorityDot({ priority, className }) {
  const p = (priority || "Medium").toUpperCase();
  const colorClass = 
    p === "HIGH" ? "bg-red-500" :
    p === "MEDIUM" ? "bg-orange-500" :
    p === "LOW" ? "bg-green-500" :
    p === "SUCCESS" ? "bg-emerald-500" :
    "bg-blue-500";
    
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center justify-center w-full", className)}>
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", colorClass)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{priority ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() : "Medium"} Priority</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
