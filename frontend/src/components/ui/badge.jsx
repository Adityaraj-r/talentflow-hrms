import * as React from "react"
import { formatChildren } from "@/lib/utils"

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
  success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200",
  warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-200",
  danger: "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-200",
  info: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 hover:bg-purple-200",
}

function Badge({ className = "", variant = "default", children, ...props }) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  const variantClasses = badgeVariants[variant] || badgeVariants.default
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {formatChildren(children)}
    </div>
  )
}

export { Badge, badgeVariants }
