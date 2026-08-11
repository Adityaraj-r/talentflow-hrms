import * as React from "react"

import { cn, formatChildren } from "@/lib/utils"

function Card({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card"
      className={cn(
       "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col gap-4 rounded-[20px] border border-slate-100 dark:border-slate-800 p-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all",
        className
      )}
      {...props} />)
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 p-6 pb-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />)
  );
}

function CardTitle({
  className,
  children,
  ...props
}) {
  return (
    (<div
      data-slot="card-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}>{formatChildren(children)}</div>)
  );
}

function CardDescription({
  className,
  children,
  ...props
}) {
  return (
    (<div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}>{formatChildren(children)}</div>)
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />)
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("p-6 pt-2", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-footer"
      className={cn("flex items-center px-5 [.border-t]:pt-5", className)}
      {...props} />)
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
