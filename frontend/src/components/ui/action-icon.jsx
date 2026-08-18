import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ActionIcon({
  icon: Icon,
  tooltip,
  onClick,
  variant = "ghost",
  disabled = false,
  className = "",
  iconClassName = "h-4 w-4 text-slate-500",
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors ${className}`}
          >
            <Icon className={iconClassName} />
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-semibold">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
